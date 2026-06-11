"""
AI shot — API Gateway HTTP 客户端

AI Worker 通过此客户端回调后端 API（方案二：API 回调模式）。
Agent 1（Go 后端）需实现对应的 internal 接口。

接口契约详见: ai/docs/ai-api-contract.md
"""

import httpx
from loguru import logger

from config import settings


class APIClient:
    """API Gateway HTTP 客户端（同步，含超时重试）"""

    def __init__(self):
        self.base_url = settings.API_GATEWAY_URL.rstrip("/")
        self.timeout = 30  # 秒
        self.max_retries = 3

    # ==================================================================
    # AI 任务状态回调
    # ==================================================================

    def update_job_status(
        self,
        job_id: int,
        status: str,
        result_meta: dict = None,
        error_message: str = None,
    ) -> bool:
        """
        更新 ai_jobs 表任务状态

        PUT /api/v1/internal/ai/jobs/{job_id}/status

        请求体:
        {
            "status": "processing",       # pending | processing | completed | failed
            "result_meta": {              # 可选，完成时的结果数据
                "transcript": "...",
                "segments": [...]
            },
            "error_message": null         # 失败时的错误信息
        }
        """
        url = f"{self.base_url}/internal/ai/jobs/{job_id}/status"
        payload = {
            "status": status,
            "result_meta": result_meta,
            "error_message": error_message,
        }

        logger.debug("回调 API: PUT {}  status={}", url, status)

        resp = self._request_with_retry("PUT", url, json=payload)
        if resp is None:
            logger.error("任务状态回调失败: job={} status={}", job_id, status)
            return False

        logger.info("任务状态已更新: job={} status={}", job_id, status)
        return True

    # ==================================================================
    # 本地化结果写入
    # ==================================================================

    def upsert_localization(
        self,
        episode_id: int,
        language: str,
        dub_url: str = None,
        subtitle_url: str = None,
        lip_sync_url: str = None,
        title_translated: str = None,
        status: str = "completed",
    ) -> bool:
        """
        写入/更新 localizations 表

        PUT /api/v1/internal/episodes/{episode_id}/localization

        请求体:
        {
            "language": "en",
            "dub_url": "s3://bucket/localized/1/dub_en.mp3",
            "subtitle_url": "s3://bucket/localized/1/subtitle.srt",
            "lip_sync_url": "s3://bucket/localized/1/lipsync_en.mp4",
            "title_translated": "The CEO's Contract Wife",
            "status": "completed"           # pending | processing | completed | failed
        }
        """
        url = f"{self.base_url}/internal/episodes/{episode_id}/localization"
        payload = {
            "language": language,
            "dub_url": dub_url,
            "subtitle_url": subtitle_url,
            "lip_sync_url": lip_sync_url,
            "title_translated": title_translated,
            "status": status,
        }

        logger.debug("回调 API: PUT {}  lang={}", url, language)

        resp = self._request_with_retry("PUT", url, json=payload)
        if resp is None:
            logger.error("本地化写入失败: episode={} lang={}", episode_id, language)
            return False

        logger.info("本地化已写入: episode={} lang={}", episode_id, language)
        return True

    # ==================================================================
    # 获取剧集信息（AI Worker 内部查询）
    # ==================================================================

    def get_episode(self, episode_id: int) -> dict | None:
        """
        获取剧集详情（含原始视频 URL）

        GET /api/v1/internal/episodes/{episode_id}

        返回:
        {
            "id": 456,
            "drama_id": 100,
            "episode_no": 1,
            "video_url": "s3://bucket/videos/original.mp4",
            "duration": 180,
            "status": "processing"
        }
        """
        url = f"{self.base_url}/internal/episodes/{episode_id}"

        resp = self._request_with_retry("GET", url)
        if resp is None:
            return None

        data = resp.json()
        return data.get("data", {})

    # ==================================================================
    # 获取待处理任务（Worker 启动时恢复中断任务）
    # ==================================================================

    def fetch_pending_jobs(self, job_type: str = None, limit: int = 10) -> list[dict]:
        """
        获取待处理 / 处理中的 AI 任务（Worker 重启恢复）

        GET /api/v1/internal/ai/jobs?status=pending,processing&job_type=asr&limit=10

        返回:
        [
            {
                "id": 123,
                "episode_id": 456,
                "job_type": "asr",
                "status": "pending",
                "input_meta": {...}
            }
        ]
        """
        url = f"{self.base_url}/internal/ai/jobs"
        params = {
            "status": "pending,processing",
            "limit": limit,
        }
        if job_type:
            params["job_type"] = job_type

        resp = self._request_with_retry("GET", url, params=params)
        if resp is None:
            return []

        data = resp.json()
        return data.get("data", [])

    # ==================================================================
    # HTTP 基础方法
    # ==================================================================

    def _request_with_retry(self, method: str, url: str, **kwargs) -> httpx.Response | None:
        """带重试的 HTTP 请求"""
        last_error = None

        for attempt in range(1, self.max_retries + 1):
            try:
                resp = httpx.request(
                    method,
                    url,
                    timeout=self.timeout,
                    **kwargs,
                )
                resp.raise_for_status()
                return resp

            except httpx.HTTPStatusError as exc:
                logger.warning(
                    "API 请求失败 (attempt={}/{}): {} {} → {} {}",
                    attempt,
                    self.max_retries,
                    method,
                    url,
                    exc.response.status_code,
                    exc.response.text[:200],
                )
                # 4xx 错误不重试（客户端错误）
                if 400 <= exc.response.status_code < 500:
                    return None
                last_error = exc

            except httpx.RequestError as exc:
                logger.warning(
                    "API 请求异常 (attempt={}/{}): {} {} → {}",
                    attempt,
                    self.max_retries,
                    method,
                    url,
                    exc,
                )
                last_error = exc

            if attempt < self.max_retries:
                import time
                delay = 2 ** attempt  # 指数退避: 2s, 4s, 8s
                time.sleep(delay)

        logger.error("API 请求重试耗尽: {} {}", method, url)
        return None


# ======================================================================
# 全局单例
# ======================================================================

api_client = APIClient()
