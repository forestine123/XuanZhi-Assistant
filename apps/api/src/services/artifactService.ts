import type { ArtifactFormat, ArtifactType, Task } from '@xuanzhi/shared/protocol';

import type { MemoryStore } from '../repositories/memoryStore.js';
import type { StreamHub } from '../realtime/streamHub.js';

export function createArtifactService(store: MemoryStore, stream: StreamHub) {
  return {
    createArtifact(task: Task, input: { type: ArtifactType; title: string; format: ArtifactFormat; content: unknown }) {
      const artifact = store.addArtifact({
        userId: task.userId,
        taskId: task.id,
        type: input.type,
        title: input.title,
        format: input.format,
        content: input.content,
      });
      stream.broadcast(task.id, { type: 'artifact.created', data: artifact });
      return artifact;
    },

    listArtifacts(taskId: string) {
      return store.listArtifacts(taskId);
    },
  };
}

export type ArtifactService = ReturnType<typeof createArtifactService>;
