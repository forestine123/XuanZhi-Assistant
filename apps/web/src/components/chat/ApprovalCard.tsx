import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Space, Typography } from 'antd';

import type { Approval } from '../../types/protocol';

const { Text } = Typography;

type ApprovalCardProps = {
  approval: Approval;
  loading?: boolean;
  onApprove: (approvalId: string) => void;
  onReject: (approvalId: string) => void;
};

export function ApprovalCard({ approval, loading, onApprove, onReject }: ApprovalCardProps) {
  const isPending = approval.status === 'pending';

  return (
    <Card className="approval-card" size="small">
      <Alert
        type={isPending ? 'warning' : approval.status === 'approved' ? 'success' : 'error'}
        showIcon
        message={approval.title}
        description={approval.description}
      />
      <div className="approval-card-meta">
        <Text type="secondary">动作</Text>
        <Text code>{approval.action}</Text>
      </div>
      {isPending ? (
        <Space className="approval-card-actions">
          <Button icon={<CloseOutlined />} onClick={() => onReject(approval.id)} disabled={loading}>
            拒绝
          </Button>
          <Button type="primary" icon={<CheckOutlined />} loading={loading} onClick={() => onApprove(approval.id)}>
            确认
          </Button>
        </Space>
      ) : (
        <Text strong>{approval.status === 'approved' ? '已确认' : '已拒绝'}</Text>
      )}
    </Card>
  );
}
