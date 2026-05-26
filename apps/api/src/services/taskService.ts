import type { TaskIntent, TaskStatus } from '@xuanzhi/shared/protocol';

import type { MemoryStore } from '../repositories/memoryStore.js';
import type { StreamHub } from '../realtime/streamHub.js';

function titleFromInput(userInput: string) {
  const title = userInput.trim().replace(/\s+/g, ' ').slice(0, 28);
  return title || '新任务';
}

export function createTaskService(store: MemoryStore, stream: StreamHub) {
  return {
    createTask(input: { userId: string; title?: string; userInput: string; intent: TaskIntent }) {
      const task = store.createTask({
        userId: input.userId,
        title: input.title?.trim() || titleFromInput(input.userInput),
        userInput: input.userInput,
        intent: input.intent,
      });
      const event = store.addEvent({
        userId: task.userId,
        taskId: task.id,
        type: 'task.created',
        title: '已创建任务',
        status: 'success',
      });
      stream.broadcast(task.id, { type: 'agent.event.created', data: event });
      return task;
    },

    listTasksForUser(userId: string) {
      return store.listTasksForUser(userId);
    },

    getOwnedTask(taskId: string, userId: string) {
      return store.getOwnedTask(taskId, userId);
    },

    getWritableTask(taskId: string, userId?: string) {
      const task = store.tasks.get(taskId);
      if (!task || (userId && task.userId !== userId)) {
        return undefined;
      }
      return task;
    },

    updateStatus(taskId: string, status: TaskStatus, userId?: string) {
      const task = this.getWritableTask(taskId, userId);
      if (!task) {
        return undefined;
      }
      const updated = store.updateTaskStatus(taskId, status);
      if (updated) {
        stream.broadcast(taskId, { type: 'task.updated', data: updated });
      }
      return updated;
    },
  };
}

export type TaskService = ReturnType<typeof createTaskService>;
