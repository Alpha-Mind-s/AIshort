# AI shot — 海外 AI 短剧平台

> **欢迎！** 根据你的角色，请阅读对应的说明。本项目有 3 个 Agent 在各自设备上通过 GitHub 协作。

## 🆔 身份确认

请确认你的职责范围：
- **Agent 1 — 后端 (Go)**: 工作目录 `backend/`
- **Agent 2 — 前端 (Next.js + Flutter)**: 工作目录 `frontend/`
- **Agent 3 — AI (Python)**: 工作目录 `ai/`

## 📋 必读文档（所有 Agent）

1. [项目全局指引](project/CLAUDE.md) — 技术栈、架构原则
2. [架构设计文档](project/docs/architecture.md) — 系统架构、模块设计
3. [数据模型设计](project/docs/database.md) — 数据库表设计、Redis 缓存
4. [API 接口规范](project/docs/openapi.yaml) — 所有 API 端点定义
5. [MVP 任务排期](project/docs/tasks.md) — 开发计划与交付物
6. [Agent 协作指南](.claude/AGENTS.md) — 多 Agent Git 协作流程

## 🔗 快速链接

| 资源 | 路径 | 说明 |
|------|------|------|
| 共享文档 | `project/` | 所有 Agent 共享的知识库 |
| 后端代码 | `backend/` | Go 服务（API、用户、内容、视频、支付） |
| 前端代码 | `frontend/web/`, `frontend/mobile/` | Next.js + Flutter |
| AI 管线 | `ai/` | Python AI 服务 |
| 协作指南 | `.claude/AGENTS.md` | Git 工作流、PR 流程 |
| 开发环境 | `project/docker-compose.yml` | 11 个服务的本地编排 |

## 🚀 开发须知

- **只修改自己负责的目录**，不要跨域修改
- 接口变更必须同步更新 `project/docs/openapi.yaml`
- 数据库 Migration 由后端 Agent 统一管理
- 完整项目结构见 `README.md`
