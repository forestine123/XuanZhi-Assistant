import type { Message, Task } from '@xuanzhi/shared/protocol';

import { createMockAgentRuntime } from '../agents/mockRuntime.js';
import type { AgentRuntime } from '../agents/runtime.js';
import type { MemoryStore } from '../repositories/memoryStore.js';
import type { StreamHub } from '../realtime/streamHub.js';

export function createMessageService(
  store: MemoryStore,
  stream: StreamHub,
  agentRuntime: AgentRuntime = createMockAgentRuntime(store, stream),
) {
  const handleRuntimeFailure = (task: Task, error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    const assistantMessage = store.addMessage({
      userId: task.userId,
      taskId: task.id,
      role: 'assistant',
      content: 'Agent 运行失败，请稍后重试。',
    });
    stream.broadcast(task.id, { type: 'message.created', data: assistantMessage });

    const updated = store.updateTaskStatus(task.id, 'failed');
    if (updated) {
      stream.broadcast(task.id, { type: 'task.updated', data: updated });
    }

    const event = store.addEvent({
      userId: task.userId,
      taskId: task.id,
      type: 'agent.error',
      title: 'Agent 运行失败',
      message,
      status: 'error',
    });
    stream.broadcast(task.id, { type: 'agent.event.created', data: event });
  };

  const runAgent = (task: Task, handler: () => Promise<void> | void) => {
    void Promise.resolve(handler()).catch((error) => handleRuntimeFailure(task, error));
  };

  return {
    createMessage(task: Task, input: { role?: Message['role']; content: string }) {
      const message = store.addMessage({
        userId: task.userId,
        taskId: task.id,
        role: input.role === 'assistant' || input.role === 'system' ? input.role : 'user',
        content: input.content,
      });
      stream.broadcast(task.id, { type: 'message.created', data: message });

      if (message.role === 'user') {
        const hasAgentHandledTask = store
          .listEvents(task.id)
          .some((event) => event.type.startsWith('agent.') || event.type === 'approval.requested');

        if (!hasAgentHandledTask) {
          runAgent(task, () => agentRuntime.runTask(task));
        } else {
          runAgent(task, () => agentRuntime.runFollowup(task, message.content));
        }
      }

      return message;
    },

    listMessages(taskId: string) {
      return store.listMessages(taskId);
    },
  };
}

export type MessageService = ReturnType<typeof createMessageService>;
