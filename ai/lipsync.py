"""
AI shot — AI 口型同步模块

技术选型: Wav2Lip 改进版 + GFPGAN 人脸增强（MVP 阶段）
- 输入: 原始视频 + 配音音频 → 输出: 口型对齐视频
- GPU 批处理
- 后期优化: CodeFormer 替换 GFPGAN
"""

import subprocess
import tempfile
from pathlib import Path

from loguru import logger

from config import settings


class LipSyncProcessor:
    """口型同步处理器"""

    # Wav2Lip checkpoint 路径（需预先下载）
    WAV2LIP_CHECKPOINT = "/models/wav2lip_gan.pth"
    GFPGAN_CHECKPOINT = "/models/GFPGANv1.4.pth"

    def __init__(self):
        pass

    # ------------------------------------------------------------------
    # 核心处理
    # ------------------------------------------------------------------

    def process(self, msg: dict) -> dict:
        """
        执行口型同步

        输入参数:
            msg["input"]["video_url"]     — 原始视频 URL
            msg["input"]["dub_url"]       — 配音音频 URL
            msg["input"]["target_lang"]   — 目标语言

        返回:
            {
                "lip_sync_url": "s3://.../lipsync.mp4",
                "status": "completed"
            }
        """
        video_url = msg["input"].get("video_url", "")
        dub_url = msg["input"].get("dub_url", "")
        target_lang = msg["input"].get("target_lang", "en")
        episode_id = msg.get("episode_id")

        logger.info("口型同步开始 episode={} lang={}", episode_id, target_lang)

        if not video_url or not dub_url:
            logger.error("缺少视频或配音音频 URL")
            return {"lip_sync_url": "", "status": "failed"}

        # Step 1: 下载视频和音频
        video_path = self._download_file(video_url, "video")
        audio_path = self._download_file(dub_url, "audio")

        # Step 2: 运行 Wav2Lip 推理
        output_path = self._run_wav2lip(video_path, audio_path, episode_id)

        # Step 3: 人脸增强（GFPGAN）
        enhanced_path = self._enhance_face(output_path, episode_id)

        # Step 4: 上传结果到 S3
        lip_sync_url = self._upload_to_s3(enhanced_path, episode_id, target_lang)

        # Step 5: 清理临时文件
        for p in [video_path, audio_path, output_path, enhanced_path]:
            p.unlink(missing_ok=True)

        logger.info("口型同步完成 episode={}", episode_id)

        return {
            "lip_sync_url": lip_sync_url,
            "status": "completed",
        }

    # ------------------------------------------------------------------
    # Wav2Lip 推理
    # ------------------------------------------------------------------

    def _run_wav2lip(self, video_path: Path, audio_path: Path, episode_id) -> Path:
        """
        运行 Wav2Lip 推理

        使用 subprocess 调用 Wav2Lip（独立 GPU 环境）
        """
        output_path = settings.TEMP_DIR / f"lipsync_raw_{episode_id}.mp4"

        cmd = [
            "python", "Wav2Lip/inference.py",
            "--checkpoint_path", self.WAV2LIP_CHECKPOINT,
            "--face", str(video_path),
            "--audio", str(audio_path),
            "--outfile", str(output_path),
            "--pads", "0", "10", "0", "0",      # 唇部区域填充
            "--nosmooth",                         # MVP 阶段关闭平滑（提升速度）
            "--resize_factor", "1",
        ]

        logger.debug("Wav2Lip 推理中...")
        logger.debug("命令: {}", " ".join(cmd))

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)

        if result.returncode != 0:
            logger.error("Wav2Lip 失败: {}", result.stderr)
            raise RuntimeError(f"Wav2Lip inference failed: {result.stderr}")

        logger.debug("Wav2Lip 推理完成: {}", output_path.name)
        return output_path

    # ------------------------------------------------------------------
    # 人脸增强 (GFPGAN)
    # ------------------------------------------------------------------

    def _enhance_face(self, video_path: Path, episode_id) -> Path:
        """
        GFPGAN 人脸增强

        修复 Wav2Lip 输出的模糊人脸区域
        """
        output_path = settings.TEMP_DIR / f"lipsync_enhanced_{episode_id}.mp4"

        # TODO: 集成 GFPGAN 推理
        # 当前 MVP 可跳过增强步骤，直接返回原始输出
        logger.debug("跳过 GFPGAN 增强（MVP 阶段）")

        # 如果 GFPGAN 暂不可用，直接返回原始文件
        return video_path

    # ------------------------------------------------------------------
    # 工具方法
    # ------------------------------------------------------------------

    def _download_file(self, url: str, file_type: str) -> Path:
        """下载文件到临时目录"""
        import httpx

        suffix_map = {"video": ".mp4", "audio": ".mp3"}
        suffix = suffix_map.get(file_type, ".tmp")
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
        elif url.startswith("http"):
            with httpx.stream("GET", url, follow_redirects=True) as resp:
                resp.raise_for_status()
                tmp_path.write_bytes(resp.read())
        else:
            tmp_path = Path(url)

        logger.debug("文件已下载: {} ({:.1f} MB)", tmp_path.name, tmp_path.stat().st_size / 1024 / 1024)
        return tmp_path

    def _upload_to_s3(self, file_path: Path, episode_id, language: str) -> str:
        """上传结果到 S3"""
        import boto3

        s3 = boto3.client(
            "s3",
            endpoint_url=settings.S3_ENDPOINT,
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
        )

        key = f"localized/{episode_id}/lipsync_{language}.mp4"
        s3.upload_file(str(file_path), settings.S3_BUCKET, key)

        url = f"s3://{settings.S3_BUCKET}/{key}"
        logger.debug("口型同步结果已上传: {}", url)
        return url
