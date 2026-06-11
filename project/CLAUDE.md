# AI shot — 海外 AI 短剧平台

## 项目概述

AI shot（Venaitry）是一个面向海外市场的 AI 短剧平台，核心能力是通过 AI 本地化管线（翻译、配音、字幕、口型同步）将中文短剧快速本地化为多语言版本，分发至全球用户。

## 技术栈

| 层级 | 技术 | 用途 |
|------|------|------|
| 后端核心 | Go 1.22+ | API 服务、业务逻辑、视频处理 |
| AI 管线 | Python 3.12+ | 翻译、配音、字幕、口型同步 |
| BFF 层 | Node.js (Next.js 14+) | Web SSR、BFF 聚合 |
| Web 前端 | Next.js 14+ | 用户端 Web + 管理后台 |
| 移动端 | Flutter 3.22+ | iOS / Android App |
| API 网关 | Go (Kong/Custom) | 路由、限流、认证 |
| 主数据库 | PostgreSQL 16+ | 业务数据持久化 |
| 缓存 | Redis 7+ | 会话、缓存、队列 |
| 对象存储 | Cloudflare R2 / S3 | 视频、图片、字幕文件 |
| 搜索 | Elasticsearch 8+ | 短剧搜索、全文检索 |
| 消息队列 | RabbitMQ / Kafka | 异步任务、AI 管线编排 |
| CDN | Cloudflare Stream | 视频分发加速 |
| 容器编排 | Docker + Kubernetes | 部署、编排、扩缩容 |
| 监控 | Prometheus + Grafana + Sentry | 指标、日志、告警 |

## 项目状态

MVP / Demo 阶段 — 详见 [docs/tasks.md](docs/tasks.md)

## 目录结构

```
project/
├── CLAUDE.md              # 本文件 — 项目全局指引
├── docker-compose.yml     # 本地开发 Docker Compose
├── docs/
│   ├── architecture.md    # 架构设计文档
│   ├── database.md        # 数据模型与表设计
│   ├── openapi.yaml       # OpenAPI 3.0 规范
│   └── tasks.md           # MVP 开发任务与排期
```

## 开发原则

- **模块化**: 按业务领域拆分，每个模块独立开发、测试、部署
- **渐进演进**: MVP 阶段模块化单体，后期平滑演进为微服务
- **AI 优先**: AI 本地化管线作为独立服务，不耦合业务逻辑
- **云原生**: 容器化部署，水平扩展，弹性伸缩
- **性能保障**: Go 处理高并发链路，Python 专注 AI 计算密集型任务

## 语言职责边界

| 语言 | 负责范围 |
|------|----------|
| Go | API Gateway、用户服务、内容服务、视频管理、支付服务、管理后台 API |
| Python | AI 翻译管线、AI 配音管线、AI 字幕生成、AI 口型同步、推荐引擎 |
| TypeScript | Next.js BFF 层、Web 前端 SSR、管理后台前端 |
| Dart | iOS / Android 移动端 UI 与播放器集成 |

## 快速开始

```bash
# 启动本地开发环境
docker compose -f project/docker-compose.yml up -d

# 查看服务状态
docker compose -f project/docker-compose.yml ps
```

## 架构演进路线

| 阶段 | 架构形态 | 说明 |
|------|----------|------|
| MVP (4-6周) | 模块化单体 (Docker Compose) | 模块按包/目录分离，同一进程部署 |
| 增长期 (3-6月) | 微服务拆分 (K8s) | 根据流量瓶颈逐一拆分 |
| 成熟期 (6月+) | 全微服务 + Service Mesh | Istio 服务治理，全面可观测性 |
