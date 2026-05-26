import type { FastifyInstance } from 'fastify';

import type { AppDependencies } from '../app/dependencies.js';
import { requireOwnedTask, requireUserAuth, requireWritableTask } from '../http/taskGuards.js';

export function registerApprovalRoutes(app: FastifyInstance, dependencies: AppDependencies) {
  app.post('/api/tasks/:taskId/approvals', async (request, reply) => {
    const task = requireWritableTask(request, reply, dependencies);
    if (!task) {
      return;
    }
    const body = request.body as { title?: string; description?: string; action?: string; payload?: unknown };
    if (!body.title || !body.description || !body.action) {
      return reply.status(400).send({ message: '审批 title、description 和 action 必填' });
    }
    const approval = dependencies.services.approvals.createApproval(task, {
      title: body.title,
      description: body.description,
      action: body.action,
      payload: body.payload,
    });
    return reply.status(201).send(approval);
  });

  app.get('/api/tasks/:taskId/approvals', async (request, reply) => {
    const task = requireOwnedTask(request, reply, dependencies);
    if (!task) {
      return;
    }
    return dependencies.services.approvals.listApprovals(task.id);
  });

  app.post('/api/approvals/:approvalId/approve', async (request, reply) => {
    const auth = requireUserAuth(request, reply, dependencies);
    if (!auth) {
      return;
    }
    const { approvalId } = request.params as { approvalId: string };
    const updated = dependencies.services.approvals.updateApproval(approvalId, auth.user.id, 'approved');
    if (!updated) {
      return reply.status(404).send({ message: '审批不存在' });
    }
    return updated;
  });

  app.post('/api/approvals/:approvalId/reject', async (request, reply) => {
    const auth = requireUserAuth(request, reply, dependencies);
    if (!auth) {
      return;
    }
    const { approvalId } = request.params as { approvalId: string };
    const updated = dependencies.services.approvals.updateApproval(approvalId, auth.user.id, 'rejected');
    if (!updated) {
      return reply.status(404).send({ message: '审批不存在' });
    }
    return updated;
  });
}
