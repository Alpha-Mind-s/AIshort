"""Quick test for Translation module with Ollama"""
import sys
sys.path.insert(0, ".")

from translate import TranslationProcessor

msg = {
    "job_id": 1,
    "episode_id": None,
    "job_type": "translate",
    "input": {
        "transcript": "",
        "segments": [
            {"start": 0.0, "end": 4.94, "text": "你好,欢迎来到AI短视频平台,这是一段测试。"},
        ],
        "source_lang": "zh",
        "target_lang": "en"
    }
}

t = TranslationProcessor()
result = t.process(msg)

print("Source:")
for s in msg["input"]["segments"]:
    print(f"  ZH: {s['text']}")
print()
print("Translation:")
for s in result["translated_segments"]:
    print(f"  EN: {s['text']}")
