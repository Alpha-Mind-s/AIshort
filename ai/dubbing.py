"""
AI shot — AI 配音模块

技术选型: ElevenLabs API（MVP 阶段）
- 多音色支持
- 情感迁移
- 后期切换 CosyVoice 自建 TTS
"""

import subprocess
import tempfile
from pathlib import Path

from loguru import logger

from config import settings


class DubbingProcessor:
    """AI 配音处理器"""

    def __init__(self):
        self.api_key = settings.ELEVENLABS_API_KEY
        if not self.api_key:
            raise ValueError("ELEVENLABS_API_KEY is not set — dubbing disabled")
        # 默认音色 ID（可在 ElevenLabs 控制台创建并替换）
        self.default_voice_id = "21m00Tcm4TlvDq8ikWAM"  # Rachel (ElevenLabs 默认)

    # ------------------------------------------------------------------
    # 核心处理
    # ------------------------------------------------------------------

    def process(self, msg: dict) -> dict:
        """
        执行 AI 配音

        输入参数:
            msg["input"]["translated_segments"] — 翻译后的分段（含时间戳）
            msg["input"]["target_lang"]         — 目标语言，如 "en"
            msg["input"]["voice_id"]            — 指定音色（可选）
            msg["input"]["emotion"]             — 情感类型（可选）

        返回:
            {
                "dub_url": "s3://.../dub.mp3",
                "dub_duration": 120.5,
                "voice_id": "xxx"
            }
        """
        input_data = msg.get("input", {})
        translated_segments = input_data.get("translated_segments", [])
        target_lang = input_data.get("target_lang", "en")
        voice_id = input_data.get("voice_id", self.default_voice_id)
        episode_id = msg.get("episode_id")

        logger.info("配音开始 episode={} lang={} segments={}", episode_id, target_lang, len(translated_segments))

        if not translated_segments:
            logger.warning("无翻译分段，跳过配音")
            return {"dub_url": "", "dub_duration": 0}

        # Step 1: 生成完整配音音频（所有分段拼接）
        audio_path = self._generate_dub_audio(translated_segments, voice_id, target_lang)

        # Step 2: 上传到 S3
        dub_url = self._upload_to_s3(audio_path, episode_id, target_lang)

        # Step 3: 清理临时文件
        audio_path.unlink(missing_ok=True)

        duration = sum(seg["end"] - seg["start"] for seg in translated_segments)

        logger.info("配音完成 episode={} duration={:.1f}s", episode_id, duration)

        return {
            "dub_url": dub_url,
            "dub_duration": round(duration, 2),
            "voice_id": voice_id,
        }

    # ------------------------------------------------------------------
    # ElevenLabs TTS
    # ------------------------------------------------------------------

    def _generate_dub_audio(self, segments: list, voice_id: str, language: str) -> Path:
        """调用 ElevenLabs TTS 生成配音音频"""
        import requests

        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream"

        headers = {
            "xi-api-key": self.api_key,
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
        }

        # 将所有分段文本合并（保留段间自然停顿）
        full_text = " ".join(seg["text"] for seg in segments)

        payload = {
            "text": full_text,
            "model_id": "eleven_multilingual_v2",  # 多语言模型
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.8,
                "style": 0.3,         # 风格/情感强度
                "use_speaker_boost": True,
            },
        }

        # 流式下载音频
        output_path = settings.TEMP_DIR / f"dub_{voice_id}.mp3"
        logger.debug("ElevenLabs TTS 请求: {} 字符", len(full_text))

        with requests.post(url, json=payload, headers=headers, stream=True) as resp:
            resp.raise_for_status()
            output_path.write_bytes(resp.content)

        logger.debug("配音音频已生成: {} ({:.1f} KB)", output_path.name, output_path.stat().st_size / 1024)
        return output_path

    # ------------------------------------------------------------------
    # 多音色 / 多角色
    # ------------------------------------------------------------------

    def _generate_multi_voice_audio(self, segments: list, voice_map: dict) -> Path:
        """
        多角色配音

        segments 需包含 speaker 字段:
            [{"text": "Hello", "speaker": "A", "start": 0, "end": 2}, ...]

        voice_map: {"A": "voice_id_1", "B": "voice_id_2"}

        当前 MVP: 若只有单角色或无 speaker 字段，回退到单音色配音。
        """
        if not voice_map:
            logger.info("未提供多角色音色映射，回退到单音色配音")
            return self._generate_dub_audio(segments, self.default_voice_id, "en")

        # 按 speaker 分组，分别调用 TTS，再按时间轴拼接
        import requests

        segment_files = []
        for speaker, voice_id in voice_map.items():
            speaker_segments = [s for s in segments if s.get("speaker") == speaker]
            if not speaker_segments:
                continue
            speaker_text = " ".join(s["text"] for s in speaker_segments)
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream"
            headers = {
                "xi-api-key": self.api_key,
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
            }
            payload = {
                "text": speaker_text,
                "model_id": "eleven_multilingual_v2",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.8,
                    "style": 0.3,
                    "use_speaker_boost": True,
                },
            }
            tmp_path = settings.TEMP_DIR / f"dub_{speaker}_{voice_id}.mp3"
            with requests.post(url, json=payload, headers=headers, stream=True) as resp:
                resp.raise_for_status()
                tmp_path.write_bytes(resp.content)
            segment_files.append(tmp_path)

        if not segment_files:
            logger.warning("多角色分组后无有效片段，回退到单音色")
            return self._generate_dub_audio(segments, self.default_voice_id, "en")

        return self._concat_audio_segments(segment_files)

    # ------------------------------------------------------------------
    # 音频拼接
    # ------------------------------------------------------------------

    def _concat_audio_segments(self, segment_files: list[Path]) -> Path:
        """使用 FFmpeg concat 拼接多个音频片段"""
        if len(segment_files) == 1:
            return segment_files[0]

        # Write ffmpeg concat file list
        concat_list = settings.TEMP_DIR / "concat_list.txt"
        with open(concat_list, "w") as f:
            for sf in segment_files:
                f.write(f"file '{sf}'\n")

        output_path = settings.TEMP_DIR / "dub_concatenated.mp3"
        cmd = [
            "ffmpeg", "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", str(concat_list),
            "-c", "copy",
            str(output_path),
        ]
        logger.debug("ffmpeg concat: {}", " ".join(cmd))
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        if result.returncode != 0:
            logger.error("ffmpeg concat 失败: {}", result.stderr)
            # Fallback: return the first segment
            logger.warning("拼接失败，回退到第一个音频片段")
            return segment_files[0]

        # Clean up concat list and individual segments
        concat_list.unlink(missing_ok=True)
        for sf in segment_files:
            if sf != output_path:
                sf.unlink(missing_ok=True)

        logger.debug("音频拼接完成: {}", output_path.name)
        return output_path

    # ------------------------------------------------------------------
    # S3 上传
    # ------------------------------------------------------------------

    def _upload_to_s3(self, file_path: Path, episode_id, language: str) -> str:
        """上传音频文件到 S3/MinIO"""
        import boto3

        s3 = boto3.client(
            "s3",
            endpoint_url=settings.S3_ENDPOINT,
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
        )

        key = f"localized/{episode_id}/dub_{language}.mp3"
        s3.upload_file(str(file_path), settings.S3_BUCKET, key)

        url = f"s3://{settings.S3_BUCKET}/{key}"
        logger.debug("配音已上传: {}", url)
        return url
