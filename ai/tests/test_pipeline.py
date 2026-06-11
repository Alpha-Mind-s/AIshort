"""
AI shot - ASR -> Translate pipeline end-to-end test

Usage:
    cd ai
    python tests/test_pipeline.py <video_or_audio_file> [--lang zh] [--target en]

Example:
    python tests/test_pipeline.py test_data/test_video.mp4
"""

import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from loguru import logger
logger.remove()
logger.add(sys.stdout, format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>", level="INFO", colorize=True)

from config import settings
from asr import ASRProcessor
from translate import TranslationProcessor


def main():
    if len(sys.argv) < 2:
        print(f"Usage: python {sys.argv[0]} <video_or_audio_file> [--lang zh] [--target en]")
        sys.exit(1)

    file_path = sys.argv[1]
    if not Path(file_path).exists():
        print(f"File not found: {file_path}")
        sys.exit(1)

    source_lang = "zh"
    target_lang = "en"
    if "--lang" in sys.argv:
        source_lang = sys.argv[sys.argv.index("--lang") + 1]
    if "--target" in sys.argv:
        target_lang = sys.argv[sys.argv.index("--target") + 1]

    # ensure dirs
    settings.TEMP_DIR.mkdir(parents=True, exist_ok=True)
    settings.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print(" AI shot - Pipeline Test: ASR -> Translate")
    print("=" * 60)
    print(f"  Input:       {file_path}")
    print(f"  Source lang: {source_lang}")
    print(f"  Target lang: {target_lang}")
    print(f"  Whisper:     {settings.WHISPER_MODEL}")
    print(f"  LLM:         {settings.LLM_MODEL}")
    print("=" * 60)

    # ==============================
    # Step 1: ASR
    # ==============================
    print("\n[Step 1] ASR - Speech Recognition...")
    t0 = time.perf_counter()

    asr = ASRProcessor()
    asr_msg = {
        "job_id": 1,
        "episode_id": None,
        "job_type": "asr",
        "input": {"video_url": file_path, "source_lang": source_lang, "target_lang": target_lang},
    }
    asr_result = asr.process(asr_msg)

    t1 = time.perf_counter()
    print(f"  Duration:   {asr_result['duration']:.1f}s")
    print(f"  Segments:   {len(asr_result['segments'])}")
    print(f"  Time:       {t1 - t0:.1f}s")
    print(f"  Transcript: {asr_result['transcript'][:80]}...")

    # ==============================
    # Step 2: Translate (using ASR output)
    # ==============================
    print("\n[Step 2] Translate - ZH -> EN...")

    translator = TranslationProcessor()
    translate_msg = {
        "job_id": 1,
        "episode_id": None,
        "job_type": "translate",
        "input": {
            "transcript": asr_result["transcript"],
            "segments": asr_result["segments"],
            "source_lang": source_lang,
            "target_lang": target_lang,
        },
    }
    translate_result = translator.process(translate_msg)

    t2 = time.perf_counter()
    print(f"  Segments:   {len(translate_result['translated_segments'])}")
    print(f"  Time:       {t2 - t1:.1f}s")

    # ==============================
    # Result
    # ==============================
    print("\n" + "=" * 60)
    print(" RESULT")
    print("=" * 60)
    for i, seg in enumerate(asr_result["segments"]):
        zh = seg["text"]
        en = ""
        if i < len(translate_result["translated_segments"]):
            en = translate_result["translated_segments"][i]["text"]
        print(f"\n  --- Segment {i+1} [{seg['start']:.1f}s - {seg['end']:.1f}s] ---")
        print(f"  ZH: {zh}")
        print(f"  EN: {en}")

    total_time = t2 - t0
    print(f"\n[OK] Pipeline complete! Total: {total_time:.1f}s")

    # print SRT
    srt_path = Path(asr_result["srt_path"])
    if srt_path.exists():
        print(f"\n  SRT saved: {srt_path}")


if __name__ == "__main__":
    main()
