# AI shot 数据库设计文档

> 文档版本：V1.0 | 数据库：PostgreSQL 16+

## 1. 核心实体关系

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│    User     │────>│   Favorite       │<────│    Drama     │
├─────────────┤     ├──────────────────┤     ├──────────────┤
│ id (PK)     │     │ id (PK)          │     │ id (PK)      │
│ email       │     │ user_id (FK)     │     │ title        │
│ nickname    │     │ drama_id (FK)    │     │ description  │
│ avatar_url  │     │ created_at       │     │ cover_url    │
│ oauth_provider│   └──────────────────┘     │ category_id  │
│ oauth_id    │                              │ creator_id   │
│ password_hash│    ┌──────────────────┐     │ status       │
│ role        │────>│   Comment        │     │ release_at   │
│ language    │     ├──────────────────┤     └──────┬───────┘
│ region      │     │ id (PK)          │            │
│ created_at  │     │ user_id (FK)     │     ┌──────┴───────┐
└─────────────┘     │ drama_id (FK)    │     │   Episode    │
                    │ parent_id (FK)   │     ├──────────────┤
┌─────────────┐     │ content          │     │ id (PK)      │
│ Subscription│     │ likes_count      │     │ drama_id (FK)│
├─────────────┤     │ created_at       │     │ episode_no   │
│ id (PK)     │     └──────────────────┘     │ title        │
│ user_id (FK)│                              │ duration     │
│ plan_type   │     ┌──────────────────┐     │ video_url    │
│ start_at    │     │   VideoAsset     │     │ status       │
│ end_at      │     ├──────────────────┤     └──────┬───────┘
│ status      │     │ id (PK)          │            │
│ auto_renew  │     │ episode_id (FK)  │     ┌──────┴───────┐
└─────────────┘     │ resolution       │     │ Localization │
                    │ file_url         │     ├──────────────┤
┌─────────────┐     │ file_size        │     │ id (PK)      │
│  Payment    │     │ duration         │     │ episode_id   │
├─────────────┤     │ codec            │     │ language     │
│ id (PK)     │     └──────────────────┘     │ dub_url      │
│ user_id     │                              │ subtitle_url │
│ amount      │     ┌──────────────────┐     │ lip_sync_url │
│ currency    │     │  AI_Job          │     │ status       │
│ status      │     ├──────────────────┤     └──────────────┘
│ channel     │     │ id (PK)          │
│ created_at  │     │ episode_id (FK)  │
└─────────────┘     │ job_type         │
                    │ status           │
                    │ result_meta(JSON)│
                    │ created_at       │
                    └──────────────────┘
```

## 2. 核心表设计

### 2.1 用户表 (users)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 主键 |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 邮箱 |
| nickname | VARCHAR(100) | NOT NULL | 昵称 |
| avatar_url | VARCHAR(500) | | 头像 URL |
| password_hash | VARCHAR(255) | | BCrypt 密码哈希 |
| oauth_provider | VARCHAR(50) | | OAuth 提供商 (google/apple/facebook) |
| oauth_id | VARCHAR(255) | | OAuth 用户 ID |
| role | VARCHAR(20) | DEFAULT 'user' | 角色 (user/creator/admin/superadmin) |
| language | VARCHAR(10) | | 偏好语言 (en/es/pt/zh) |
| region | VARCHAR(10) | | 地区代码 |
| status | VARCHAR(20) | DEFAULT 'active' | 状态 (active/banned/inactive) |
| created_at | TIMESTAMPTZ | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | NOT NULL | 更新时间 |

**索引：**
- `idx_users_email` ON email (UNIQUE)
- `idx_users_oauth` ON (oauth_provider, oauth_id) (UNIQUE)
- `idx_users_status` ON status

### 2.2 短剧表 (dramas)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 主键 |
| title | VARCHAR(500) | NOT NULL | 标题 |
| description | TEXT | | 描述 |
| cover_url | VARCHAR(500) | | 封面图 URL |
| category_id | INT | FK → categories.id | 分类 |
| creator_id | BIGINT | FK → users.id | 创作者用户 ID |
| total_episodes | INT | DEFAULT 0 | 总集数 |
| status | VARCHAR(20) | DEFAULT 'draft' | 状态 (draft/published/reviewing/archived) |
| tags | JSONB | DEFAULT '[]' | 标签数组 |
| release_at | TIMESTAMPTZ | | 发布时间 |
| created_at | TIMESTAMPTZ | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | NOT NULL | 更新时间 |

**索引：**
- `idx_dramas_creator` ON creator_id
- `idx_dramas_category` ON category_id
- `idx_dramas_status` ON status
- `idx_dramas_release` ON release_at
- `idx_dramas_tags` GIN ON tags

### 2.3 剧集表 (episodes)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 主键 |
| drama_id | BIGINT | FK → dramas.id, NOT NULL | 关联短剧 |
| episode_no | INT | NOT NULL | 集号 |
| title | VARCHAR(500) | | 标题 |
| duration | INT | | 时长（秒） |
| video_url | VARCHAR(500) | | 原始视频 URL |
| status | VARCHAR(20) | DEFAULT 'processing' | 状态 (processing/ready/failed) |
| created_at | TIMESTAMPTZ | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | NOT NULL | 更新时间 |

**索引：**
- `idx_episodes_drama` ON drama_id
- `UNIQUE (drama_id, episode_no)`

### 2.4 视频资产表 (video_assets)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 主键 |
| episode_id | BIGINT | FK → episodes.id, NOT NULL | 关联剧集 |
| resolution | VARCHAR(10) | NOT NULL | 分辨率 (1080p/720p/480p) |
| file_url | VARCHAR(500) | NOT NULL | 文件 URL |
| file_size | BIGINT | | 文件大小（字节） |
| duration | INT | | 时长（秒） |
| codec | VARCHAR(20) | | 编码格式 |
| bitrate | INT | | 码率 (kbps) |
| created_at | TIMESTAMPTZ | NOT NULL | 创建时间 |

**索引：**
- `idx_video_assets_episode` ON episode_id

### 2.5 本地化表 (localizations)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 主键 |
| episode_id | BIGINT | FK → episodes.id, NOT NULL | 关联剧集 |
| language | VARCHAR(10) | NOT NULL | 语言代码 (en/es/pt/ja/ko) |
| title_translated | VARCHAR(500) | | 翻译标题 |
| dub_url | VARCHAR(500) | | 配音音频 URL |
| subtitle_url | VARCHAR(500) | | 字幕文件 URL (SRT/VTT) |
| lip_sync_url | VARCHAR(500) | | 口型同步视频 URL |
| status | VARCHAR(20) | DEFAULT 'pending' | 处理状态 (pending/processing/completed/failed) |
| created_at | TIMESTAMPTZ | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | NOT NULL | 更新时间 |

**索引：**
- `idx_localizations_episode` ON episode_id
- `UNIQUE (episode_id, language)`

### 2.6 收藏表 (favorites)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 主键 |
| user_id | BIGINT | FK → users.id, NOT NULL | 用户 ID |
| drama_id | BIGINT | FK → dramas.id, NOT NULL | 短剧 ID |
| created_at | TIMESTAMPTZ | NOT NULL | 收藏时间 |

**索引：**
- `idx_favorites_user` ON user_id
- `UNIQUE (user_id, drama_id)`

### 2.7 评论表 (comments)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 主键 |
| user_id | BIGINT | FK → users.id, NOT NULL | 用户 ID |
| drama_id | BIGINT | FK → dramas.id, NOT NULL | 短剧 ID |
| parent_id | BIGINT | FK → comments.id | 父评论 ID（回复） |
| content | TEXT | NOT NULL | 评论内容 |
| likes_count | INT | DEFAULT 0 | 点赞数 |
| status | VARCHAR(20) | DEFAULT 'active' | 状态 (active/hidden/deleted) |
| created_at | TIMESTAMPTZ | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | NOT NULL | 更新时间 |

**索引：**
- `idx_comments_drama` ON drama_id
- `idx_comments_user` ON user_id
- `idx_comments_parent` ON parent_id

### 2.8 分类表 (categories)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | SERIAL | PK | 主键 |
| name | VARCHAR(100) | NOT NULL | 分类名称 |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | URL 友好标识 |
| parent_id | INT | FK → categories.id | 父分类 |
| sort_order | INT | DEFAULT 0 | 排序 |
| created_at | TIMESTAMPTZ | NOT NULL | 创建时间 |

### 2.9 订阅表 (subscriptions)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 主键 |
| user_id | BIGINT | FK → users.id, NOT NULL | 用户 ID |
| plan_type | VARCHAR(20) | NOT NULL | 计划类型 (monthly/quarterly/yearly) |
| start_at | TIMESTAMPTZ | NOT NULL | 开始时间 |
| end_at | TIMESTAMPTZ | NOT NULL | 结束时间 |
| status | VARCHAR(20) | DEFAULT 'active' | 状态 (active/cancelled/expired) |
| auto_renew | BOOLEAN | DEFAULT true | 自动续费 |
| created_at | TIMESTAMPTZ | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | NOT NULL | 更新时间 |

**索引：**
- `idx_subscriptions_user` ON user_id
- `idx_subscriptions_status` ON status

### 2.10 支付表 (payments)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 主键 |
| user_id | BIGINT | FK → users.id, NOT NULL | 用户 ID |
| subscription_id | BIGINT | FK → subscriptions.id | 关联订阅 |
| amount | DECIMAL(10,2) | NOT NULL | 金额 |
| currency | VARCHAR(3) | DEFAULT 'USD' | 货币 |
| status | VARCHAR(20) | NOT NULL | 状态 (pending/completed/failed/refunded) |
| channel | VARCHAR(20) | NOT NULL | 支付渠道 (paypal/stripe/apple/google) |
| channel_txn_id | VARCHAR(255) | | 渠道交易 ID |
| created_at | TIMESTAMPTZ | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | NOT NULL | 更新时间 |

**索引：**
- `idx_payments_user` ON user_id
- `idx_payments_channel_txn` ON (channel, channel_txn_id) (UNIQUE)
- `idx_payments_status` ON status
- `idx_payments_created` ON created_at

### 2.11 AI 任务表 (ai_jobs)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 主键 |
| episode_id | BIGINT | FK → episodes.id, NOT NULL | 关联剧集 |
| job_type | VARCHAR(20) | NOT NULL | 任务类型 (asr/translate/dubbing/lipsync) |
| status | VARCHAR(20) | DEFAULT 'pending' | 状态 (pending/processing/completed/failed) |
| result_meta | JSONB | | 结果元数据 JSON |
| error_message | TEXT | | 错误信息 |
| retry_count | INT | DEFAULT 0 | 重试次数 |
| created_at | TIMESTAMPTZ | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | NOT NULL | 更新时间 |

**索引：**
- `idx_ai_jobs_episode` ON episode_id
- `idx_ai_jobs_status` ON status
- `idx_ai_jobs_type` ON job_type

## 3. Redis 缓存设计

| Key 模式 | Value | TTL | 用途 |
|----------|-------|-----|------|
| `session:{token}` | UserSession JSON | 15min | Access Token 会话 |
| `refresh:{user_id}` | RefreshToken JSON | 30天 | Refresh Token |
| `drama:{id}:detail` | DramaDetail JSON | 5min | 短剧详情缓存 |
| `user:{id}:favorites` | FavoriteID[] | 1min | 用户收藏列表 |
| `hot:daily` | DramaID[] | 10min | 每日热门缓存 |
| `rate_limit:{ip}:{path}` | Counter | 1s-1min | 接口限流 |
| `queue:ai_jobs` | Job JSON | - | AI 任务队列 |

## 4. 数据库优化策略

- **读写分离**：主库写入，只读副本处理查询
- **索引策略**：覆盖索引、部分索引、复合索引
- **分表分库**：用户表按 ID 哈希分片（后期）
- **连接池**：PG Bouncer（应用层）+ 内部连接池
- **慢查询**：自动检测 + 慢查询日志 + 定期优化
