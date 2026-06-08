# OpenClaw 工具调用与会话消息修复交接文档

## 目标

把 OpenClaw 的工具调用、工具结果、会话历史和实时回复统一成稳定的 WebUI 展示，不再出现以下问题：

- 重启或重新打开 session 后，工具调用模块样式消失。
- raw tool call、tool result、上下文编译内容暴露到正文。
- 同一轮回复出现两份：一份实时成功版，一份刷新后失败版。
- 工具调用失败时，需要刷新页面才从“全部完成”变成“执行失败”。
- 展开工具调用详情时页面跳到最底部。
- 侧边栏收起后出现两套“新对话”入口。

## 当前已完成的修复

### 1. 工具调用结构化协议

新增共享协议字段：

- `Message.toolCalls?: MessageToolCall[]`
- `SessionMessage.toolCalls?: MessageToolCall[]`
- `Message.parentMessageId?: string`
- `SessionMessage.parentMessageId?: string`

`MessageToolCall` 保存：

- `id`
- `name`
- `arguments`
- `result`
- `isError`
- `status: running | done | error`

作用：

- 前端不再从 assistant 正文里解析工具调用。
- 后端把 OpenClaw JSONL 中的 `toolCall` / `toolResult` 转成结构化数据。
- `parentMessageId` 用于把同一条用户消息之后的实时 assistant 和落盘 assistant 合并。

涉及文件：

- `packages/shared/src/protocol.ts`
- `apps/web/src/types/protocol.ts`

### 2. OpenClaw JSONL 历史恢复

`sessionService` 现在负责从 OpenClaw session 文件中恢复消息：

- 读取 `sessions.json`，通过 `sessionKey` 找到 `sessionId`。
- 读取 `${sessionId}.jsonl`。
- 只保留用户可见正文。
- 过滤 `thinking`、raw tool payload、context/trace 类内容。
- 把同一轮 assistant 的多段文本、工具调用和工具结果合并为一条 assistant message。
- 读取 `${sessionId}.trajectory.jsonl` 作为没有结构化 `toolCalls` 时的降级来源。

实现要点：

- 遇到 `user` 时 flush 上一轮 assistant。
- 遇到 `assistant` 时收集 text 和 toolCall。
- 遇到 `toolResult` 时按 `toolCallId` 回填 result/status。
- `isError: true` 映射为 `status: error`。
- 未收到 result 的 running tool 在 flush 时才降级为 done。

涉及文件：

- `apps/api/src/services/sessionService.ts`

### 3. 实时消息与落盘消息合并

之前重复回复的根因是：

- WebUI 实时创建一条 streaming assistant。
- OpenClaw 落盘后，后端又读出一条真实 assistant。
- 两条消息的 id、时间戳、内容、工具状态可能不同。
- 旧合并逻辑主要靠 `role + content + 30s 时间窗口`，失败时容易匹配不上。

现在的合并策略：

- 仍保留 id 去重和内容镜像去重。
- 新增 id alias，把落盘 user 和本地 user 通过内容/时间映射。
- assistant 优先按 `parentMessageId` 合并。
- 如果落盘消息有更完整的 `toolCalls` / `planSteps`，用落盘版替换实时版，但保留原本的消息 id 和 createdAt，避免前端闪烁。

涉及文件：

- `apps/api/src/services/messageService.ts`
- `apps/api/src/repositories/memoryStore.ts`

### 4. 实时失败状态无需刷新

仅靠实时 `tool_result` 事件不可靠，因为 OpenClaw 可能：

- final 文本先到，工具 result 后到。
- 工具失败结果没有完整走实时 agent stream。
- 失败信息藏在 `result` / `content` / `output` JSON 字符串里。

已做两层修复：

1. 实时事件增强错误识别：
   - 顶层 `isError`
   - 顶层 `status: "error"` / `state: "error"`
   - 顶层 `error` / `errorMessage`
   - 嵌套或字符串中的 `{"status":"error"}` / `{"error":"..."}`

2. 运行结束后做一次落盘回填：
   - `runOpenClawSession()` 收到 final 后，会通过 `SessionService` 读取当前 session JSONL。
   - 找到本轮 user 后面的 assistant。
   - 如果落盘 assistant 有 `toolCalls`，立刻更新当前 streaming message。
   - 广播 `message.updated`，前端无需刷新即可看到失败状态。

涉及文件：

- `apps/api/src/agents/agentRunner.ts`
- `apps/api/src/services/messageService.ts`

### 5. 前端工具调用显示

前端现在通过 `normalizeAgentMessage()` 消费结构化工具数据：

- 优先使用 `rawMessage.toolCalls`。
- 没有 `toolCalls` 时再使用 `planSteps`。
- 过滤 raw payload。
- 工具结果显示在执行详情中，而不是直接暴露在正文。

`AgentExecutionSummary` 负责折叠展示：

- 总状态：执行中、完成、失败。
- 步骤列表。
- 展开时显示工具结果预览。

涉及文件：

- `apps/web/src/utils/agentMessage.ts`
- `apps/web/src/components/chat/AgentExecutionSummary.tsx`
- `apps/web/src/components/chat/AssistantMessageContent.tsx`
- `apps/web/src/styles/chat.css`

### 6. 滚动体验

问题：

- 展开工具调用详情会触发内容高度变化。
- 旧逻辑/组件 autoScroll 会把页面拉到底部。

修复：

- `ChatCanvas` 增加 `isPinnedToBottomRef`。
- 监听滚动父容器，只有用户本来在底部附近时才跟随到底。
- 展开历史工具详情时，如果用户不在底部，不强制滚动。
- message key 中加入 `toolCalls` 状态和 result 长度，确保工具结果更新时能渲染。

涉及文件：

- `apps/web/src/components/chat/ChatCanvas.tsx`

### 7. 对话框快捷入口

输入框快捷入口已经改成简洁图标：

- 压缩上下文
- 重置会话
- 指令帮助

要点：

- 不使用花哨彩色胶囊。
- 用图标表达操作。
- 文字只放在 tooltip / aria-label 中。

涉及文件：

- `apps/web/src/components/chat/ChatComposer.tsx`
- `apps/web/src/styles/chat.css`

### 8. 侧边栏收起态重复新对话按钮

问题：

- `Sidebar` 收起态已有 rail 工具按钮组，其中包含“开启新对话”。
- `WorkspaceHeader` 又额外渲染了一个 `collapsed-new-chat-trigger`。
- 收起侧边栏后出现两套新对话入口。

修复：

- 删除 `WorkspaceHeader` 中的收起态新对话按钮。
- 删除 `collapsed-new-chat-wrap` / `collapsed-new-chat-trigger` 样式。
- 保留 `Sidebar` 中的 rail 按钮组作为唯一入口。
- 更新 UI contract，明确 header 不再渲染重复按钮。

涉及文件：

- `apps/web/src/components/assistant/WorkspaceHeader.tsx`
- `apps/web/src/components/assistant/AssistantShell.tsx`
- `apps/web/src/styles/assistant/sidebar.css`
- `apps/web/test/ui-style-contract.test.mjs`

## 从组织库新版本补这套能力的建议顺序

### Step 1：先补协议

先改 `packages/shared/src/protocol.ts`：

- 添加 `MessageToolCall`。
- 给 `Message` 和 `SessionMessage` 添加 `toolCalls`。
- 给 `Message` 和 `SessionMessage` 添加 `parentMessageId`。

同步确认 `apps/web/src/types/protocol.ts` 是否已经 re-export `MessageToolCall`。

验证：

```bash
corepack pnpm --filter @xuanzhi/shared build
```

### Step 2：补 JSONL parser

修改 `apps/api/src/services/sessionService.ts`：

- 增加 content block 读取。
- 增加 `toolCall` 提取。
- 增加 `toolResult` 回填。
- 增加 trajectory fallback。
- 保留 `parentId` 为 `parentMessageId`。

验证重点：

- 普通历史消息能恢复。
- `thinking` 不显示。
- raw tool payload 不显示。
- toolCall/toolResult 会变成 `toolCalls`。
- error result 会变成 `status: error`。

### Step 3：补消息合并

修改 `apps/api/src/services/messageService.ts`：

- `listMessages()` 同时读取 MemoryStore 和 OpenClaw disk。
- 通过 `parentMessageId` 合并同一轮 assistant。
- 落盘消息更完整时替换实时消息内容和工具状态。
- 保留实时消息 id/createdAt，避免前端闪烁。

修改 `apps/api/src/repositories/memoryStore.ts`：

- `addMessage()` 支持 `parentMessageId` 和 `toolCalls`。
- `updateMessage()` 支持 `toolCalls`。

### Step 4：补实时回填

修改 `apps/api/src/agents/agentRunner.ts`：

- `createStreamingMessage(parentMessageId)`。
- `runOpenClawSession(..., parentMessageId, sessionService)`。
- tool result 错误识别支持嵌套 JSON。
- final 后短暂等待工具事件收尾。
- final 后读取当前 OpenClaw session JSONL 回填当前消息。

这是解决“刷新后才显示错误”的关键步骤。

### Step 5：补前端展示

修改：

- `apps/web/src/utils/agentMessage.ts`
- `apps/web/src/components/chat/AgentExecutionSummary.tsx`
- `apps/web/src/components/chat/ChatCanvas.tsx`
- `apps/web/src/styles/chat.css`

验证：

- 工具调用折叠展示。
- 失败状态不用刷新。
- 展开工具详情不跳底。
- raw payload 不出现在正文。

### Step 6：补输入框和侧栏 UI

修改：

- `ChatComposer.tsx`：图标式快捷入口。
- `sidebar.css`：去掉 header 里的重复收起态新对话按钮样式。
- `WorkspaceHeader.tsx`：不再渲染 `collapsed-new-chat-trigger`。

验证：

- 收起侧边栏只显示 rail 工具按钮组。
- 输入框快捷入口简洁，不显示文字胶囊。

## 最新 upstream 冲突评估

已拉取最新组织库：

```bash
git fetch upstream
```

组织库从当前基线新增 3 个提交：

- `9b1fc89 feat: integrate file asset workspace`
- `91ebb5e chore: normalize line endings`
- `b403225 Remove chat artifact panel and align composer`

用当前改动生成 patch 后，在临时 worktree 的 `upstream/main` 上做检查：

```bash
git apply --3way --check ../xuanzhi-current-local.patch
```

结果：

- 多数文件可三方自动合并。
- 需要人工处理冲突的文件：
  - `apps/api/src/repositories/memoryStore.ts`
  - `apps/api/src/services/messageService.ts`
  - `apps/web/src/components/assistant/Sidebar.tsx`
  - `apps/web/src/styles/chat.css`
  - `packages/shared/src/protocol.ts`

冲突原因：

- 新上游加入了 file asset workspace，改动了 shared protocol、MemoryStore、messageService。
- 新上游调整了 ChatPanel / composer / chat artifact panel，影响 `chat.css` 和部分前端结构。
- 上游新增 `.gitattributes` 并规范 line endings，patch 应尽量在最新分支上重新应用，避免整文件换行噪声。

建议处理方式：

1. 新建分支基于最新 `upstream/main`。
2. 先手工补 `packages/shared/src/protocol.ts` 中的 `MessageToolCall` / `parentMessageId`，注意保留上游新增的 file asset 类型。
3. 再补 API 层 `sessionService`、`messageService`、`agentRunner`。
4. 最后补 Web 展示和 UI contract。
5. 每一步都跑对应测试，不要一次性套完整 patch。

## 验收命令

当前本地已通过：

```bash
corepack pnpm --filter @xuanzhi/api test
corepack pnpm --filter @xuanzhi/web test:ui-contract
corepack pnpm -r --filter @xuanzhi/shared --filter @xuanzhi/api --filter @xuanzhi/web build
```

当前结果：

- API：32 个测试通过。
- Web UI contract：17 个测试通过。
- Shared/API/Web build：通过。
- Vite 仍有大 chunk 提醒，这是既有提醒，不是本次修复引入的失败。

## 人工验证清单

1. 打开已有 OpenClaw session。
2. 发送会触发工具调用的问题。
3. 工具调用区域应显示为折叠摘要。
4. 展开工具调用详情，页面不应跳到最底部。
5. 制造工具失败，例如缺 API key 或网络拦截。
6. 不刷新页面，执行详情应自动显示失败。
7. 刷新页面后，失败状态、工具名称、结果摘要应保持一致。
8. 侧边栏收起后，只保留 rail 中的一组按钮，不出现 header 里的第二个新对话按钮。

## 注意事项

- 不要把 OpenClaw 的本地绝对路径硬编码进代码。
- OpenClaw 根目录继续通过环境变量和 workspace helper 解析。
- 前端不直接读取 OpenClaw 文件。
- 后端可以临时读取 OpenClaw JSONL；如果后续 OpenClaw 提供 session detail RPC，应优先替换为 RPC。
- 不要依赖 assistant 正文解析工具调用，工具信息必须从结构化字段进入 UI。
- 不要只用 `role + content + createdAt` 合并消息，同一轮回复应优先使用父级 user 关系。
