import type { FastifyInstance } from 'fastify';

import type { AppDependencies } from './dependencies.js';
import { registerApprovalRoutes } from '../routes/approvalRoutes.js';
import { registerArtifactRoutes } from '../routes/artifactRoutes.js';
import { registerAuthRoutes } from '../routes/authRoutes.js';
import { registerEventRoutes } from '../routes/eventRoutes.js';
import { registerMessageRoutes } from '../routes/messageRoutes.js';
import { registerStreamRoutes } from '../routes/streamRoutes.js';
import { registerTaskRoutes } from '../routes/taskRoutes.js';

export function registerRoutes(app: FastifyInstance, dependencies: AppDependencies) {
  registerAuthRoutes(app, dependencies);
  registerTaskRoutes(app, dependencies);
  registerMessageRoutes(app, dependencies);
  registerEventRoutes(app, dependencies);
  registerArtifactRoutes(app, dependencies);
  registerApprovalRoutes(app, dependencies);
  registerStreamRoutes(app, dependencies);
}
