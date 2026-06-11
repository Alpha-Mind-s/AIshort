# AI shot 后端 Go 服务设计文档

> 文档版本：V1.0 | 编写日期：2026-06-11 | 状态：已批准

## 1. 项目模块结构

采用 **Go Workspace（多模块）** 方案，每个服务独立 go.mod，通过 `go.work` 统一管理。

```
backend/
├── go.work                      # Go Workspace 定义
├── migrations/                  # 数据库迁移 SQL 文件
│   ├── 000001_create_users_table.up.sql
│   ├── 000001_create_users_table.down.sql
│   ├── 000002_create_categories_table.up.sql
│   ├── ...
│   └── 000011_create_ai_jobs_table.down.sql
│
├── pkg/                         # 公共共享库 (go.mod: github.com/ai-shot/pkg)
│   ├── config/                  #   环境变量配置管理
│   ├── database/                #   PostgreSQL 连接与迁移
│   ├── redis/                   #   Redis 客户端封装
│   ├── logger/                  #   结构化日志 (zerolog)
│   ├── response/                #   统一 API 响应格式
│   ├── errors/                  #   错误码与领域错误
│   └── auth/                    #   JWT 签发/验证/黑名单
│
├── cmd/
│   └── gateway/                 # API 网关 (go.mod: github.com/ai-shot/gateway)
│       └── main.go
│
└── services/
    ├── user/                    # 用户认证服务 (go.mod: github.com/ai-shot/user-svc)
    ├── content/                 # 内容服务
    ├── video/                   # 视频管理服务
    └── payment/                 # 支付订阅服务
```

### 1.1 Go Workspace 配置

```go
// backend/go.work
go 1.22

use (
    ./pkg
    ./cmd/gateway
    ./services/user
    ./services/content
    ./services/video
    ./services/payment
)
```

每个服务 Module 的 `go.mod` 通过 `replace` 指令引用本地 `pkg`：

```go
require github.com/ai-shot/pkg v0.0.0
replace github.com/ai-shot/pkg => ../../pkg
```

---

## 2. 公共共享库 — pkg

### 2.1 config — 配置管理

从环境变量读取配置，每个服务加载自己的配置子集。

**核心设计：**
- 使用 `os.Getenv` + 默认值，不依赖第三方 config 库（KISS 原则）
- 每个配置结构体有 `Load()` 方法，返回带默认值的 Config
- 各服务可在自己的 `internal/config/` 中嵌入 `pkg/config` 的公共配置

```go
// pkg/config/config.go
type Config struct {
    Server   ServerConfig
    Database DatabaseConfig
    Redis    RedisConfig
    JWT      JWTConfig
}

type ServerConfig struct {
    Addr string // 默认 :8080
}

type DatabaseConfig struct {
    DSN string // 默认 postgres://aishot:aishot@localhost:5432/aishot?sslmode=disable
}

type RedisConfig struct {
    Addr string // 默认 localhost:6379
}

type JWTConfig struct {
    Secret          string        // 签名密钥
    AccessTokenTTL  time.Duration // 默认 15min
    RefreshTokenTTL time.Duration // 默认 30天
}
```

### 2.2 logger — 结构化日志

基于 `rs/zerolog` 实现，提供全局 Logger。

```go
// pkg/logger/logger.go
func Init(level string) // 初始化（开发环境 console writer，生产 JSON writer）
func Info() *zerolog.Event
func Error() *zerolog.Event
func Fatal() *zerolog.Event
func WithRequestID(id string) *zerolog.Logger // 携带请求 ID 的子 Logger
```

日志输出格式（生产环境）：
```json
{"level":"info","time":"2026-06-11T10:00:00Z","caller":"handler/auth.go:42","request_id":"req-xxx","message":"user registered"}
```

### 2.3 database — PostgreSQL 连接

基于 `pgx/v5`（高性能 Go PostgreSQL 驱动），提供连接池管理。

```go
// pkg/database/database.go
func NewPool(dsn string) (*pgxpool.Pool, error) // 创建连接池
func RunMigrations(pool *pgxpool.Pool, migrationsDir string) error // 运行迁移
```

- 使用 pgx 的连接池（默认 MaxConns=25）
- RunMigrations 遍历 `migrations/` 目录执行 SQL 文件（按文件名排序）

### 2.4 redis — Redis 客户端

基于 `go-redis/redis/v9`。

```go
// pkg/redis/redis.go
func NewClient(addr string) (*redis.Client, error)
```

### 2.5 response — 统一 API 响应

贴合 OpenAPI 中的 `ApiResponse` 规范。

```go
// pkg/response/response.go
type Response struct {
    Code    int         `json:"code"`    // 0=成功
    Message string      `json:"message"`
    Data    interface{} `json:"data"`
    Meta    *Meta       `json:"meta,omitempty"`
}

type Meta struct {
    Page     int `json:"page"`
    PageSize int `json:"page_size"`
    Total    int `json:"total"`
}

func OK(c *gin.Context, data interface{})           // 200 {code:0, message:"success", data:...}
func Page(c *gin.Context, data interface{}, meta Meta) // 分页响应
func Error(c *gin.Context, httpStatus int, err *errors.AppError) // 错误响应
```

### 2.6 errors — 错误码体系

| 错误码 | 常量名 | HTTP 状态码 | 说明 |
|--------|--------|-------------|------|
| 0 | `ErrOK` | 200 | 成功 |
| 10001 | `ErrBadRequest` | 400 | 请求参数错误 |
| 10002 | `ErrUnauthorized` | 401 | 未认证 |
| 10003 | `ErrForbidden` | 403 | 无权限 |
| 10004 | `ErrNotFound` | 404 | 资源不存在 |
| 10005 | `ErrConflict` | 409 | 资源冲突 |
| 10006 | `ErrTooManyRequests` | 429 | 请求太频繁 |
| 10007 | `ErrInternal` | 500 | 服务器内部错误 |
| 20001 | `ErrEmailExists` | 409 | 邮箱已注册 |
| 20002 | `ErrInvalidCredentials` | 401 | 邮箱或密码错误 |
| 20003 | `ErrTokenExpired` | 401 | Token 已过期 |
| 20004 | `ErrTokenInvalid` | 401 | 无效 Token |
| 20005 | `ErrOAuthFailed` | 401 | OAuth 登录失败 |
| 30001 | `ErrFavoriteExists` | 409 | 已收藏 |
| 30002 | `ErrFavoriteNotFound` | 404 | 收藏不存在 |
| 30003 | `ErrCommentForbidden` | 403 | 无权删除评论 |
| 40001 | `ErrSubscriptionExists` | 409 | 已有有效订阅 |
| 40002 | `ErrPaymentFailed` | 402 | 支付失败 |
| 50001 | `ErrUploadFailed` | 500 | 上传失败 |
| 50002 | `ErrTranscodeFailed` | 500 | 转码失败 |

```go
// pkg/errors/errors.go
type AppError struct {
    Code    int    `json:"code"`
    Message string `json:"message"`
}

func (e *AppError) Error() string // 实现 error 接口
func (e *AppError) WithMessage(msg string) *AppError // 覆写消息
```

### 2.7 auth — JWT 认证

**双令牌机制：**
- **Access Token**：15 分钟有效期，存 JWT claims（user_id, role, 标准注册声明）
- **Refresh Token**：30 天有效期，存 Redis（`refresh:{user_id}`），UUID 作为 token 值

**核心接口：**
```go
// pkg/auth/auth.go
func NewJWTAuth(cfg JWTConfig) *JWTAuth

func (a *JWTAuth) GenerateAccessToken(userID int64, role string) (string, int64, error)
    // 返回 token, expires_in(秒), error

func (a *JWTAuth) GenerateRefreshToken(ctx context.Context, rdb *redis.Client, userID int64) (string, error)
    // 生成 UUID token，存入 Redis（TTL=30天）

func (a *JWTAuth) ValidateAccessToken(tokenString string) (*AccessClaims, error)
    // 验证并解析 claims

func (a *JWTAuth) ValidateRefreshToken(ctx context.Context, rdb *redis.Client, userID int64, token string) (bool, error)
    // 对比 Redis 中的 refresh token

func (a *JWTAuth) BlacklistAccessToken(ctx context.Context, rdb *redis.Client, tokenString string, ttl time.Duration) error
    // 登出时将 Access Token 加入黑名单（Redis，TTL=token剩余有效期）

func (a *JWTAuth) RevokeRefreshToken(ctx context.Context, rdb *redis.Client, userID int64) error
    // 删除 Redis 中的 refresh token（登出时调用）
```

---

## 3. API 网关 — Gateway

### 3.1 代码结构

```
cmd/gateway/
├── main.go                  # 启动 HTTP server
├── config.go                # Gateway 自身配置
├── middleware/
│   ├── cors.go              # CORS 中间件
│   ├── logger.go            # 请求日志
│   ├── ratelimit.go         # 限流（漏桶 + Redis）
│   └── auth.go              # JWT 认证
└── router.go                # Gin 路由定义 + 反向代理
```

### 3.2 中间件链

请求经过的中间件顺序：
```
CORS → Request Logger → Rate Limiter → JWT Auth → Route Proxy
```

- **JWT Auth**：验证 Access Token 后，将 user_id 和 role 以 Header 形式传递给下游服务：`X-User-ID`、`X-User-Role`。不需要认证的路径（如 `/auth/login`）跳过。
- **Rate Limiter**：基于 IP 的限流（60 req/min/public API），登录接口额外降低至 10 req/min。
- **Route Proxy**：使用 `httputil.ReverseProxy` 将请求转发到对应服务端口。

### 3.3 路由表

| 路径前缀 | 目标服务 | 端口 |
|---------|---------|------|
| `/api/v1/auth/*` | 网关自身处理 | — |
| `/api/v1/users/*` | user-service | 8081 |
| `/api/v1/favorites/*` | user-service | 8081 |
| `/api/v1/comments/*` | user-service | 8081 |
| `/api/v1/dramas/*` | content-service | 8082 |
| `/api/v1/episodes/*` | content-service | 8082 |
| `/api/v1/categories/*` | content-service | 8082 |
| `/api/v1/videos/*` | video-service | 8083 |
| `/api/v1/subscriptions/*` | payment-service | 8084 |
| `/api/v1/payments/*` | payment-service | 8084 |
| `/api/v1/admin/*` | 对应的 admin handler | — |

---

## 4. 用户认证服务 — User Service

### 4.1 代码结构

```
services/user/
├── cmd/server/main.go
├── internal/
│   ├── config/config.go
│   ├── handler/
│   │   ├── auth.go           # 注册、登录、刷新、登出、OAuth
│   │   ├── profile.go        # 用户资料 GET/PUT
│   │   ├── favorite.go       # 收藏 CRUD
│   │   └── comment.go        # 评论 CRUD + 点赞
│   ├── service/
│   │   ├── auth.go
│   │   ├── user.go
│   │   ├── favorite.go
│   │   └── comment.go
│   ├── repository/
│   │   ├── user_repo.go
│   │   ├── favorite_repo.go
│   │   └── comment_repo.go
│   ├── model/
│   │   ├── user.go
│   │   ├── favorite.go
│   │   └── comment.go
│   └── router.go
└── go.mod
```

### 4.2 三层架构

```
Handler (HTTP) → Service (业务) → Repository (DB)
                    ↑
              pkg/auth (JWT)
```

- **Handler**: 解析 Gin Context → 参数校验 → 调用 Service → 通过 `pkg/response` 返回 JSON
- **Service**: 业务编排、事务管理、调用 Repository + Auth
- **Repository**: 基于 `pgx/v5` 的纯 SQL 查询，返回 Model

### 4.3 核心逻辑

**注册流程：**
```
POST /auth/register
1. 参数校验（邮箱格式、密码长度≥8、昵称非空）
2. 检查邮箱是否已存在 → 存在返回 ErrEmailExists
3. BCrypt 哈希密码（cost=12）
4. INSERT users 表
5. 生成 Access Token + Refresh Token
6. 返回 AuthTokens
```

**登录流程：**
```
POST /auth/login
1. 参数校验
2. 查询用户（email）→ 不存在返回 ErrInvalidCredentials
3. BCrypt 对比密码 → 不匹配返回 ErrInvalidCredentials
4. 检查用户状态 → banned 返回 ErrForbidden
5. 生成 Access Token + Refresh Token（存储到 Redis）
6. 返回 AuthTokens
```

**OAuth 流程：**
```
POST /auth/oauth/{provider}
1. 接收授权码 code
2. 调用第三方 API 交换 token 并获取用户信息（email, name, avatar）
3. 查询 oauth_provider + oauth_id → 存在则登录，不存在则创建用户
4. 生成双 Token
5. 返回 AuthTokens
```

**登出流程：**
```
POST /auth/logout
1. 获取当前 Access Token
2. 加入 Redis 黑名单（TTL = 剩余有效期）
3. 删除 Redis 中的 Refresh Token
```

---

## 5. 内容服务 — Content Service

```
services/content/
├── cmd/server/main.go
├── internal/
│   ├── config/
│   ├── handler/
│   │   ├── drama.go        # 短剧 CRUD
│   │   ├── episode.go      # 剧集列表 & 详情
│   │   ├── category.go     # 分类维护
│   │   └── play.go         # 播放鉴权 & 签名 URL
│   ├── service/
│   ├── repository/
│   ├── model/
│   └── router.go
└── go.mod
```

**API 清单：**

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/v1/dramas` | ❌ | 短剧列表（category_id, sort, keyword, tags, page, page_size） |
| GET | `/api/v1/dramas/{id}` | ❌ | 短剧详情（含播放量、收藏量、点赞量） |
| GET | `/api/v1/dramas/{id}/episodes` | ❌ | 剧集列表 |
| GET | `/api/v1/episodes/{id}` | ✅ | 剧集详情 + 本地化信息 |
| GET | `/api/v1/episodes/{id}/play` | ✅ | 签名的播放 URL（支持 quality, language 参数） |
| GET | `/api/v1/categories` | ❌ | 分类树/列表 |

**播放鉴权流程：**
```
GET /episodes/{id}/play
1. JWT 认证（确保是有效用户）
2. 检查用户是否有权限观看（免费剧集 vs 付费剧集 → 检查订阅）
3. 生成 CDN 签名 URL（有效期 1 小时）
4. 返回 EpisodePlayInfo（含多清晰度 URL）
```

---

## 6. 视频管理服务 — Video Service

```
services/video/
├── cmd/server/main.go
├── internal/
│   ├── config/
│   ├── handler/
│   │   ├── upload.go        # Presigned URL、分片上传
│   │   ├── transcode.go     # 转码任务编排
│   │   └── callback.go      # 上传完成回调
│   ├── service/
│   │   ├── upload.go
│   │   └── transcode.go
│   ├── repository/
│   ├── model/
│   └── router.go
└── go.mod
```

**API 清单：**

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/videos/upload-url` | 🔐 获取上传 Presigned URL（body: filename, file_size, content_type） |
| POST | `/api/v1/videos/multipart/init` | 🔐 分片上传初始化 |
| POST | `/api/v1/videos/multipart/complete` | 🔐 分片上传完成 |
| POST | `/api/v1/videos/callback` | 🔐 上传完成回调（需签名验证） |
| GET | `/api/v1/videos/{id}/tasks` | 🔐 查询转码任务状态 |

**上传流程：**
```
1. 客户端请求 Presigned URL（≤100MB）或 分片上传初始化（>100MB）
2. Video Service 根据文件大小返回上传地址
3. 客户端直接上传到 S3/MinIO
4. S3/MinIO → 回调通知 Video Service
5. 视频校验（格式、分辨率、时长）
6. 写入 video_assets 记录
7. 提交转码任务（MVP 阶段异步编排）
```

---

## 7. 支付订阅服务 — Payment Service

```
services/payment/
├── cmd/server/main.go
├── internal/
│   ├── config/
│   ├── handler/
│   │   ├── plan.go          # 订阅计划列表
│   │   ├── subscription.go  # 创建/取消/查询订阅
│   │   └── webhook.go       # 外部支付回调
│   ├── service/
│   ├── repository/
│   ├── model/
│   └── router.go
└── go.mod
```

**API 清单：**

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/v1/subscriptions/plans` | ❌ | 订阅计划列表（月/季/年） |
| POST | `/api/v1/subscriptions/create` | ✅ | 创建订阅 → 返回支付链接 |
| POST | `/api/v1/subscriptions/cancel` | ✅ | 取消自动续费 |
| GET | `/api/v1/subscriptions/status` | ✅ | 当前订阅状态 |
| POST | `/api/v1/payments/webhook/{channel}` | ❌ | PayPal/Stripe 回调（需签名验证） |

**Webhook 处理（幂等性保障）：**
```
POST /payments/webhook/{channel}
1. 验证回调签名（验证来自支付提供商）
2. 检查 channel_txn_id 是否已处理（唯一约束幂等）
3. 更新 payment 状态
4. 更新 subscription 状态（激活/过期）
5. 返回 200
```

---

## 8. 数据库 Migration

使用 `golang-migrate/migrate` 管理，SQL 文件按序号命名。

### 执行顺序

| 序号 | 文件名 | 涉及表 |
|------|--------|--------|
| 000001 | `create_users_table` | users |
| 000002 | `create_categories_table` | categories |
| 000003 | `create_dramas_table` | dramas |
| 000004 | `create_episodes_table` | episodes |
| 000005 | `create_video_assets_table` | video_assets |
| 000006 | `create_localizations_table` | localizations |
| 000007 | `create_favorites_table` | favorites |
| 000008 | `create_comments_table` | comments |
| 000009 | `create_subscriptions_table` | subscriptions |
| 000010 | `create_payments_table` | payments |
| 000011 | `create_ai_jobs_table` | ai_jobs |

每个表的设计严格遵循 `project/docs/database.md` 的定义（字段、类型、约束、索引）。

---

## 9. 实施顺序

### 第 1-2 周

| 步骤 | 内容 | 预估 |
|------|------|------|
| S1 | 初始化 Go Workspace + `pkg/` 全部子模块（config, logger, database, redis, response, errors, auth） | 2日 |
| S2 | 编写 Migration SQL 文件（11张表） | 1日 |
| S3 | User Service — auth（注册、登录、OAuth 骨架 + Token 管理） | 2日 |
| S4 | Gateway — 中间件链（CORS, Logger, RateLimit, JWT Auth）+ 路由转发 | 1日 |
| S5 | User Service — 收藏 + 评论模块 | 1日 |
| S6 | Content Service — 短剧 CRUD + 剧集 + 分类 | 2日 |
| S7 | Video Service — 上传 Presigned URL + 分片上传 | 2日 |
| S8 | 集成测试 + Docker Compose 联调 | 1日 |

### 第 3-4 周

| 步骤 | 内容 |
|------|------|
| S9 | Content — 播放鉴权 + 签名 CDN URL |
| S10 | Payment Service — 订阅 + Webhook |
| S11 | Video — 转码任务编排 |
| S12 | 全文搜索集成（Elasticsearch） |

---

## 10. 技术依赖

| Go 依赖 | 用途 |
|---------|------|
| `github.com/gin-gonic/gin` | HTTP 框架（Gateway + 各服务 handler） |
| `github.com/jackc/pgx/v5` | PostgreSQL 驱动 |
| `github.com/redis/go-redis/v9` | Redis 客户端 |
| `github.com/rs/zerolog` | 结构化日志 |
| `github.com/golang-jwt/jwt/v5` | JWT 签名和验证 |
| `golang.org/x/crypto` | BCrypt 密码哈希 |
| `github.com/golang-migrate/migrate/v4` | 数据库迁移 |
| `github.com/google/uuid` | UUID 生成 |
| `github.com/aws/aws-sdk-go-v2/service/s3` | S3/MinIO 集成（Video Service） |
