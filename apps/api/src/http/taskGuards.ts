import type { FastifyReply, FastifyRequest } from 'fastify';

import type { AppDependencies } from '../app/dependencies.js';
import { getAuth, getUserAuth } from './auth.js';

export function requireUserAuth(request: FastifyRequest, reply: FastifyReply, dependencies: AppDependencies) {
  const auth = getUserAuth(request, dependencies.store, dependencies.config);
  if (!auth) {
    void reply.status(401).send({ message: '未登录' });
    return undefined;
  }
  return auth;
}

export function requireOwnedTask(request: FastifyRequest, reply: FastifyReply, dependencies: AppDependencies) {
  const auth = requireUserAuth(request, reply, dependencies);
  if (!auth) {
    return undefined;
  }
  const { taskId } = request.params as { taskId: string };
  const task = dependencies.services.tasks.getOwnedTask(taskId, auth.user.id);
  if (!task) {
    void reply.status(404).send({ message: '任务不存在' });
    return undefined;
  }
  return task;
}

export function requireWritableTask(request: FastifyRequest, reply: FastifyReply, dependencies: AppDependencies) {
  const auth = getAuth(request, dependencies.store, dependencies.config);
  if (!auth) {
    void reply.status(401).send({ message: '未授权' });
    return undefined;
  }
  const { taskId } = request.params as { taskId: string };
  const task = dependencies.services.tasks.getWritableTask(taskId, auth.kind === 'user' ? auth.user.id : undefined);
  if (!task) {
    void reply.status(404).send({ message: '任务不存在' });
    return undefined;
  }
  return task;
}
