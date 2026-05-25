import { authFetch } from './apiClient';

import type { Message } from '../types/protocol';

export function sendTaskMessage(taskId: string, content: string) {
  return authFetch<Message>(`/api/tasks/${taskId}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      role: 'user',
      content,
    }),
  });
}

export function getTaskMessages(taskId: string) {
  return authFetch<Message[]>(`/api/tasks/${taskId}/messages`);
}
