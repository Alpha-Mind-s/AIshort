"""
AI shot — HTTP API Server

提供 RESTful API 供前端/后端直接调用 AI 能力。

Endpoints:
    POST /api/v1/ai/asr          — 视频/音频 → 语音识别
    POST /api/v1/ai/translate    — 文本翻译
    POST /api/v1/ai/pipeline     — ASR + 翻译一键完成
    GET  /api/v1/ai/health       — 健康检查

Usage:
    python server.py                    # 默认 8085 端口
    python server.py --port 8085
"""

import sys
import argparse
from pathlib import Path

# Ensure ai/ in path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

from config import settings
from asr import ASRProcessor
from translate import TranslationProcessor

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="AI shot — AI Service",
    description="ASR (Whisper) + Translation (LLM) REST API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global processors (lazy init)
_asr = None
_translator = None

def get_asr():
    global _asr
    if _asr is None:
        _asr = ASRProcessor()
    return _asr

def get_translator():
    global _translator
    if _translator is None:
        _translator = TranslationProcessor()
    return _translator

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ASRRequest(BaseModel):
    video_url: str = Field(..., description="Video/audio file path or URL")
    source_lang: str = Field(default="zh", description="Source language code")

class ASRResponse(BaseModel):
    transcript: str
    segments: list
    srt_path: str
    duration: float
    language: str

class TranslateRequest(BaseModel):
    segments: list = Field(..., description="Segments with start/end/text")
    source_lang: str = Field(default="zh")
    target_lang: str = Field(default="en")

class TranslateResponse(BaseModel):
    translated_text: str
    translated_segments: list
    source_lang: str
    target_lang: str

class PipelineRequest(BaseModel):
    video_url: str = Field(..., description="Video/audio file path or URL")
    source_lang: str = Field(default="zh")
    target_lang: str = Field(default="en")

class PipelineResponse(BaseModel):
    asr: ASRResponse
    translation: TranslateResponse

class HealthResponse(BaseModel):
    status: str
    whisper_model: str
    llm_model: str
    llm_mode: str  # "local" or "cloud"

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/v1/ai/health", response_model=HealthResponse)
def health():
    """健康检查 + 当前配置信息"""
    mode = "local" if "localhost" in settings.LLM_BASE_URL or "127.0.0.1" in settings.LLM_BASE_URL else "cloud"
    return HealthResponse(
        status="ok",
        whisper_model=settings.WHISPER_MODEL,
        llm_model=settings.LLM_MODEL,
        llm_mode=mode,
    )


@app.post("/api/v1/ai/asr", response_model=ASRResponse)
def asr_endpoint(req: ASRRequest):
    """视频/音频 → 语音识别 + SRT 字幕"""
    try:
        msg = {
            "job_id": 0,
            "episode_id": None,
            "job_type": "asr",
            "input": {
                "video_url": req.video_url,
                "source_lang": req.source_lang,
            },
        }
        result = get_asr().process(msg)
        return ASRResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/ai/translate", response_model=TranslateResponse)
def translate_endpoint(req: TranslateRequest):
    """ASR 分段 → 翻译"""
    try:
        msg = {
            "job_id": 0,
            "episode_id": None,
            "job_type": "translate",
            "input": {
                "segments": req.segments,
                "source_lang": req.source_lang,
                "target_lang": req.target_lang,
            },
        }
        result = get_translator().process(msg)
        return TranslateResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/ai/pipeline", response_model=PipelineResponse)
def pipeline_endpoint(req: PipelineRequest):
    """一键 ASR + 翻译"""
    try:
        # Step 1: ASR
        asr_msg = {
            "job_id": 0,
            "episode_id": None,
            "job_type": "asr",
            "input": {
                "video_url": req.video_url,
                "source_lang": req.source_lang,
                "target_lang": req.target_lang,
            },
        }
        asr_result = get_asr().process(asr_msg)

        # Step 2: Translate
        translate_msg = {
            "job_id": 0,
            "episode_id": None,
            "job_type": "translate",
            "input": {
                "segments": asr_result["segments"],
                "source_lang": req.source_lang,
                "target_lang": req.target_lang,
            },
        }
        translate_result = get_translator().process(translate_msg)

        return PipelineResponse(
            asr=ASRResponse(**asr_result),
            translation=TranslateResponse(**translate_result),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Entry
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AI shot HTTP Server")
    parser.add_argument("--port", type=int, default=8085, help="Server port")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Bind address")
    args = parser.parse_args()

    settings.TEMP_DIR.mkdir(parents=True, exist_ok=True)
    settings.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"\n  AI shot Server starting on http://{args.host}:{args.port}")
    print(f"  Whisper: {settings.WHISPER_MODEL}")
    print(f"  LLM:     {settings.LLM_MODEL} (base_url={settings.LLM_BASE_URL or 'OpenAI default'})")
    print(f"  Docs:    http://localhost:{args.port}/docs\n")

    uvicorn.run(app, host=args.host, port=args.port, log_level="info")
