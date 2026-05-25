import { apiUrl } from './apiClient';

import type { StreamEvent } from '../types/protocol';

export function subscribeTaskStream(
  taskId: string,
  token: string,
  onMessage: (event: StreamEvent) => void,
  onError: (error: Event) => void,
) {
  const source = new EventSource(apiUrl(`/api/tasks/${taskId}/stream?token=${encodeURIComponent(token)}`));

  source.onmessage = (event) => {
    if (!event.data) {
      return;
    }
    onMessage(JSON.parse(event.data) as StreamEvent);
  };

  source.onerror = onError;

  return () => source.close();
}
