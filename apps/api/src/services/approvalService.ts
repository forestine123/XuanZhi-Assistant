import type { ApprovalStatus, Task } from '@xuanzhi/shared/protocol';

import type { MemoryStore } from '../repositories/memoryStore.js';
import type { StreamHub } from '../realtime/streamHub.js';

type TerminalApprovalStatus = Extract<ApprovalStatus, 'approved' | 'rejected'>;

export function createApprovalService(store: MemoryStore, stream: StreamHub) {
  return {
    createApproval(
      task: Task,
      input: { title: string; description: string; action: string; payload: unknown },
    ) {
      const approval = store.addApproval({
        userId: task.userId,
        taskId: task.id,
        title: input.title,
        description: input.description,
        action: input.action,
        payload: input.payload,
      });
      stream.broadcast(task.id, { type: 'approval.requested', data: approval });
      return approval;
    },

    listApprovals(taskId: string) {
      return store.listApprovals(taskId);
    },

    updateApproval(approvalId: string, userId: string, status: TerminalApprovalStatus) {
      const approval = store.getApproval(approvalId);
      if (!approval || approval.userId !== userId) {
        return undefined;
      }
      const updated = store.updateApprovalStatus(approvalId, status);
      if (!updated) {
        return undefined;
      }
      stream.broadcast(updated.taskId, { type: 'approval.updated', data: updated });

      const userEvent = store.addEvent({
        userId: updated.userId,
        taskId: updated.taskId,
        type: status === 'approved' ? 'approval.approved' : 'approval.rejected',
        title: status === 'approved' ? '用户已确认' : '用户已拒绝',
        status: status === 'approved' ? 'success' : 'error',
      });
      stream.broadcast(updated.taskId, { type: 'agent.event.created', data: userEvent });

      const task = store.updateTaskStatus(updated.taskId, status === 'approved' ? 'completed' : 'failed');
      if (task) {
        const finalEvent = store.addEvent({
          userId: task.userId,
          taskId: task.id,
          type: status === 'approved' ? 'task.completed' : 'task.failed',
          title: status === 'approved' ? '任务已完成' : '任务已取消',
          status: status === 'approved' ? 'success' : 'error',
        });
        stream.broadcast(task.id, { type: 'agent.event.created', data: finalEvent });

        const resultMessage = store.addMessage({
          userId: task.userId,
          taskId: task.id,
          role: 'assistant',
          content: status === 'approved' ? '已确认创建会议，任务已完成。' : '已拒绝创建会议，任务已取消。',
        });
        stream.broadcast(task.id, { type: 'message.created', data: resultMessage });
        stream.broadcast(task.id, { type: 'task.updated', data: task });
      }

      return updated;
    },
  };
}

export type ApprovalService = ReturnType<typeof createApprovalService>;
