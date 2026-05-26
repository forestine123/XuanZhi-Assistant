import type { Message, Task } from '@xuanzhi/shared/protocol';

import { runMockAgent } from '../agents/mockAgent.js';
import type { MemoryStore } from '../repositories/memoryStore.js';
import type { StreamHub } from '../realtime/streamHub.js';

export function createMessageService(store: MemoryStore, stream: StreamHub) {
  return {
    createMessage(task: Task, input: { role?: Message['role']; content: string }) {
      const message = store.addMessage({
        userId: task.userId,
        taskId: task.id,
        role: input.role === 'assistant' || input.role === 'system' ? input.role : 'user',
        content: input.content,
      });
      stream.broadcast(task.id, { type: 'message.created', data: message });

      if (message.role === 'user' && store.listApprovals(task.id).length === 0) {
        runMockAgent(task, store, stream);
      }

      return message;
    },

    listMessages(taskId: string) {
      return store.listMessages(taskId);
    },
  };
}

export type MessageService = ReturnType<typeof createMessageService>;
