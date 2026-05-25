import type { ServerResponse } from 'node:http';

import type { StreamEvent } from '@xuanzhi/shared/protocol';

export class StreamHub {
  private readonly clients = new Map<string, Set<ServerResponse>>();

  add(taskId: string, response: ServerResponse) {
    const clients = this.clients.get(taskId) ?? new Set<ServerResponse>();
    clients.add(response);
    this.clients.set(taskId, clients);

    return () => {
      clients.delete(response);
      if (clients.size === 0) {
        this.clients.delete(taskId);
      }
    };
  }

  broadcast(taskId: string, event: StreamEvent) {
    const clients = this.clients.get(taskId);
    if (!clients) {
      return;
    }

    const payload = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of clients) {
      client.write(payload);
    }
  }
}
