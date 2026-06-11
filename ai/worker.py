"""
AI shot — AI Worker 主入口

监听 RabbitMQ 队列，消费 AI 任务消息，调度各管线模块处理。
通过 API Gateway 回调更新任务状态（方案二：API 回调模式）。

管线流程: ASR (语音识别) -> 翻译 -> 输出双语字幕
"""

import json
import signal

import pika
from loguru import logger

from config import settings
from api_client import api_client
from asr import ASRProcessor
from translate import TranslationProcessor


class AIWorker:
    """AI 管线 Worker — RabbitMQ 消费者"""

    def __init__(self):
        self.running = True
        self.connection = None
        self.channel = None

        self.asr = ASRProcessor()
        self.translator = TranslationProcessor()

        self.handlers = {
            settings.QUEUE_ASR: self.asr,
            settings.QUEUE_TRANSLATE: self.translator,
        }

    # ------------------------------------------------------------------
    # 连接管理
    # ------------------------------------------------------------------

    def connect(self):
        """建立 RabbitMQ 连接"""
        logger.info("Connecting to RabbitMQ: {}", settings.RABBITMQ_ADDR)
        params = pika.URLParameters(settings.RABBITMQ_ADDR)
        params.heartbeat = 300
        params.blocked_connection_timeout = 300

        self.connection = pika.BlockingConnection(params)
        self.channel = self.connection.channel()

        for q in self.handlers:
            self.channel.queue_declare(queue=q, durable=True)
            logger.info("Queue ready: {}", q)

    def close(self):
        """关闭连接"""
        if self.channel:
            self.channel.close()
        if self.connection:
            self.connection.close()
        logger.info("RabbitMQ connection closed")

    # ------------------------------------------------------------------
    # 消息处理
    # ------------------------------------------------------------------

    def handle_message(self, channel, method, properties, body):
        """处理单条消息"""
        try:
            msg = json.loads(body)
            job_id = msg.get("job_id")
            job_type = msg.get("job_type", "")
            episode_id = msg.get("episode_id")

            logger.info("Task received [job={}] type={} episode={}", job_id, job_type, episode_id)

            handler = self.handlers.get(f"ai:{job_type}")
            if handler is None:
                logger.error("Unknown job type: {}", job_type)
                channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
                return

            api_client.update_job_status(job_id, "processing")
            result = handler.process(msg)
            api_client.update_job_status(job_id, "completed", result_meta=result)
            self._update_localization(msg, result)
            self._enqueue_next_task(msg, result)

            channel.basic_ack(delivery_tag=method.delivery_tag)
            logger.info("Task done [job={}]", job_id)

        except Exception as exc:
            logger.exception("Task failed [job={}]: {}", msg.get("job_id", "?"), exc)
            api_client.update_job_status(msg.get("job_id"), "failed", error_message=str(exc))
            channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

    # ------------------------------------------------------------------
    # localizations 写入
    # ------------------------------------------------------------------

    def _update_localization(self, msg: dict, result: dict):
        """写入 localizations 表: ASR->subtitle_url, translate->title_translated"""
        job_type = msg.get("job_type", "")
        episode_id = msg.get("episode_id")
        target_lang = msg.get("input", {}).get("target_lang", "en")

        payload = {
            "episode_id": episode_id,
            "language": target_lang,
            "status": "completed",
        }

        if job_type == "asr":
            payload["subtitle_url"] = result.get("srt_path", "")
            payload["language"] = result.get("language", target_lang)
        elif job_type == "translate":
            payload["title_translated"] = result.get("translated_text", "")[:500]

        api_client.upsert_localization(**payload)

    # ------------------------------------------------------------------
    # 管线串联: ASR -> Translate -> End
    # ------------------------------------------------------------------

    def _enqueue_next_task(self, prev_msg: dict, prev_result: dict):
        """ASR -> translate, translate -> end"""
        pipeline_order = {
            "asr": settings.QUEUE_TRANSLATE,
            "translate": None,
        }

        next_queue = pipeline_order.get(prev_msg.get("job_type", ""))
        if next_queue:
            next_msg = {
                "job_id": prev_msg.get("job_id"),
                "episode_id": prev_msg.get("episode_id"),
                "job_type": next_queue.replace("ai:", ""),
                "input": {**prev_msg.get("input", {}), **prev_result},
            }
            self.channel.basic_publish(
                exchange="",
                routing_key=next_queue,
                body=json.dumps(next_msg, ensure_ascii=False),
                properties=pika.BasicProperties(delivery_mode=2),
            )
            logger.info("Triggered next task: queue={}", next_queue)

    # ------------------------------------------------------------------
    # Worker 恢复
    # ------------------------------------------------------------------

    def recover_interrupted_jobs(self):
        """Worker 启动时恢复中断任务"""
        logger.info("Recovering interrupted jobs...")
        for job_type_key in self.handlers:
            short_type = job_type_key.replace("ai:", "")
            pending_jobs = api_client.fetch_pending_jobs(job_type=short_type, limit=50)
            if pending_jobs:
                logger.info("Recovered {} {} jobs", len(pending_jobs), short_type)
                for job in pending_jobs:
                    self.channel.basic_publish(
                        exchange="",
                        routing_key=job_type_key,
                        body=json.dumps(job, ensure_ascii=False),
                        properties=pika.BasicProperties(delivery_mode=2),
                    )

    # ------------------------------------------------------------------
    # 主循环
    # ------------------------------------------------------------------

    def start(self):
        """启动 Worker"""
        logger.info("=" * 50)
        logger.info("AI shot Worker starting...")
        logger.info("API Gateway: {}", settings.API_GATEWAY_URL)
        logger.info("Queues: {}", list(self.handlers.keys()))
        logger.info("=" * 50)

        self.connect()
        self.recover_interrupted_jobs()

        for queue_name in self.handlers:
            self.channel.basic_consume(queue=queue_name, on_message_callback=self.handle_message)
            logger.info("Consumer bound: {}", queue_name)

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
        logger.info("Shutting down Worker...")
        self.running = False
        try:
            self.channel.stop_consuming()
        except Exception:
            pass
        self.close()
        exit(0)


if __name__ == "__main__":
    settings.TEMP_DIR.mkdir(parents=True, exist_ok=True)
    settings.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    worker = AIWorker()
    worker.start()