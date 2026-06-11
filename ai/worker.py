"""
AI shot — AI Worker 主入口

监听 RabbitMQ 队列，消费 AI 任务消息，调度各管线模块处理。
通过 API Gateway 回调更新任务状态（方案二：API 回调模式）。

管线流程: ASR -> Translate -> Dubbing -> LipSync
"""

import json
import signal
import sys
from pathlib import Path

import pika
from loguru import logger

# Ensure the ai/ directory is on sys.path so imports work from any working dir
_AI_DIR = Path(__file__).resolve().parent
if str(_AI_DIR) not in sys.path:
    sys.path.insert(0, str(_AI_DIR))

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

        self.asr = ASRProcessor()
        self.translator = TranslationProcessor()

        # Dubbing and Lipsync are optional — they gracefully skip when
        # API keys or model checkpoints are unavailable.
        self.dubbing = self._init_dubbing()
        self.lipsync = self._init_lipsync()

        self.handlers = {}
        self.handlers[settings.QUEUE_ASR] = self.asr
        self.handlers[settings.QUEUE_TRANSLATE] = self.translator
        if self.dubbing:
            self.handlers[settings.QUEUE_DUBBING] = self.dubbing
        if self.lipsync:
            self.handlers[settings.QUEUE_LIPSYNC] = self.lipsync

    def _init_dubbing(self):
        """初始化配音处理器。API Key 缺失时打印警告并跳过。"""
        if not settings.ELEVENLABS_API_KEY:
            logger.warning(
                "ELEVENLABS_API_KEY 未设置 — 配音管线已禁用。"
                "在 .env 中设置 ELEVENLABS_API_KEY 以启用配音。"
            )
            return None
        return DubbingProcessor()

    def _init_lipsync(self):
        """初始化口型同步处理器。模型/代码缺失时打印警告并跳过。"""
        processor = LipSyncProcessor()
        if not processor.is_available():
            logger.warning(
                "Wav2Lip 模型或代码缺失 — 口型同步管线已禁用。"
                "将 Wav2Lip 仓库克隆到 ai/ 目录并下载模型到 {} 以启用。",
                processor.WAV2LIP_CHECKPOINT,
            )
            return None
        return processor

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

        # Also declare the downstream queues so they exist even if
        # those processors are disabled (messages will dead-letter).
        for q in [settings.QUEUE_DUBBING, settings.QUEUE_LIPSYNC]:
            if q not in self.handlers:
                self.channel.queue_declare(queue=q, durable=True)
                logger.info("Queue declared (no consumer): {}", q)

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
        job_id = None
        try:
            msg = json.loads(body)
            job_id = msg.get("job_id")
            job_type = msg.get("job_type", "")
            episode_id = msg.get("episode_id")

            logger.info("Task received [job={}] type={} episode={}", job_id, job_type, episode_id)

            handler = self.handlers.get(f"ai:{job_type}")
            if handler is None:
                logger.warning(
                    "No handler for job_type={} — marking as skipped (handler disabled or unknown)",
                    job_type,
                )
                api_client.update_job_status(job_id, "skipped",
                    error_message=f"No handler available for job type: {job_type}")
                self._enqueue_next_task(msg, {})
                channel.basic_ack(delivery_tag=method.delivery_tag)
                return

            api_client.update_job_status(job_id, "processing")
            result = handler.process(msg)
            api_client.update_job_status(job_id, "completed", result_meta=result)
            self._update_localization(msg, result)
            self._enqueue_next_task(msg, result)

            channel.basic_ack(delivery_tag=method.delivery_tag)
            logger.info("Task done [job={}]", job_id)

        except Exception as exc:
            logger.exception("Task failed [job={}]: {}", job_id, exc)
            if job_id:
                api_client.update_job_status(job_id, "failed", error_message=str(exc))
            channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

    # ------------------------------------------------------------------
    # localizations 写入
    # ------------------------------------------------------------------

    def _update_localization(self, msg: dict, result: dict):
        """写入 localizations 表: ASR→subtitle, translate→title, dubbing→dub_url, lipsync→lip_sync_url"""
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
            payload["title_translated"] = (result.get("translated_text", "") or "")[:500]
        elif job_type == "dubbing":
            payload["dub_url"] = result.get("dub_url", "")
        elif job_type == "lipsync":
            payload["lip_sync_url"] = result.get("lip_sync_url", "")

        api_client.upsert_localization(**payload)

    # ------------------------------------------------------------------
    # 管线串联: ASR -> Translate -> Dubbing -> LipSync -> End
    # ------------------------------------------------------------------

    def _enqueue_next_task(self, prev_msg: dict, prev_result: dict):
        """Chain the full pipeline: asr → translate → dubbing → lipsync → end"""
        pipeline_order = {
            "asr":       settings.QUEUE_TRANSLATE,
            "translate": settings.QUEUE_DUBBING if self.dubbing else settings.QUEUE_LIPSYNC if self.lipsync else None,
            "dubbing":   settings.QUEUE_LIPSYNC if self.lipsync else None,
            "lipsync":   None,
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
                    # API returns "id" — map to "job_id" for the message handler
                    job["job_id"] = job.get("id", job.get("job_id"))
                    # Ensure input dict exists for defensive handler access
                    if "input" not in job:
                        job["input"] = {}
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
        logger.info("Active queues: {}", list(self.handlers.keys()))
        logger.info("Dubbing enabled: {}", self.dubbing is not None)
        logger.info("LipSync enabled: {}", self.lipsync is not None)
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
