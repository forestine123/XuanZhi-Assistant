import type { AgentEventStatus, Task } from '@xuanzhi/shared/protocol';

import type { MemoryStore } from '../repositories/memoryStore.js';
import type { StreamHub } from '../realtime/streamHub.js';

export function createEventService(store: MemoryStore, stream: StreamHub) {
  return {
    createEvent(
      task: Task,
      input: { type: string; title: string; message?: string; status?: AgentEventStatus; payload?: unknown },
    ) {
      const event = store.addEvent({
        userId: task.userId,
        taskId: task.id,
        type: input.type,
        title: input.title,
        message: input.message,
        status: input.status,
        payload: input.payload,
      });
      stream.broadcast(task.id, { type: 'agent.event.created', data: event });
      return event;
    },

    listEvents(taskId: string) {
      return store.listEvents(taskId);
    },
  };
}

export type EventService = ReturnType<typeof createEventService>;
