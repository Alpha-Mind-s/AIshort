"""
AI shot — ASR 语音识别模块

技术选型: OpenAI Whisper（MVP 阶段）
完整流程: 视频/音频输入 → 提取音轨 → Whisper 转录 → 时间戳对齐 → 生成 SRT 字幕
后期切换 WhisperX 以获得更精确的时间戳和说话人分离
"""

import json
import subprocess
import tempfile
from pathlib import Path

import httpx
from loguru import logger

from config import settings


class ASRProcessor:
    """语音识别处理器"""

    # ffmpeg 音频提取参数
    EXTRACT_SAMPLE_RATE = 16000      # Whisper 推荐 16kHz
    EXTRACT_CHANNELS = 1             # 单声道
    EXTRACT_FORMAT = "wav"           # 无损格式

    def __init__(self):
        self.model = None  # Whisper 模型（懒加载）

    # ==================================================================
    # 模型管理
    # ==================================================================

    def _load_model(self):
        """懒加载 Whisper 模型（首次调用时加载，减少启动时间）"""
        if self.model is not None:
            return

        logger.info("加载 Whisper 模型: {} (device={})", settings.WHISPER_MODEL, settings.WHISPER_DEVICE)
        import whisper
        self.model = whisper.load_model(settings.WHISPER_MODEL, device=settings.WHISPER_DEVICE)
        logger.info("Whisper 模型加载完成")

    # ==================================================================
    # 核心处理
    # ==================================================================

    def process(self, msg: dict) -> dict:
        """
        执行 ASR 语音识别（统一入口）

        输入参数 (两种方式):
          方式1 — 音频直传:
            msg["input"]["audio_url"]   — 音频文件 URL (S3/HTTP/本地)
          方式2 — 视频输入（自动提取音轨）:
            msg["input"]["video_url"]   — 视频文件 URL

            msg["input"]["source_lang"] — 源语言代码，如 "zh"（默认）

        返回:
            {
                "transcript": "完整转录文本",
                "segments": [
                    {"start": 0.0, "end": 2.5, "text": "你好"},
                    ...
                ],
                "srt_path": "/path/to/output.srt",
                "language": "zh",
                "duration": 120.5
            }
        """
        media_url = msg["input"].get("video_url") or msg["input"].get("audio_url")
        source_lang = msg["input"].get("source_lang", "zh")
        episode_id = msg.get("episode_id")

        if not media_url:
            raise ValueError("缺少 video_url 或 audio_url")

        logger.info("ASR 开始处理 episode={} media={}", episode_id, media_url)

        # Step 1: 下载媒体文件
        media_path = self._download_media(media_url)

        # Step 2: 提取音频（如果是视频文件）
        audio_path = self._ensure_audio(media_path)

        # Step 3: Whisper 转录
        transcript, segments = self._transcribe(audio_path, source_lang)

        # Step 4: 获取音频时长
        duration = self._get_duration(audio_path)

        # Step 5: 生成 SRT 字幕
        srt_content = self._generate_srt(segments)
        srt_path = self._save_srt(episode_id, srt_content)

        # Step 6: 清理临时文件（只清理下载的文件，不删本地原始文件）
        is_local = not (media_url.startswith("http") or media_url.startswith("s3://"))
        for tmp in [media_path]:
            if tmp and tmp.exists() and not is_local:
                tmp.unlink(missing_ok=True)
        # 音频临时文件总是清理
        if audio_path != media_path and audio_path and audio_path.exists():
            audio_path.unlink(missing_ok=True)

        logger.info("ASR 完成 episode={} segments={} duration={:.1f}s",
                     episode_id, len(segments), duration)

        return {
            "transcript": transcript,
            "segments": segments,
            "srt_path": str(srt_path),
            "language": source_lang,
            "duration": round(duration, 2),
        }

    # ==================================================================
    # 步骤 1: 下载
    # ==================================================================

    def _download_media(self, url: str) -> Path:
        """下载媒体文件到本地临时目录"""
        logger.debug("下载媒体文件: {}", url)

        suffix = Path(url).suffix or ".mp4"
        tmp = tempfile.NamedTemporaryFile(
            dir=settings.TEMP_DIR, suffix=suffix, delete=False
        )
        tmp_path = Path(tmp.name)

        if url.startswith("s3://"):
            import boto3
            s3 = boto3.client(
                "s3",
                endpoint_url=settings.S3_ENDPOINT,
                aws_access_key_id=settings.S3_ACCESS_KEY,
                aws_secret_access_key=settings.S3_SECRET_KEY,
            )
            bucket, key = url.replace("s3://", "").split("/", 1)
            s3.download_file(bucket, key, str(tmp_path))
        elif url.startswith("http://") or url.startswith("https://"):
            with httpx.stream("GET", url, follow_redirects=True) as resp:
                resp.raise_for_status()
                tmp_path.write_bytes(resp.read())
        else:
            # 本地路径
            tmp_path = Path(url)

        size_mb = tmp_path.stat().st_size / 1024 / 1024
        logger.debug("已下载: {} ({:.1f} MB)", tmp_path.name, size_mb)
        return tmp_path

    # ==================================================================
    # 步骤 2: 音频提取
    # ==================================================================

    def _ensure_audio(self, media_path: Path) -> Path:
        """
        确保输入是纯音频文件

        - 如果已经是音频 (.mp3 / .wav / .m4a / .flac)，直接返回
        - 如果是视频 (.mp4 / .mov / .avi / .mkv)，用 ffmpeg 提取音轨
        """
        audio_exts = {".mp3", ".wav", ".m4a", ".flac", ".aac", ".ogg", ".opus"}
        if media_path.suffix.lower() in audio_exts:
            logger.debug("输入已是音频: {}", media_path.suffix)
            return media_path

        logger.info("检测到视频文件，提取音轨: {}", media_path.name)
        return self._extract_audio(media_path)

    def _extract_audio(self, video_path: Path) -> Path:
        """
        ffmpeg 提取音频轨道

        参数:
            - 采样率 16kHz (Whisper 最佳)
            - 单声道
            - WAV 无损格式（Whisper 内部会做进一步处理）
        """
        output_path = video_path.with_suffix(".wav")

        cmd = [
            "ffmpeg",
            "-i", str(video_path),
            "-vn",                           # 丢弃视频流
            "-acodec", "pcm_s16le",          # PCM 16-bit 小端
            "-ar", str(self.EXTRACT_SAMPLE_RATE),
            "-ac", str(self.EXTRACT_CHANNELS),
            "-y",                             # 覆盖已存在文件
            "-loglevel", "error",            # 只输出错误
            str(output_path),
        ]

        logger.debug("ffmpeg 提取音轨: {}", " ".join(cmd))
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)

        if result.returncode != 0:
            raise RuntimeError(f"音频提取失败: {result.stderr}")

        size_kb = output_path.stat().st_size / 1024
        logger.debug("音轨提取完成: {} ({:.0f} KB)", output_path.name, size_kb)
        return output_path

    # ==================================================================
    # 步骤 3: Whisper 转录
    # ==================================================================

    def _transcribe(self, audio_path: Path, language: str) -> tuple[str, list]:
        """
        Whisper 转录

        参数:
            audio_path: 音频文件路径
            language:   语言代码 (zh/en/ja/ko/...)

        返回:
            (完整文本, 分段列表)
            分段: [{"start": 0.0, "end": 2.5, "text": "你好"}, ...]
        """
        self._load_model()

        logger.info("开始 Whisper 转录...")

        result = self.model.transcribe(
            str(audio_path),
            language=language,
            word_timestamps=True,    # 单词级时间戳（提升字幕精度）
            verbose=False,
        )

        full_text = result["text"].strip()
        segments = [
            {
                "start": round(seg["start"], 2),
                "end":   round(seg["end"], 2),
                "text":  seg["text"].strip(),
            }
            for seg in result["segments"]
            if seg["text"].strip()  # 过滤空段
        ]

        logger.info("Whisper 转录完成: {} 字, {} 段", len(full_text), len(segments))
        return full_text, segments

    # ==================================================================
    # 步骤 4: 获取时长
    # ==================================================================

    def _get_duration(self, audio_path: Path) -> float:
        """用 ffprobe 获取音频时长（秒）"""
        cmd = [
            "ffprobe",
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "json",
            str(audio_path),
        ]

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
            if result.returncode == 0:
                info = json.loads(result.stdout)
                return float(info["format"]["duration"])
        except Exception:
            pass

        return 0.0

    # ==================================================================
    # 步骤 5: SRT 生成
    # ==================================================================

    def _generate_srt(self, segments: list) -> str:
        """将分段列表 → SRT 字幕格式"""
        lines = []
        for i, seg in enumerate(segments, 1):
            start_ts = self._format_timestamp(seg["start"])
            end_ts   = self._format_timestamp(seg["end"])
            lines.append(str(i))
            lines.append(f"{start_ts} --> {end_ts}")
            lines.append(seg["text"])
            lines.append("")  # 空行分隔

        return "\n".join(lines)

    @staticmethod
    def _format_timestamp(seconds: float) -> str:
        """秒数 → SRT 时间格式 HH:MM:SS,mmm"""
        h  = int(seconds // 3600)
        m  = int((seconds % 3600) // 60)
        s  = int(seconds % 60)
        ms = int((seconds % 1) * 1000)
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

    # ==================================================================
    # 步骤 6: 保存
    # ==================================================================

    def _save_srt(self, episode_id, srt_content: str) -> Path:
        """保存 SRT 字幕文件到输出目录"""
        if episode_id:
            output_path = settings.OUTPUT_DIR / f"episode_{episode_id}" / "subtitle.srt"
        else:
            output_path = settings.OUTPUT_DIR / "subtitle.srt"

        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(srt_content, encoding="utf-8")
        logger.debug("SRT 已保存: {}", output_path)
        return output_path
