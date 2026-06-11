"""
AI shot — 文本翻译模块

技术选型: DeepL API（MVP 阶段）
- 上下文感知分段翻译
- 术语表管理
- 后期切换自建 LLM 翻译
"""

import json
from pathlib import Path

from loguru import logger

from config import settings


class TranslationProcessor:
    """翻译处理器"""

    def __init__(self):
        self.api_key = settings.DEEPL_API_KEY
        # 语言代码映射: 项目内部码 → DeepL API 码
        self.lang_map = {
            "zh": "ZH",
            "en": "EN-US",
            "es": "ES",
            "pt": "PT-BR",
            "ja": "JA",
            "ko": "KO",
            "fr": "FR",
            "de": "DE",
            "ar": "AR",
            "th": "TH",
            "vi": "VI",
        }
        # 术语表缓存
        self.glossary_id = None

    # ------------------------------------------------------------------
    # 核心处理
    # ------------------------------------------------------------------

    def process(self, msg: dict) -> dict:
        """
        执行文本翻译

        输入参数:
            msg["input"]["transcript"]     — 原始转录文本
            msg["input"]["segments"]       — 带时间戳的分段
            msg["input"]["source_lang"]    — 源语言，如 "zh"
            msg["input"]["target_lang"]    — 目标语言，如 "en"

        返回:
            {
                "translated_text": "完整翻译文本",
                "translated_segments": [...],   # 分段翻译（保留时间戳）
                "source_lang": "zh",
                "target_lang": "en"
            }
        """
        source_lang = msg["input"].get("source_lang", "zh")
        target_lang = msg["input"].get("target_lang", "en")
        segments = msg["input"].get("segments", [])
        episode_id = msg.get("episode_id")

        logger.info("翻译开始 episode={} {} → {}", episode_id, source_lang, target_lang)

        if not segments:
            logger.warning("无分段数据，跳过翻译")
            return {"translated_text": "", "translated_segments": []}

        # 翻译每个分段（上下文感知：传入前后段作为 context）
        translated_segments = self._translate_segments(segments, source_lang, target_lang)

        # 合并完整文本
        translated_text = " ".join(s["text"] for s in translated_segments)

        logger.info("翻译完成 episode={} segments={}", episode_id, len(translated_segments))

        return {
            "translated_text": translated_text,
            "translated_segments": translated_segments,
            "source_lang": source_lang,
            "target_lang": target_lang,
        }

    # ------------------------------------------------------------------
    # DeepL API
    # ------------------------------------------------------------------

    def _translate_segments(self, segments: list, source_lang: str, target_lang: str) -> list:
        """
        分段翻译（带上下文）

        DeepL 策略：
        - 每 10 段合并为一次 API 请求（减少调用次数）
        - 段间用特殊分隔符标记，翻译后拆分
        - 后期可用 LLM 做上下文感知批量翻译
        """
        SEPARATOR = " [SEGMENT_BREAK] "
        batch_size = 10
        result = []

        for i in range(0, len(segments), batch_size):
            batch = segments[i : i + batch_size]

            # 合并为单个文本，用分隔符标记段边界
            combined = SEPARATOR.join(seg["text"] for seg in batch)

            # 调用 DeepL API
            translated_combined = self._call_deepl(combined, source_lang, target_lang)

            # 拆分回分段
            translated_texts = translated_combined.split(SEPARATOR)

            for j, seg in enumerate(batch):
                translated_seg = {
                    "start": seg["start"],
                    "end": seg["end"],
                    "text": translated_texts[j].strip() if j < len(translated_texts) else "",
                    "original_text": seg["text"],
                }
                result.append(translated_seg)

        return result

    def _call_deepl(self, text: str, source_lang: str, target_lang: str) -> str:
        """调用 DeepL Translate API"""
        import requests

        url = "https://api-free.deepl.com/v2/translate"  # 免费版
        source_code = self.lang_map.get(source_lang)
        target_code = self.lang_map.get(target_lang, "EN-US")

        payload = {
            "text": [text],
            "target_lang": target_code,
            "preserve_formatting": True,
        }
        if source_code:
            payload["source_lang"] = source_code

        headers = {
            "Authorization": f"DeepL-Auth-Key {self.api_key}",
            "Content-Type": "application/json",
        }

        logger.debug("DeepL API 请求: {} → {} ({} 字符)", source_lang, target_lang, len(text))

        resp = requests.post(url, json=payload, headers=headers, timeout=30)
        resp.raise_for_status()

        data = resp.json()
        translated = data["translations"][0]["text"]
        return translated

    # ------------------------------------------------------------------
    # 术语表管理（后期实现）
    # ------------------------------------------------------------------

    def load_glossary(self, glossary_name: str):
        """加载术语表（后期功能：确保专业术语翻译一致性）"""
        # TODO: DeepL Glossary API 集成
        pass
