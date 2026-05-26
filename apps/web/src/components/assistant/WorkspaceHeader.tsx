import { useState } from 'react';

import { Badge, Button, Empty, Popover, Space, Tag, Text, Tooltip } from '../ui';
import { Icon } from '../ui/icons';

import type { Approval, Task } from '../../types/protocol';

const taskStatusLabel = {
  created: '已创建',
  planning: '规划中',
  running: '执行中',
  waiting_approval: '等待确认',
  completed: '已完成',
  failed: '失败',
} satisfies Record<Task['status'], string>;

type WorkspaceHeaderProps = {
  pendingApprovalCount: number;
  pendingApprovalSummaries: Array<{
    task: Task;
    approvals: Approval[];
  }>;
  sidebarCollapsed: boolean;
  workspaceCollapsed: boolean;
  task?: Task;
  onCreateConversation: () => void;
  onOpenTask: (taskId: string) => void;
  onToggleSidebar: () => void;
  onToggleWorkspace: () => void;
};

export function WorkspaceHeader({
  pendingApprovalCount,
  pendingApprovalSummaries,
  sidebarCollapsed,
  workspaceCollapsed,
  task,
  onCreateConversation,
  onOpenTask,
  onToggleSidebar,
  onToggleWorkspace,
}: WorkspaceHeaderProps) {
  const [pendingApprovalOpen, setPendingApprovalOpen] = useState(false);
  const openPendingApprovalTask = (taskId: string) => {
    setPendingApprovalOpen(false);
    onOpenTask(taskId);
  };

  const pendingApprovalContent =
    pendingApprovalSummaries.length > 0 ? (
      <div className="pending-approval-popover">
        <div className="pending-approval-popover-header">
          <Text strong>待审批任务</Text>
          <Tag color="blue">{pendingApprovalCount}</Tag>
        </div>
        <div className="pending-approval-list">
          {pendingApprovalSummaries.map(({ task: pendingTask, approvals }) => (
            <Button
              key={pendingTask.id}
              type="text"
              className="pending-approval-item"
              onClick={() => openPendingApprovalTask(pendingTask.id)}
            >
              <span className="pending-approval-item-main">
                <Text strong>{pendingTask.title}</Text>
                <Text type="secondary">{approvals[0]?.title ?? '待处理审批'}</Text>
              </span>
              <Tag color="warning">{approvals.length}</Tag>
            </Button>
          ))}
        </div>
      </div>
    ) : (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无待审批任务" />
    );

  return (
    <header className="workspace-header">
      <div className="workspace-header-start">
        <Tooltip title={sidebarCollapsed ? '显示侧边栏' : '隐藏侧边栏'}>
          <Button
            type="text"
            icon={sidebarCollapsed ? <Icon name="chevron-right-panel" /> : <Icon name="chevron-left-panel" />}
            className="sidebar-toggle"
            aria-label={sidebarCollapsed ? '显示侧边栏' : '隐藏侧边栏'}
            aria-expanded={!sidebarCollapsed}
            onClick={onToggleSidebar}
          />
        </Tooltip>
        <div className="collapsed-new-chat-wrap" aria-hidden={!sidebarCollapsed}>
          <Tooltip title="新对话">
            <Button
              type="text"
              shape="circle"
              icon={<Icon name="plus" />}
              className="collapsed-new-chat-button"
              aria-label="新对话"
              tabIndex={sidebarCollapsed ? 0 : -1}
              onClick={onCreateConversation}
            />
          </Tooltip>
        </div>
        {task ? (
          <div className="workspace-title">
            <span>{task.title}</span>
            <small>{taskStatusLabel[task.status]}</small>
          </div>
        ) : null}
      </div>
      <Space size={8}>
        {pendingApprovalCount > 0 ? (
          <Popover
            content={pendingApprovalContent}
            overlayClassName="pending-approval-overlay"
            open={pendingApprovalOpen}
            onOpenChange={setPendingApprovalOpen}
            placement="bottomRight"
            trigger={['hover', 'click']}
          >
            <Badge count={pendingApprovalCount} size="small">
              <Button className="pending-approval-button" type="default">
                待审批 {pendingApprovalCount}
              </Button>
            </Badge>
          </Popover>
        ) : null}
        {task ? (
          <Tooltip title={workspaceCollapsed ? '显示工作台' : '隐藏工作台'}>
            <Button
              type="text"
              shape="circle"
              icon={workspaceCollapsed ? <Icon name="chevron-left-panel" /> : <Icon name="chevron-right-panel" />}
              className="workspace-toggle"
              aria-label={workspaceCollapsed ? '显示工作台' : '隐藏工作台'}
              aria-expanded={!workspaceCollapsed}
              onClick={onToggleWorkspace}
            />
          </Tooltip>
        ) : null}
      </Space>
    </header>
  );
}
