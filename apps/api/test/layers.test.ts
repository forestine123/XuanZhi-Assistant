import { describe, expect, it } from 'vitest';

import { createAppDependencies } from '../src/app/dependencies.js';

describe('backend layers', () => {
  it('creates tasks through the service layer and publishes the created event', () => {
    const dependencies = createAppDependencies();
    const task = dependencies.services.tasks.createTask({
      userId: 'user_a',
      title: 'Layered task',
      userInput: 'Create a layered backend',
      intent: 'coding',
    });

    expect(task).toMatchObject({
      userId: 'user_a',
      title: 'Layered task',
      intent: 'coding',
      status: 'created',
    });
    expect(dependencies.store.listEvents(task.id).map((event) => event.type)).toEqual(['task.created']);
  });

  it('moves approval completion workflow into the approval service', () => {
    const dependencies = createAppDependencies();
    const task = dependencies.services.tasks.createTask({
      userId: 'user_a',
      title: 'Approval task',
      userInput: 'Approve the work',
      intent: 'general',
    });
    const approval = dependencies.store.addApproval({
      userId: task.userId,
      taskId: task.id,
      title: 'Approve work',
      description: 'Allow the task to complete',
      action: 'task.complete',
      payload: {},
    });

    const updated = dependencies.services.approvals.updateApproval(approval.id, 'user_a', 'approved');

    expect(updated.status).toBe('approved');
    expect(dependencies.store.getOwnedTask(task.id, 'user_a')?.status).toBe('completed');
    expect(dependencies.store.listMessages(task.id).at(-1)).toMatchObject({
      role: 'assistant',
    });
    expect(dependencies.store.listEvents(task.id).map((event) => event.type)).toContain('task.completed');
  });
});
