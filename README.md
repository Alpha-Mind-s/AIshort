# AI shot — 海外 AI 短剧平台

> **AI 驱动**的全球化短剧本地化与分发平台，支持多语言翻译、配音、字幕、口型同步。

## 📁 项目结构

```
AIshort/
├── project/                  # 📋 项目文档（所有Agent共享知识库）
│   ├── CLAUDE.md             # 项目全局指引
│   ├── docker-compose.yml    # 本地开发环境编排
│   └── docs/
│       ├── architecture.md   # 架构设计文档
│       ├── database.md       # 数据模型与表设计
│       ├── openapi.yaml      # OpenAPI 3.0 接口规范
│       └── tasks.md          # MVP 开发任务与排期
│
├── backend/                  # 🦫 Go 后端服务（Agent 1）
│   ├── cmd/gateway/          # API 网关入口
│   ├── services/
│   │   ├── user/             # 用户与认证服务
│   │   ├── content/          # 内容服务
│   │   ├── video/            # 视频管理服务
│   │   └── payment/          # 支付订阅服务
│   ├── internal/             # 共享内部包
│   ├── pkg/                  # 可导出公共库
│   └── migrations/           # 数据库迁移脚本
│
├── frontend/                 # 🎨 前端（Agent 2）
│   ├── web/                  # Next.js Web + 管理后台
│   └── mobile/               # Flutter 移动端
│
├── ai/                       # 🤖 AI 管线（Agent 3）
│   ├── asr/                  # 语音识别 (Whisper)
│   ├── translate/            # 文本翻译 (DeepL/LLM)
│   ├── dubbing/              # AI 配音 (ElevenLabs)
│   ├── lipsync/              # 口型同步 (Wav2Lip)
│   ├── recommend/            # 推荐引擎
│   └── worker/               # 任务队列消费者
│
├── .claude/                  # ⚙️ Claude 项目配置
├── project/                  # 📋 共享知识库
└── README.md                 # 本文件
```

## 🤖 三端 Agent 协作架构

| Agent | 负责范围 | 技术栈 |
|-------|----------|--------|
| Agent 1 — 后端 | API Gateway、用户/内容/视频/支付服务、数据库 | Go + PostgreSQL + Redis |
| Agent 2 — 前端 | Web (Next.js) + 移动端 (Flutter) | TypeScript + Dart |
| Agent 3 — AI | 翻译、配音、字幕、口型同步、推荐引擎 | Python + AI/ML |

## 🔄 协作流程

1. **共享知识库**: `project/docs/` 是所有 Agent 的共同上下文
2. **独立职责**: 每个 Agent 在各自目录内独立开发
3. **GitHub 协作**: 通过 Pull Request + Code Review 集成
4. **文档驱动**: 先读 `project/CLAUDE.md` 和对应文档再开始开发

## 🚀 快速开始

```bash
# 后端
cd backend && go mod init github.com/Alpha-Mind-s/AIshort/backend

# Web 前端
cd frontend/web && npx create-next-app@latest .

# Flutter 移动端
cd frontend/mobile && flutter create .

# AI 管线
cd ai && python -m venv venv
```

## 🔗 相关资源

- [架构设计文档](project/docs/architecture.md)
- [数据模型设计](project/docs/database.md)
- [API 接口规范](project/docs/openapi.yaml)
- [MVP 任务排期](project/docs/tasks.md)
- [本地开发环境](project/docker-compose.yml)
