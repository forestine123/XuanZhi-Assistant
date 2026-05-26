import type { FastifyInstance } from 'fastify';
import type { AgentEventStatus } from '@xuanzhi/shared/protocol';

import type { AppDependencies } from '../app/dependencies.js';
import { requireOwnedTask, requireWritableTask } from '../http/taskGuards.js';
import { normalizeAgentEventStatus } from '../schemas/protocolValidators.js';

export function registerEventRoutes(app: FastifyInstance, dependencies: AppDependencies) {
  app.post('/api/tasks/:taskId/events', async (request, reply) => {
    const task = requireWritableTask(request, reply, dependencies);
    if (!task) {
      return;
    }
    const body = request.body as { type?: string; title?: string; message?: string; status?: AgentEventStatus; payload?: unknown };
    if (!body.type || !body.title) {
      return reply.status(400).send({ message: '事件 type 和 title 必填' });
    }
    const event = dependencies.services.events.createEvent(task, {
      type: body.type,
      title: body.title,
      message: body.message,
      status: normalizeAgentEventStatus(body.status),
      payload: body.payload,
    });
    return reply.status(201).send(event);
  });

  app.get('/api/tasks/:taskId/events', async (request, reply) => {
    const task = requireOwnedTask(request, reply, dependencies);
    if (!task) {
      return;
    }
    return dependencies.services.events.listEvents(task.id);
  });
}
