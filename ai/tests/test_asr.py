"""
ASR 模块本地测试脚本

用法:
    cd ai
    python tests/test_asr.py <视频或音频文件路径> [--lang zh]

示例:
    python tests/test_asr.py ../test_data/sample.mp4
    python tests/test_asr.py ../test_data/sample.mp4 --lang en
    python tests/test_asr.py ../test_data/audio.mp3 --lang zh

依赖:
    - openai-whisper (pip install openai-whisper)
    - ffmpeg / ffprobe (需在 PATH 中)
"""

import sys
import time
from pathlib import Path

# 将 ai/ 加入 Python Path（方便在 tests/ 目录下直接运行）
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from loguru import logger

logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>",
    level="DEBUG",
    colorize=True,
)

from asr import ASRProcessor
from config import settings


def main():
    if len(sys.argv) < 2:
        print(f"用法: python {sys.argv[0]} <视频/音频文件> [--lang zh]")
        sys.exit(1)

    file_path = sys.argv[1]
    if not Path(file_path).exists():
        print(f"文件不存在: {file_path}")
        sys.exit(1)

    lang = "zh"
    if "--lang" in sys.argv:
        idx = sys.argv.index("--lang")
        lang = sys.argv[idx + 1]

    # 构造模拟消息（与 worker.py 中的消息格式一致）
    msg = {
        "job_id": 1,
        "episode_id": None,  # 本地测试没有 episode
        "job_type": "asr",
        "input": {
            "video_url": file_path,   # 也支持 audio_url
            "source_lang": lang,
            "target_lang": "en",
        },
    }

    print("=" * 60)
    print(" AI shot — ASR 模块本地测试")
    print("=" * 60)
    print(f"  输入文件: {file_path}")
    print(f"  源语言:   {lang}")
    print(f"  Whisper:  {settings.WHISPER_MODEL}")
    print("=" * 60)

    # 确保必要目录存在
    settings.TEMP_DIR.mkdir(parents=True, exist_ok=True)
    settings.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    t0 = time.perf_counter()

    processor = ASRProcessor()
    result = processor.process(msg)

    elapsed = time.perf_counter() - t0

    # 打印结果
    print()
    print("=" * 60)
    print(" [Transcript] 转录结果")
    print("=" * 60)
    print(f"  时长:     {result['duration']:.1f} 秒")
    print(f"  字数:     {len(result['transcript'])} 字")
    print(f"  分段数:   {len(result['segments'])} 段")
    print(f"  处理耗时: {elapsed:.1f} 秒")
    print()

    print("--- 完整文本 ---")
    print(result["transcript"])
    print()

    print("--- 前 5 段 (带时间戳) ---")
    for seg in result["segments"][:5]:
        print(f"  [{seg['start']:6.1f}s → {seg['end']:6.1f}s]  {seg['text']}")
    if len(result["segments"]) > 5:
        print(f"  ... (共 {len(result['segments'])} 段)")
    print()

    print(f"--- SRT 文件 ---")
    srt_path = Path(result["srt_path"])
    if srt_path.exists():
        print(f"  路径: {srt_path}")
        print(f"  大小: {srt_path.stat().st_size} 字节")
        print()
        print("  SRT 前 10 行:")
        srt_lines = srt_path.read_text(encoding="utf-8").split("\n")
        for line in srt_lines[:10]:
            print(f"    {line}")
    print()

    print("[OK] 测试完成!")


if __name__ == "__main__":
    main()
