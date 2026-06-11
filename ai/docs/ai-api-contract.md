# AI Worker → 后端 API 接口契约

> **阅读对象**: Agent 1（Go 后端）
> **用途**: AI Worker 通过 API Gateway 回调更新任务状态和本地化结果
> **接口前缀**: `/api/v1/internal`

---

## 概述

AI Worker 采用 **API 回调模式**（不直连数据库），所有数据写入通过以下 4 个 internal 接口完成：

| 方法 | 路径 | 用途 |
|------|------|------|
| `PUT` | `/internal/ai/jobs/{job_id}/status` | 更新 AI 任务状态 |
| `PUT` | `/internal/episodes/{episode_id}/localization` | 写入/更新本地化结果 |
| `GET` | `/internal/episodes/{episode_id}` | 查询剧集信息（含原始视频 URL） |
| `GET` | `/internal/ai/jobs` | 查询待处理任务（Worker 恢复用） |

---

## 1. 更新 AI 任务状态

```
PUT /api/v1/internal/ai/jobs/{job_id}/status
```

AI Worker 在处理过程中回调此接口，更新 `ai_jobs` 表状态。

### 请求体

```json
{
    "status": "processing",
    "result_meta": {
        "transcript": "原始转录文本...",
        "segments": [
            {"start": 0.0, "end": 2.5, "text": "你好"}
        ]
    },
    "error_message": null
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `status` | string | ✅ | `processing` / `completed` / `failed` |
| `result_meta` | object | ❌ | 完成时的结果元数据（JSONB，存入 ai_jobs.result_meta） |
| `error_message` | string | ❌ | 失败时的错误信息（存入 ai_jobs.error_message） |

### 后端处理逻辑

```
status == "processing"
  → UPDATE ai_jobs SET status = 'processing', updated_at = NOW()

status == "completed"
  → UPDATE ai_jobs SET status = 'completed', result_meta = ?::jsonb, updated_at = NOW()

status == "failed"
  → UPDATE ai_jobs SET status = 'failed', error_message = ?, retry_count = retry_count + 1, updated_at = NOW()
```

### 响应

```json
{
    "code": 0,
    "message": "success"
}
```

---

## 2. 写入本地化结果

```
PUT /api/v1/internal/episodes/{episode_id}/localization
```

每个管线阶段完成后，AI Worker 回调此接口写入对应字段。

### 请求体

```json
{
    "language": "en",
    "subtitle_url": "s3://aishot-videos/localized/456/subtitle.srt",
    "title_translated": "The CEO's Contract Wife",
    "dub_url": "s3://aishot-videos/localized/456/dub_en.mp3",
    "lip_sync_url": "s3://aishot-videos/localized/456/lipsync_en.mp4",
    "status": "completed"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `language` | string | ✅ | 语言代码（en/es/pt/ja/ko） |
| `subtitle_url` | string | ❌ | 字幕文件 URL（ASR 阶段写入） |
| `title_translated` | string | ❌ | 翻译后标题（翻译阶段写入） |
| `dub_url` | string | ❌ | 配音音频 URL（配音阶段写入） |
| `lip_sync_url` | string | ❌ | 口型同步视频 URL（口型同步阶段写入） |
| `status` | string | ❌ | `completed` / `failed` |

### 后端处理逻辑

```
UPSERT localizations (episode_id, language)
  SET 非空字段（subtitle_url / title_translated / dub_url / lip_sync_url）
  SET status = ?, updated_at = NOW()
```

> **注意**: 各阶段**增量更新**，只更新传入的非空字段，不覆盖已完成的字段。

### 响应

```json
{
    "code": 0,
    "message": "success",
    "data": {
        "id": 789,
        "episode_id": 456,
        "language": "en",
        "subtitle_url": "s3://...",
        "dub_url": "s3://...",
        "lip_sync_url": "s3://...",
        "status": "completed"
    }
}
```

---

## 3. 查询剧集信息

```
GET /api/v1/internal/episodes/{episode_id}
```

AI Worker 内部查询剧集元数据（如原始视频 URL）。

### 响应

```json
{
    "code": 0,
    "message": "success",
    "data": {
        "id": 456,
        "drama_id": 100,
        "episode_no": 1,
        "title": "第一集",
        "duration": 180,
        "video_url": "s3://aishot-videos/videos/original.mp4",
        "status": "processing"
    }
}
```

---

## 4. 查询待处理任务

```
GET /api/v1/internal/ai/jobs?status=pending,processing&job_type=asr&limit=10
```

Worker 启动时调用，恢复异常中断的任务。

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `status` | string | ✅ | 任务状态（逗号分隔），如 `pending,processing` |
| `job_type` | string | ❌ | 任务类型筛选：`asr` / `translate` / `dubbing` / `lipsync` |
| `limit` | int | ❌ | 返回数量上限（默认 50） |

### 响应

```json
{
    "code": 0,
    "message": "success",
    "data": [
        {
            "id": 123,
            "episode_id": 456,
            "job_type": "asr",
            "status": "pending",
            "input_meta": {
                "audio_url": "s3://bucket/audio.mp3",
                "source_lang": "zh",
                "target_lang": "en"
            },
            "created_at": "2026-06-11T10:00:00Z"
        }
    ]
}
```

> **注意**: `input_meta` 字段需要在 `ai_jobs` 表中新增一个 JSONB 列，创建任务时由后端填充。（当前 schema 中没有，需要 Agent 1 补充）

---

## 5. 认证方式

Internal 接口使用 **API Key** 认证（不走 JWT 用户认证）：

```
Authorization: Bearer {INTERNAL_API_KEY}
```

- 通过环境变量 `INTERNAL_API_KEY` 配置
- 后端在 Gateway 层验证该 Key

---

## 6. 错误响应

所有接口 4xx/5xx 时返回统一格式：

```json
{
    "code": 50001,
    "message": "AI job not found",
    "details": {
        "job_id": 123
    }
}
```

| HTTP Status | 场景 |
|-------------|------|
| 400 | 参数校验失败 |
| 401 | Internal API Key 无效 |
| 404 | 任务/剧集不存在 |
| 500 | 服务器内部错误 |

---

## 7. 数据库变更需求

`ai_jobs` 表需要新增一个字段（当前 schema 中缺少）：

| 字段 | 类型 | 说明 |
|------|------|------|
| `input_meta` | JSONB | 任务输入参数（audio_url, source_lang, target_lang 等） |

> Migration 由 Agent 1 统一管理。这是一个纯增量的 ALTER TABLE。
