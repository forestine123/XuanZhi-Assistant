# 玄知助手 MVP

玄知助手是一个支持多用户数据隔离的可视化 Agent 工作台。当前 MVP 聚焦验证一个最小闭环：

```text
用户登录
  -> 输入任务
  -> 创建当前用户的 task
  -> 后端保存 task/message
  -> Mock Agent 执行
  -> event/artifact/approval 上报
  -> SSE 实时推送给任务所属用户
  -> 用户确认或拒绝
  -> 任务完成
```

第一阶段优先跑通前端、后端、SSE、中间产物、审批和多用户隔离。OpenClaw 接入通过插件目录预留，当前演示仍使用 Mock Agent，不依赖真实 Agent Runtime。

## 技术栈

- 包管理器：pnpm
- 前端：React + Vite + TypeScript + Ant Design
- 后端：Node.js + Fastify + TypeScript
- 测试：Vitest
- 共享协议：`packages/shared`
- Agent 上报插件：`plugins/xuanzhi-artifacts`

## 目录结构

```text
.
|-- apps/
|   |-- api/                 # Fastify 后端 API
|   `-- web/                 # React + Vite 前端工作台
|-- packages/
|   `-- shared/              # 前后端共享协议类型
|-- plugins/
|   `-- xuanzhi-artifacts/   # OpenClaw 上报插件
|-- openclaw/                # OpenClaw 源码目录
|-- package.json
`-- pnpm-workspace.yaml
```

共享协议类型统一维护在：

```text
packages/shared/src/protocol.ts
```

业务对象包含 `User`、`AuthSession`、`Task`、`Message`、`AgentEvent`、`Artifact`、`Approval`。其中 `Task` 必须绑定 `userId`，消息、事件、产物和审批也冗余保存 `userId`，用于查询和权限判断。

## 后端架构

后端已拆分为分层目录，`apps/api/src/app.ts` 只负责创建 Fastify 实例、装配依赖、注册 CORS 和路由。

```text
apps/api/src/
|-- app/
|   |-- dependencies.ts      # 组装 config、store、stream 和 services
|   `-- registerRoutes.ts    # 注册所有 HTTP 路由模块
|-- agents/
|   `-- mockAgent.ts         # MVP 阶段的 Mock Agent 执行器
|-- config/
|   `-- env.ts               # 环境变量配置
|-- http/
|   |-- auth.ts              # 用户 token / 服务 token 解析
|   |-- cors.ts              # CORS 和 OPTIONS 处理
|   `-- taskGuards.ts        # 登录态、任务归属、写入权限校验
|-- realtime/
|   `-- streamHub.ts         # 按 taskId 分发 SSE 事件
|-- repositories/
|   `-- memoryStore.ts       # MVP 内存仓储
|-- routes/
|   |-- authRoutes.ts
|   |-- taskRoutes.ts
|   |-- messageRoutes.ts
|   |-- eventRoutes.ts
|   |-- artifactRoutes.ts
|   |-- approvalRoutes.ts
|   `-- streamRoutes.ts
|-- schemas/
|   `-- protocolValidators.ts # 协议枚举和请求值校验
|-- services/
|   |-- authService.ts
|   |-- taskService.ts
|   |-- messageService.ts
|   |-- eventService.ts
|   |-- artifactService.ts
|   `-- approvalService.ts
|-- app.ts
`-- main.ts
```

分层约定：

- `routes` 只处理 HTTP 入参、状态码和响应。
- `services` 承载业务流程、状态流转、事件写入和 SSE 广播。
- `repositories` 封装数据存储；当前是内存实现，后续可替换为数据库实现。
- `http` 放认证、权限守卫和 CORS 等横切逻辑。
- `schemas` 放请求值和协议枚举校验。
- `agents` 放 Agent 执行器；当前只有 Mock Agent。

## 本地开发

### 环境要求

- Node.js 22.x 推荐
- pnpm 11.x

安装依赖：

```bash
pnpm install
```

### 启动后端

```bash
pnpm dev:api
```

默认监听：

```text
http://127.0.0.1:3000
```

可选环境变量：

```bash
PORT=3000
HOST=127.0.0.1
XUANZHI_API_TOKEN=dev-token
```

`XUANZHI_API_TOKEN` 是 OpenClaw 插件到后端的服务级 token，不是用户登录 token。

### 启动前端

另开一个终端：

```bash
pnpm dev:web
```

Vite 会启动前端开发服务，并把 `/api` 代理到：

```text
http://127.0.0.1:3000
```

如需显式指定后端地址，可设置：

```bash
VITE_API_BASE_URL=http://127.0.0.1:3000
```

## 演示账号

后端 MVP 使用内存中的固定测试账号：

| 用户 | 邮箱 | 密码 |
|---|---|---|
| 用户 A | `user-a@example.com` | `dev-password` |
| 用户 B | `user-b@example.com` | `dev-password` |

内存存储会在后端进程重启后清空。

## 推荐演示流程

使用用户 A 登录后输入：

```text
下周三上午帮我预约张三开项目复盘会
```

预期可以看到：

```text
已创建任务
已收到用户输入
正在分析任务
已生成执行计划
已生成会议草稿
等待用户确认是否创建会议
```

点击确认后：

```text
用户已确认
任务已完成
```

再使用用户 B 登录时，不应看到用户 A 的任务、消息、事件、产物或审批。

## 核心安全规则

多用户隔离是当前 MVP 的最高优先级：

- 前端不向业务接口传 `userId`
- 后端只信任认证层解析出的当前用户
- 创建 task 时，后端使用当前用户 ID 写入 `task.userId`
- 查询 task 时，只返回当前用户自己的任务
- 发送 message 前，必须校验 task 属于当前用户
- 查询 event、artifact、approval 前，必须校验 task 属于当前用户
- approve/reject 前，必须校验 approval 属于当前用户
- 建立 SSE 前，必须校验 task 属于当前用户
- 插件上报只信任服务级 token，不信任请求体中的 `userId`
- 插件上报 event、artifact、approval 时，后端必须根据 `taskId` 反查 `task.userId`

禁止通过前端参数、插件参数或 Agent 输出决定数据归属。

## API 概览

用户态接口需要携带：

```http
Authorization: Bearer <token>
```

认证接口：

```http
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

任务、消息、事件、产物和审批接口：

```http
POST  /api/tasks
GET   /api/tasks
GET   /api/tasks/:taskId
PATCH /api/tasks/:taskId/status

POST /api/tasks/:taskId/messages
GET  /api/tasks/:taskId/messages

POST /api/tasks/:taskId/events
GET  /api/tasks/:taskId/events

POST /api/tasks/:taskId/artifacts
GET  /api/tasks/:taskId/artifacts

POST /api/tasks/:taskId/approvals
GET  /api/tasks/:taskId/approvals

POST /api/approvals/:approvalId/approve
POST /api/approvals/:approvalId/reject
```

SSE：

```http
GET /api/tasks/:taskId/stream
```

原生 `EventSource` 不能直接设置 `Authorization` header，当前开发阶段使用短期 token 查询参数连接 SSE。后端仍会在订阅前校验登录态和 task 归属。

## OpenClaw 插件

插件目录：

```text
plugins/xuanzhi-artifacts
```

插件提供以下工具：

- `xuanzhi_emit_event`
- `xuanzhi_create_artifact`
- `xuanzhi_request_approval`
- `xuanzhi_update_task_status`

插件读取：

```bash
XUANZHI_API_BASE_URL=http://127.0.0.1:3000
XUANZHI_API_TOKEN=dev-token
```

插件工具参数不需要、也不应该包含 `userId`。后端根据 `taskId` 反查任务归属。

## 常用命令

```bash
pnpm install
pnpm dev:api
pnpm dev:web
pnpm test
pnpm --filter @xuanzhi/api test
pnpm --filter @xuanzhi/api build
```

Windows PowerShell 如果拦截 `pnpm.ps1`，可以改用 `pnpm.cmd`：

```powershell
pnpm.cmd --filter @xuanzhi/api test
pnpm.cmd --filter @xuanzhi/api build
```

当前阶段不要求 Docker 构建、部署或发布。除非明确需要，不要执行：

```bash
pnpm claw:build
```

## 当前 MVP 不做

- 生产部署发布
- Docker 镜像构建
- 复杂 RBAC、团队、组织、空间
- 任务共享和多人协同审批
- 管理后台
- 真实会议创建、真实邮件发送、真实业务系统修改
- 多 Agent 调度
- 任务回放和审计
- OpenClaw core 深度改造

## 关键入口

- 后端装配：`apps/api/src/app.ts`
- 后端依赖组装：`apps/api/src/app/dependencies.ts`
- 后端路由注册：`apps/api/src/app/registerRoutes.ts`
- 后端分层测试：`apps/api/test/layers.test.ts`
- 后端 API 回归测试：`apps/api/test/app.test.ts`
- 前端入口：`apps/web/src/main.tsx`
- 前端应用：`apps/web/src/App.tsx`
- 共享协议：`packages/shared/src/protocol.ts`
- OpenClaw 插件入口：`plugins/xuanzhi-artifacts/src/index.ts`
