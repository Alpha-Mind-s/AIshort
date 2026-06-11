"""
AI shot — AI Worker 主入口

监听 RabbitMQ 队列，消费 AI 任务消息，调度各管线模块处理。
通过 API Gateway 回调更新任务状态（方案二：API 回调模式）。
"""

import json
import signal
from pathlib import Path

import pika
from loguru import logger

from config import settings
from api_client import api_client
from asr import ASRProcessor
from translate import TranslationProcessor
from dubbing import DubbingProcessor
from lipsync import LipSyncProcessor


class AIWorker:
    """AI 管线 Worker — RabbitMQ 消费者"""

    def __init__(self):
        self.running = True
        self.connection = None
        self.channel = None

        # 初始化各管线处理器
        self.asr = ASRProcessor()
        self.translator = TranslationProcessor()
        self.dubber = DubbingProcessor()
        self.lipsyncer = LipSyncProcessor()

        # 队列 → 处理器 映射
        self.handlers = {
            settings.QUEUE_ASR: self.asr,
            settings.QUEUE_TRANSLATE: self.translator,
            settings.QUEUE_DUBBING: self.dubber,
            settings.QUEUE_LIPSYNC: self.lipsyncer,
        }

    # ------------------------------------------------------------------
    # 连接管理
    # ------------------------------------------------------------------

    def connect(self):
        """建立 RabbitMQ 连接"""
        logger.info("连接 RabbitMQ: {}", settings.RABBITMQ_ADDR)
        params = pika.URLParameters(settings.RABBITMQ_ADDR)
        params.heartbeat = 300
        params.blocked_connection_timeout = 300

        self.connection = pika.BlockingConnection(params)
        self.channel = self.connection.channel()

        # 声明队列（持久化）
        for q in self.handlers:
            self.channel.queue_declare(queue=q, durable=True)
            logger.info("队列就绪: {}", q)

    def close(self):
        """关闭连接"""
        if self.channel:
            self.channel.close()
        if self.connection:
            self.connection.close()
        logger.info("RabbitMQ 连接已关闭")

    # ------------------------------------------------------------------
    # 消息处理
    # ------------------------------------------------------------------

    def handle_message(self, channel, method, properties, body):
        """
        处理单条消息 — 分发到对应管线处理器

        消息格式:
        {
            "job_id": 123,
            "episode_id": 456,
            "job_type": "asr",
            "input": {
                "audio_url": "s3://bucket/audio.mp3",
                "source_lang": "zh",
                "target_lang": "en"
            }
        }
        """
        try:
            msg = json.loads(body)
            job_id = msg.get("job_id")
            job_type = msg.get("job_type", "")
            episode_id = msg.get("episode_id")

            logger.info("收到任务 [job={}] type={} episode={}", job_id, job_type, episode_id)

            handler = self.handlers.get(f"ai:{job_type}")
            if handler is None:
                logger.error("未知任务类型: {}", job_type)
                channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
                return

            # ① 回调 API：任务状态 → processing
            api_client.update_job_status(job_id, "processing")

            # ② 执行管线处理
            result = handler.process(msg)

            # ③ 回调 API：任务状态 → completed（写入 result_meta）
            api_client.update_job_status(job_id, "completed", result_meta=result)

            # ④ 写入 localizations 表（每个模块完成后写入对应字段）
            self._update_localization(msg, result)

            # ⑤ 触发下游任务（如 ASR → 翻译 → 配音 → 口型同步）
            self._enqueue_next_task(msg, result)

            channel.basic_ack(delivery_tag=method.delivery_tag)
            logger.info("任务完成 [job={}]", job_id)

        except Exception as exc:
            logger.exception("任务处理失败 [job={}]: {}", msg.get("job_id", "?"), exc)

            # 回调 API：任务状态 → failed（附带错误信息）
            api_client.update_job_status(
                msg.get("job_id"),
                "failed",
                error_message=str(exc),
            )
            channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

    # ------------------------------------------------------------------
    # localizations 表写入
    # ------------------------------------------------------------------

    def _update_localization(self, msg: dict, result: dict):
        """
        根据管线阶段，写入 localizations 表对应字段

        - ASR 阶段:   subtitle_url（原始语言字幕）
        - 翻译阶段:   title_translated
        - 配音阶段:   dub_url
        - 口型同步:    lip_sync_url
        """
        job_type = msg.get("job_type", "")
        episode_id = msg.get("episode_id")
        target_lang = msg.get("input", {}).get("target_lang", "en")

        localization_payload = {
            "episode_id": episode_id,
            "language": target_lang,
            "status": "completed",
        }

        if job_type == "asr":
            # ASR 输出原始语言字幕
            localization_payload["subtitle_url"] = result.get("srt_path", "")
            localization_payload["language"] = result.get("language", target_lang)

        elif job_type == "translate":
            # 翻译输出标题翻译
            localization_payload["title_translated"] = result.get("translated_text", "")[:500]

        elif job_type == "dubbing":
            # 配音输出音频 URL
            localization_payload["dub_url"] = result.get("dub_url", "")

        elif job_type == "lipsync":
            # 口型同步输出视频 URL
            localization_payload["lip_sync_url"] = result.get("lip_sync_url", "")

        api_client.upsert_localization(**localization_payload)

    # ------------------------------------------------------------------
    # 管线串联
    # ------------------------------------------------------------------

    def _enqueue_next_task(self, prev_msg: dict, prev_result: dict):
        """
        根据管线顺序，触发下一阶段任务

        ASR → 翻译 → 配音 → 口型同步 → (终点)
        """
        job_type = prev_msg.get("job_type", "")
        pipeline_order = {
            "asr": settings.QUEUE_TRANSLATE,
            "translate": settings.QUEUE_DUBBING,
            "dubbing": settings.QUEUE_LIPSYNC,
            "lipsync": None,  # 管线终点
        }

        next_queue = pipeline_order.get(job_type)
        if next_queue:
            next_msg = {
                "job_id": prev_msg.get("job_id"),
                "episode_id": prev_msg.get("episode_id"),
                "job_type": next_queue.replace("ai:", ""),
                "input": {
                    **prev_msg.get("input", {}),
                    **prev_result,
                },
            }
            self.channel.basic_publish(
                exchange="",
                routing_key=next_queue,
                body=json.dumps(next_msg, ensure_ascii=False),
                properties=pika.BasicProperties(delivery_mode=2),  # 持久化
            )
            logger.info("触发下游任务: queue={}", next_queue)

    # ------------------------------------------------------------------
    # Worker 恢复（重启后拉取 pending/processing 任务）
    # ------------------------------------------------------------------

    def recover_interrupted_jobs(self):
        """
        Worker 启动时，从后端拉取未完成的任务，重新入队

        场景: Worker 异常重启后，正在处理中的任务可能丢失。
        通过 API 查询 status=pending,processing 的任务，重新推入队列。
        """
        logger.info("恢复中断任务...")

        for job_type_key in self.handlers:
            short_type = job_type_key.replace("ai:", "")
            pending_jobs = api_client.fetch_pending_jobs(
                job_type=short_type, limit=50
            )

            if pending_jobs:
                logger.info(
                    "恢复 {} 个 {} 任务",
                    len(pending_jobs),
                    short_type,
                )
                for job in pending_jobs:
                    self.channel.basic_publish(
                        exchange="",
                        routing_key=job_type_key,
                        body=json.dumps(job, ensure_ascii=False),
                        properties=pika.BasicProperties(delivery_mode=2),
                    )
            else:
                logger.debug("无待恢复的 {} 任务", short_type)

    # ------------------------------------------------------------------
    # 主循环
    # ------------------------------------------------------------------

    def start(self):
        """启动 Worker，监听所有队列"""
        logger.info("=" * 50)
        logger.info("AI shot Worker 启动中...")
        logger.info("API Gateway: {}", settings.API_GATEWAY_URL)
        logger.info("监听队列: {}", list(self.handlers.keys()))
        logger.info("=" * 50)

        self.connect()

        # 恢复中断任务
        self.recover_interrupted_jobs()

        # 每个队列绑定消费者
        for queue_name in self.handlers:
            self.channel.basic_consume(
                queue=queue_name,
                on_message_callback=self.handle_message,
            )
            logger.info("已绑定消费者: {}", queue_name)

        # 优雅退出
        signal.signal(signal.SIGINT, lambda sig, frame: self.stop())
        signal.signal(signal.SIGTERM, lambda sig, frame: self.stop())

        try:
            self.channel.start_consuming()
        except KeyboardInterrupt:
            pass
        finally:
            self.close()

    def stop(self):
        """优雅退出"""
        logger.info("收到退出信号，正在关闭 Worker...")
        self.running = False
        try:
            self.channel.stop_consuming()
        except Exception:
            pass
        self.close()
        exit(0)


# ======================================================================
# 入口
# ======================================================================

if __name__ == "__main__":
    # 确保必要目录存在
    settings.TEMP_DIR.mkdir(parents=True, exist_ok=True)
    settings.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    worker = AIWorker()
    worker.start()
