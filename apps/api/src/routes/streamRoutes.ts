import type { FastifyInstance } from 'fastify';

import type { AppDependencies } from '../app/dependencies.js';
import { requireUserAuth } from '../http/taskGuards.js';

export function registerStreamRoutes(app: FastifyInstance, dependencies: AppDependencies) {
  app.get('/api/tasks/:taskId/stream', async (request, reply) => {
    const auth = requireUserAuth(request, reply, dependencies);
    if (!auth) {
      return;
    }
    const { taskId } = request.params as { taskId: string };
    const task = dependencies.services.tasks.getOwnedTask(taskId, auth.user.id);
    if (!task) {
      return reply.status(404).send({ message: '任务不存在' });
    }

    reply.raw.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'access-control-allow-origin': '*',
    });
    reply.raw.write(': connected\n\n');
    const remove = dependencies.stream.add(taskId, reply.raw);
    request.raw.on('close', remove);
    reply.hijack();
  });
}
