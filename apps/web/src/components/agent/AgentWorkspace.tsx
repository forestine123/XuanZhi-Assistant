import type { ReactNode } from 'react';

import { ApprovalCard } from '../chat/ApprovalCard';
import { ArtifactPanel } from '../artifacts/ArtifactPanel';
import { AgentTimeline } from './AgentTimeline';
import { Badge, Button, Divider, Empty, Space, Tabs, Tag, Text } from '../ui';
import { Icon } from '../ui/icons';
import type { AgentEvent, Approval, Artifact } from '../../types/protocol';

type AgentWorkspaceProps = {
  approvals: Approval[];
  approvingId?: string;
  artifacts: Artifact[];
  events: AgentEvent[];
  onApprove: (approvalId: string) => void;
  onReject: (approvalId: string) => void;
};

const approvalStatusMeta = {
  pending: { label: '待确认', color: 'warning', icon: <Icon name="clock" /> },
  approved: { label: '已确认', color: 'success', icon: <Icon name="check-circle" /> },
  rejected: { label: '已拒绝', color: 'error', icon: <Icon name="x-circle" /> },
} satisfies Record<Approval['status'], { label: string; color: string; icon: ReactNode }>;

function ApprovalCenter({
  approvals,
  approvingId,
  onApprove,
  onReject,
}: {
  approvals: Approval[];
  approvingId?: string;
  onApprove: (approvalId: string) => void;
  onReject: (approvalId: string) => void;
}) {
  if (approvals.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无审批记录" />;
  }

  return (
    <div className="approval-center">
      <div className="approval-record-list">
        {approvals.map((approval) => {
          const meta = approvalStatusMeta[approval.status];

          return (
            <div className="approval-record-item" key={approval.id}>
              <div className="approval-record-main">
                <div className="approval-record-title">
                  <Text strong>{approval.title}</Text>
                  <Tag color={meta.color} icon={meta.icon}>
                    {meta.label}
                  </Tag>
                </div>
                <Text type="secondary">{approval.description}</Text>
                <Text code>{approval.action}</Text>
                {approval.status === 'pending' ? (
                  <Space className="approval-record-actions">
                    <Button size="small" onClick={() => onReject(approval.id)} disabled={approvingId === approval.id}>
                      拒绝
                    </Button>
                    <Button
                      type="primary"
                      size="small"
                      loading={approvingId === approval.id}
                      onClick={() => onApprove(approval.id)}
                    >
                      确认
                    </Button>
                  </Space>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProgressPanel({
  approvals,
  approvingId,
  events,
  onApprove,
  onReject,
}: {
  approvals: Approval[];
  approvingId?: string;
  events: AgentEvent[];
  onApprove: (approvalId: string) => void;
  onReject: (approvalId: string) => void;
}) {
  const pendingApprovals = approvals.filter((approval) => approval.status === 'pending');

  return (
    <div className="progress-panel">
      <AgentTimeline events={events} />
      {pendingApprovals.length > 0 ? (
        <section className="progress-approval-stack">
          <Divider className="agent-section-divider" />
          <Text className="agent-section-title" type="secondary">
            等待处理
          </Text>
          {pendingApprovals.map((approval) => (
            <ApprovalCard
              key={approval.id}
              approval={approval}
              loading={approvingId === approval.id}
              onApprove={onApprove}
              onReject={onReject}
            />
          ))}
        </section>
      ) : null}
    </div>
  );
}

export function AgentWorkspace({
  approvals,
  approvingId,
  artifacts,
  events,
  onApprove,
  onReject,
}: AgentWorkspaceProps) {
  const pendingApprovalCount = approvals.filter((approval) => approval.status === 'pending').length;

  return (
    <aside className="agent-workspace">
      <div className={`agent-workspace-panel ${pendingApprovalCount > 0 ? 'has-pending-approval' : 'is-compact'}`}>
        <div className="agent-workspace-heading">
          <div>
            <Text strong>任务工作台</Text>
            <Text type="secondary">实时进度和审批</Text>
          </div>
          {pendingApprovalCount > 0 ? (
            <Badge count={pendingApprovalCount} size="small">
              <span className="approval-badge-anchor">
                <Icon name="file-text" />
              </span>
            </Badge>
          ) : null}
        </div>
        <Tabs
          size="small"
          items={[
            {
              key: 'timeline',
              label: '执行过程',
              children: (
                <ProgressPanel
                  approvals={approvals}
                  approvingId={approvingId}
                  events={events}
                  onApprove={onApprove}
                  onReject={onReject}
                />
              ),
            },
            {
              key: 'approvals',
              label: `审批中心${pendingApprovalCount ? ` ${pendingApprovalCount}` : ''}`,
              children: (
                <ApprovalCenter
                  approvals={approvals}
                  approvingId={approvingId}
                  onApprove={onApprove}
                  onReject={onReject}
                />
              ),
            },
            {
              key: 'artifacts',
              label: '中间产物',
              children: <ArtifactPanel artifacts={artifacts} />,
            },
          ]}
        />
      </div>
    </aside>
  );
}
