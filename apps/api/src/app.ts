import Fastify from 'fastify';

import { createAppDependencies } from './app/dependencies.js';
import { registerRoutes } from './app/registerRoutes.js';
import { registerCors } from './http/cors.js';

export function buildApp() {
  const app = Fastify({ logger: false });
  const dependencies = createAppDependencies();

  registerCors(app);
  registerRoutes(app, dependencies);

  return app;
}
