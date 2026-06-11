# AI shot MVP 开发任务与排期

> 项目状态：MVP / Demo 阶段 | 团队规模：7人

## 1. MVP 团队构成

| 角色 | 人数 | 职责 |
|------|------|------|
| 后端 Go 工程师 | 2 | API 网关、用户/内容/视频/支付服务 |
| AI 工程师 | 1 | AI 本地化管线集成、推荐引擎 |
| 前端工程师 | 1 | Web 前端 (Next.js) |
| Flutter 工程师 | 1 | 移动端 App |
| DevOps 工程师 | 1 | CI/CD、K8s、监控、基础设施 |
| 产品/PM | 1 | 需求协调、进度管理 |

## 2. 分期开发计划

### 第 1-2 周：基础设施与核心模型

- [ ] 搭建 K8s / Docker Compose 开发环境
- [ ] PostgreSQL 表结构设计与迁移
- [ ] API Gateway 基础框架
- [ ] 用户认证服务（邮箱 + Google + Apple + Facebook）
- [ ] CI/CD 流水线搭建

**交付物：**
- Docker Compose 本地开发环境
- 数据库 Migration 脚本
- API Gateway 基础路由
- 用户注册/登录/OAuth 接口
- GitHub Actions CI 流水线

### 第 3-4 周：用户端核心功能

- [ ] 视频上传与转码服务
- [ ] 内容服务（短剧列表、分类）
- [ ] 首页推荐（基于热门 + 基础协同过滤）
- [ ] 视频播放功能（清晰度切换、字幕切换）
- [ ] 收藏 / 评论服务

**交付物：**
- 视频上传 API（分片上传、断点续传）
- 短剧 CRUD 接口
- 推荐列表接口
- 播放鉴权接口
- 收藏/评论接口

### 第 5-6 周：支付与管理后台

- [ ] 支付订阅服务（PayPal + 银行卡）
- [ ] Flutter 移动端核心功能对接
- [ ] 管理后台前端
- [ ] AI 本地化管线 MVP（中文→英语）
- [ ] 集成测试与性能测试

**交付物：**
- 订阅支付接口（含 Webhook）
- Flutter App 核心播放流程
- 管理后台（用户管理、内容审核、数据统计）
- AI 管线（翻译+配音+字幕+口型同步）

## 3. MVP 交付物清单

| 类别 | 交付物 | 说明 |
|------|--------|------|
| Web 前端 | Next.js 应用 | 登录、首页推荐、视频播放、收藏、评论、订阅 |
| 移动端 | Flutter App | 核心观看流程 |
| 后端 | Go API 服务 | 用户/内容/视频/支付/管理 API |
| AI 管线 | Python 服务 | 中文→英语 翻译+配音+字幕+口型同步 |
| 管理后台 | Next.js 后台 | 用户管理 + 内容审核 + 数据统计 |
| 基础设施 | CI/CD + 监控 | GitHub Actions + Grafana/Prometheus |

## 4. 详细任务拆分

### 4.1 后端 Go 服务

#### 用户与认证服务
- [ ] 数据库迁移：users 表
- [ ] 邮箱注册接口（密码 BCrypt 加密 cost=12）
- [ ] 邮箱密码登录接口（JWT 双 Token）
- [ ] Google OAuth 2.0 集成
- [ ] Apple Sign In 集成
- [ ] Facebook Login 集成
- [ ] Token 刷新接口
- [ ] 登出接口（Redis 黑名单）
- [ ] 用户资料管理接口

#### API 网关
- [ ] JWT 认证中间件
- [ ] Rate Limiter 中间件
- [ ] 请求日志中间件
- [ ] CORS 中间件
- [ ] 路由配置

#### 内容服务
- [ ] 数据库迁移：dramas, episodes, categories 表
- [ ] 短剧 CRUD 接口
- [ ] 分类管理接口
- [ ] 剧集列表接口
- [ ] 搜索接口（Elasticsearch 集成）

#### 视频管理服务
- [ ] 视频上传 Presigned URL 生成
- [ ] 分片上传接口
- [ ] 视频转码编排（FFmpeg）
- [ ] CDN 签名 URL 生成
- [ ] 播放鉴权

#### 收藏与评论服务
- [ ] 数据库迁移：favorites, comments 表
- [ ] 收藏 CRUD 接口
- [ ] 评论发布/列表/删除接口
- [ ] 评论点赞接口

#### 支付订阅服务
- [ ] 数据库迁移：subscriptions, payments 表
- [ ] PayPal 支付集成
- [ ] 订阅计划接口
- [ ] 创建/取消订阅接口
- [ ] 支付 Webhook 处理

### 4.2 AI 管线 (Python)

#### 语音识别 (ASR)
- [ ] Whisper API 集成
- [ ] 说话人分离（PyAnnote Audio）
- [ ] 时间戳对齐

#### 文本翻译
- [ ] DeepL API 集成
- [ ] 术语表管理
- [ ] 上下文感知分段翻译

#### AI 配音
- [ ] ElevenLabs API 集成
- [ ] 多音色支持
- [ ] 情感迁移

#### AI 口型同步
- [ ] Wav2Lip 改进版集成
- [ ] 人脸增强（GFPGAN）
- [ ] GPU 队列批处理

#### 任务调度
- [ ] 消息队列消费者（RabbitMQ）
- [ ] 任务状态管理
- [ ] 错误重试机制

### 4.3 Web 前端 (Next.js)

- [ ] 项目脚手架（Next.js 14+ App Router）
- [ ] 登录/注册页面
- [ ] OAuth 登录集成
- [ ] 首页推荐列表
- [ ] 短剧详情页
- [ ] 视频播放器（清晰度/字幕切换）
- [ ] 收藏功能 UI
- [ ] 评论组件
- [ ] 订阅购买页面
- [ ] 用户个人中心
- [ ] 国际化多语言
- [ ] 管理后台页面

### 4.4 Flutter 移动端

- [ ] 项目脚手架（Flutter 3.22+）
- [ ] 登录/注册页面
- [ ] 首页推荐流
- [ ] 视频播放器
- [ ] 收藏功能
- [ ] 评论功能
- [ ] 订阅购买
- [ ] 离线缓存

### 4.5 基础设施

- [ ] Docker Compose 配置
- [ ] Kubernetes 部署配置
- [ ] GitHub Actions CI/CD
- [ ] PostgreSQL 初始化脚本
- [ ] Redis 配置
- [ ] Prometheus + Grafana 监控
- [ ] Sentry 错误追踪
- [ ] ELK / Loki 日志收集

## 5. 技术债务 & 后期规划

| 项目 | 阶段 | 说明 |
|------|------|------|
| 微服务拆分 | 增长期 | 根据流量瓶颈逐一拆分 |
| 自建 LLM 翻译 | 增长期 | 替代 DeepL API，降低成本 |
| 自建 TTS | 增长期 | 替代 ElevenLabs API |
| 推荐引擎优化 | 增长期 | 深度学习推荐模型 |
| Service Mesh | 成熟期 | Istio 服务治理 |
| 多 AZ 部署 | 成熟期 | 跨区域灾备 |
| 内容版权保护 | 成熟期 | DRM、水印 |
