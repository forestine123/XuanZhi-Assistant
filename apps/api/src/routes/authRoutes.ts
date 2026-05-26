import type { FastifyInstance } from 'fastify';

import type { AppDependencies } from '../app/dependencies.js';
import { requireUserAuth } from '../http/taskGuards.js';

export function registerAuthRoutes(app: FastifyInstance, dependencies: AppDependencies) {
  app.post('/api/auth/login', async (request, reply) => {
    const body = request.body as { email?: string; password?: string };
    const login = dependencies.services.auth.login(body.email, body.password);
    if (!login) {
      return reply.status(401).send({ message: '邮箱或密码错误' });
    }
    return login;
  });

  app.get('/api/auth/me', async (request, reply) => {
    const auth = requireUserAuth(request, reply, dependencies);
    if (!auth) {
      return;
    }
    return { user: auth.user };
  });

  app.post('/api/auth/logout', async (request, reply) => {
    const auth = requireUserAuth(request, reply, dependencies);
    if (!auth) {
      return;
    }
    dependencies.services.auth.logout(auth.token);
    return reply.status(204).send();
  });
}
