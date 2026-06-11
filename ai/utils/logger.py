"""
AI shot — 结构化日志配置
"""

import sys
from loguru import logger
from config import settings

# 移除默认 handler
logger.remove()

# 控制台输出（彩色）
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
           "<level>{level: <8}</level> | "
           "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
           "<level>{message}</level>",
    level=settings.LOG_LEVEL,
    colorize=True,
)

# 文件输出（按日期轮转）
logger.add(
    settings.BASE_DIR / "logs" / "ai-worker_{time:YYYY-MM-DD}.log",
    format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} | {message}",
    level="DEBUG",
    rotation="00:00",       # 每天午夜轮转
    retention="30 days",     # 保留 30 天
    compression="gz",        # 压缩旧日志
    encoding="utf-8",
)
