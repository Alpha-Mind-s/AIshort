"""
AI shot — 文本翻译模块

技术选型: LLM API（OpenAI 兼容接口）
- 上下文感知批量翻译
- 支持 OpenAI / DeepSeek / 本地 Ollama 等多种后端
- 术语一致性控制
"""

from loguru import logger
from openai import OpenAI

from config import settings


class TranslationProcessor:
    """LLM 翻译处理器"""

    # 翻译 System Prompt
    SYSTEM_PROMPT = """You are a professional subtitle translator for short drama series.
Translate the given Chinese text into natural, colloquial {target_lang_name}.
Rules:
- Preserve the original tone and emotion (anger, sadness, humor, etc.)
- Keep translations concise — spoken dialogue, not written prose
- Maintain consistency: same term → same translation throughout
- Do NOT translate character names, place names, or brand names
- Output ONLY the translated text, no explanations, no notes
- Preserve [SEGMENT_BREAK] separators exactly as-is in the output"""

    def __init__(self):
        self.client = OpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.LLM_BASE_URL or None,  # None = default OpenAI
        )
        self.model = settings.LLM_MODEL
        self.temperature = 0.3  # 低温度保证翻译一致性

    # ------------------------------------------------------------------
    # 核心处理
    # ------------------------------------------------------------------

    def process(self, msg: dict) -> dict:
        """
        执行文本翻译

        输入:
            msg["input"]["transcript"]       — 原始转录文本
            msg["input"]["segments"]         — 带时间戳的分段
            msg["input"]["source_lang"]      — 源语言，如 "zh"
            msg["input"]["target_lang"]      — 目标语言，如 "en"

        返回:
            {
                "translated_text": "完整翻译文本",
                "translated_segments": [...],    # 分段翻译（保留时间戳）
                "source_lang": "zh",
                "target_lang": "en"
            }
        """
        source_lang = msg["input"].get("source_lang", "zh")
        target_lang = msg["input"].get("target_lang", "en")
        segments = msg["input"].get("segments", [])
        episode_id = msg.get("episode_id")

        target_lang_name = self._lang_name(target_lang)
        logger.info("LLM 翻译开始 episode={} {} → {} (model={})",
                     episode_id, source_lang, target_lang, self.model)

        if not segments:
            logger.warning("无分段数据，跳过翻译")
            return {"translated_text": "", "translated_segments": []}

        # 分批翻译（每批最多 15 段，控制上下文长度）
        batch_size = 15
        translated_segments = []

        for i in range(0, len(segments), batch_size):
            batch = segments[i:i + batch_size]
            translated_batch = self._translate_batch(batch, target_lang, target_lang_name)
            translated_segments.extend(translated_batch)

        # 合并完整文本
        translated_text = " ".join(s["text"] for s in translated_segments)

        logger.info("LLM 翻译完成 episode={} segments={}", episode_id, len(translated_segments))

        return {
            "translated_text": translated_text,
            "translated_segments": translated_segments,
            "source_lang": source_lang,
            "target_lang": target_lang,
        }

    # ------------------------------------------------------------------
    # LLM 翻译
    # ------------------------------------------------------------------

    def _translate_batch(self, segments: list, target_lang: str, target_lang_name: str) -> list:
        """
        批量翻译一个分段组

        策略:
        1. 用 [SEGMENT_BREAK] 分隔符拼接各段
        2. 发送给 LLM 一次性翻译
        3. 按分隔符拆分回独立分段
        """
        SEP = "[SEGMENT_BREAK]"

        # 构建输入文本（带段编号便于调试）
        texts = []
        for i, seg in enumerate(segments):
            texts.append(f"<seg{i}>{seg['text']}</seg{i}>")
        combined = f"\n{SEP}\n".join(texts)

        # 构建 Prompt
        system_prompt = self.SYSTEM_PROMPT.format(target_lang_name=target_lang_name)

        user_prompt = (
            f"Translate the following lines from Chinese to {target_lang_name}.\n"
            f"Each line is wrapped in <segN> tags. "
            f"Output the translations in the same format, separated by '{SEP}'.\n"
            f"Keep <segN> tags EXACTLY as-is — only translate the text inside.\n\n"
            f"{combined}"
        )

        # 调用 LLM
        logger.debug("LLM 翻译请求: {} segments, ~{} chars", len(segments), len(combined))

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=self.temperature,
            max_tokens=4096,
        )

        translated_combined = response.choices[0].message.content.strip()
        logger.debug("LLM 翻译响应: {} chars", len(translated_combined))

        # 拆分回分段
        translated_parts = translated_combined.split(SEP)
        import re

        result = []
        for j, seg in enumerate(segments):
            translated_text = ""
            if j < len(translated_parts):
                part = translated_parts[j].strip()
                # 提取 <segN>...</segN> 中的内容
                match = re.search(rf"<seg{j}>\s*(.*?)\s*</seg{j}>", part, re.DOTALL)
                if match:
                    translated_text = match.group(1).strip()
                else:
                    # 回退1：尝试匹配任意 <seg\d+> 标签
                    fallback = re.sub(r"<seg\d+>\s*|\s*</seg\d+>", "", part).strip()
                    # 回退2：如果去除标签后为空，直接用整段
                    translated_text = fallback if fallback else part

            result.append({
                "start": seg["start"],
                "end": seg["end"],
                "text": translated_text,
                "original_text": seg["text"],
            })

        return result

    # ------------------------------------------------------------------
    # 工具
    # ------------------------------------------------------------------

    def _lang_name(self, code: str) -> str:
        """语言代码 → 英文名称"""
        names = {
            "zh": "Chinese",
            "en": "English",
            "es": "Spanish",
            "pt": "Portuguese",
            "ja": "Japanese",
            "ko": "Korean",
            "fr": "French",
            "de": "German",
            "ar": "Arabic",
            "th": "Thai",
            "vi": "Vietnamese",
        }
        return names.get(code, code)
