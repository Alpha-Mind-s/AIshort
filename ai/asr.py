"""
AI shot — ASR 语音识别模块

技术选型: OpenAI Whisper（MVP 阶段）
- 提取视频音轨 → Whisper 转录 → 时间戳对齐 → 生成 SRT 字幕
- 后期切换 WhisperX 以获得更精确的时间戳和说话人分离
"""

import json
import tempfile
from pathlib import Path

import httpx
from loguru import logger

from config import settings


class ASRProcessor:
    """语音识别处理器"""

    def __init__(self):
        self.model = None  # Whisper 模型（懒加载）
        self.model_name = settings.WHISPER_MODEL
        self.device = settings.WHISPER_DEVICE

    # ------------------------------------------------------------------
    # 模型管理
    # ------------------------------------------------------------------

    def _load_model(self):
        """懒加载 Whisper 模型（首次调用时加载，减少启动时间）"""
        if self.model is not None:
            return

        logger.info("加载 Whisper 模型: {} (device={})", self.model_name, self.device)
        import whisper
        self.model = whisper.load_model(self.model_name, device=self.device)
        logger.info("Whisper 模型加载完成")

    # ------------------------------------------------------------------
    # 核心处理
    # ------------------------------------------------------------------

    def process(self, msg: dict) -> dict:
        """
        执行 ASR 语音识别

        输入参数:
            msg["input"]["audio_url"]   — 音频文件 URL (S3/本地)
            msg["input"]["source_lang"] — 源语言代码，如 "zh"

        返回:
            {
                "transcript": "原始转录文本",
                "segments": [
                    {"start": 0.0, "end": 2.5, "text": "你好"},
                    ...
                ],
                "srt_path": "s3://.../output.srt",
                "language": "zh"
            }
        """
        audio_url = msg["input"]["audio_url"]
        source_lang = msg["input"].get("source_lang", "zh")
        episode_id = msg.get("episode_id")

        logger.info("ASR 开始处理 episode={} audio={}", episode_id, audio_url)

        # Step 1: 下载音频
        audio_path = self._download_audio(audio_url)

        # Step 2: Whisper 转录
        transcript, segments = self._transcribe(audio_path, source_lang)

        # Step 3: 生成 SRT 字幕
        srt_content = self._generate_srt(segments)
        srt_path = self._save_srt(episode_id, srt_content)

        # Step 4: 清理临时文件
        audio_path.unlink(missing_ok=True)

        logger.info("ASR 完成 episode={} segments={}", episode_id, len(segments))

        return {
            "transcript": transcript,
            "segments": segments,
            "srt_path": str(srt_path),
            "language": source_lang,
        }

    # ------------------------------------------------------------------
    # 子步骤
    # ------------------------------------------------------------------

    def _download_audio(self, url: str) -> Path:
        """下载音频文件到本地临时目录"""
        logger.debug("下载音频: {}", url)

        suffix = Path(url).suffix or ".mp3"
        tmp = tempfile.NamedTemporaryFile(
            dir=settings.TEMP_DIR, suffix=suffix, delete=False
        )
        tmp_path = Path(tmp.name)

        if url.startswith("s3://"):
            # S3 下载（通过 boto3）
            import boto3
            s3 = boto3.client(
                "s3",
                endpoint_url=settings.S3_ENDPOINT,
                aws_access_key_id=settings.S3_ACCESS_KEY,
                aws_secret_access_key=settings.S3_SECRET_KEY,
            )
            bucket, key = url.replace("s3://", "").split("/", 1)
            s3.download_file(bucket, key, str(tmp_path))
        elif url.startswith("http"):
            # HTTP 下载
            with httpx.stream("GET", url, follow_redirects=True) as resp:
                resp.raise_for_status()
                tmp_path.write_bytes(resp.read())
        else:
            # 本地文件
            tmp_path = Path(url)

        logger.debug("音频已下载: {} ({:.1f} MB)", tmp_path.name, tmp_path.stat().st_size / 1024 / 1024)
        return tmp_path

    def _transcribe(self, audio_path: Path, language: str) -> tuple[str, list]:
        """
        Whisper 转录

        返回: (完整文本, 分段列表)
        分段格式: [{"start": 0.0, "end": 2.5, "text": "..."}, ...]
        """
        self._load_model()

        logger.info("开始 Whisper 转录...")
        result = self.model.transcribe(
            str(audio_path),
            language=language,
            word_timestamps=True,   # 单词级时间戳
            verbose=False,
        )

        full_text = result["text"]
        segments = [
            {
                "start": round(seg["start"], 2),
                "end": round(seg["end"], 2),
                "text": seg["text"].strip(),
            }
            for seg in result["segments"]
        ]

        logger.info("Whisper 转录完成: {} 字", len(full_text))
        return full_text, segments

    def _generate_srt(self, segments: list) -> str:
        """将分段生成 SRT 字幕格式"""
        lines = []
        for i, seg in enumerate(segments, 1):
            start_ts = self._format_timestamp(seg["start"])
            end_ts = self._format_timestamp(seg["end"])
            lines.append(f"{i}")
            lines.append(f"{start_ts} --> {end_ts}")
            lines.append(seg["text"])
            lines.append("")  # 空行分隔

        return "\n".join(lines)

    def _format_timestamp(self, seconds: float) -> str:
        """秒数 → SRT 时间格式 HH:MM:SS,mmm"""
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        ms = int((seconds % 1) * 1000)
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

    def _save_srt(self, episode_id, srt_content: str) -> Path:
        """保存 SRT 字幕文件到输出目录"""
        output_path = settings.OUTPUT_DIR / f"episode_{episode_id}" / "subtitle.srt"
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(srt_content, encoding="utf-8")
        logger.debug("SRT 已保存: {}", output_path)
        return output_path
