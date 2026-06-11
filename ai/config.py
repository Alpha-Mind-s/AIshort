"""
AI shot — AI 管线配置管理

环境变量优先级: .env 文件 > 系统环境变量 > 默认值
"""

from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """AI 管线全局配置"""

    # --- 目录 ---
    BASE_DIR: Path = Path(__file__).resolve().parent
    TEMP_DIR: Path = BASE_DIR / "temp"          # 临时文件（下载/中间产物）
    OUTPUT_DIR: Path = BASE_DIR / "output"       # 最终输出

    # --- 数据库 ---
    DB_DSN: str = "postgres://aishot:aishot@localhost:5432/aishot?sslmode=disable"
    REDIS_ADDR: str = "redis://localhost:6379"
    RABBITMQ_ADDR: str = "amqp://guest:guest@localhost:5672/"

    # --- API 密钥（留空，在 .env 中填写）---
    OPENAI_API_KEY: str = "ollama"    # Ollama 本地不需要真实 Key，填任意值
    LLM_BASE_URL: str = "http://localhost:11434/v1"  # Ollama OpenAI 兼容端点
    LLM_MODEL: str = "qwen3:4b"       # Ollama 本地翻译模型
    ELEVENLABS_API_KEY: str = ""

    # --- Whisper 模型 ---
    WHISPER_MODEL: str = "base"    # tiny / base / small / medium / large-v3
    WHISPER_DEVICE: str = "cpu"    # cpu / cuda

    # --- 对象存储 ---
    S3_ENDPOINT: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_BUCKET: str = "aishot-videos"

    # --- 队列名称 ---
    QUEUE_ASR: str = "ai:asr"
    QUEUE_TRANSLATE: str = "ai:translate"
    QUEUE_DUBBING: str = "ai:dubbing"
    QUEUE_LIPSYNC: str = "ai:lipsync"

    # --- Internal API Key (matches gateway INTERNAL_API_KEY) ---
    INTERNAL_API_KEY: str = ""

    # --- API Gateway ---
    API_GATEWAY_URL: str = "http://localhost:8080"

    # --- 日志 ---
    LOG_LEVEL: str = "INFO"

    # --- 任务重试 ---
    MAX_RETRY_COUNT: int = 3
    RETRY_DELAY_SECONDS: int = 60

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# 全局单例
settings = Settings()
