import type { FastifyInstance } from 'fastify';

export function registerCors(app: FastifyInstance) {
  app.addHook('onRequest', async (_request, reply) => {
    reply.header('access-control-allow-origin', '*');
    reply.header('access-control-allow-methods', 'GET,POST,PATCH,OPTIONS');
    reply.header('access-control-allow-headers', 'content-type,authorization');
  });

  app.options('/*', async (_request, reply) => reply.status(204).send());
}
