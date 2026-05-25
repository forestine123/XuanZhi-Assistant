import { Empty } from 'antd';

import type { Approval, Message } from '../../types/protocol';
import { ApprovalCard } from './ApprovalCard';
import { ChatCanvas } from './ChatCanvas';

type ChatPanelProps = {
  messages: Message[];
  approvals: Approval[];
  approvingId?: string;
  onApprove: (approvalId: string) => void;
  onCopyMessage: (content: string) => void;
  onEditMessage: (content: string) => void;
  onReject: (approvalId: string) => void;
};

export function ChatPanel({
  messages,
  approvals,
  approvingId,
  onApprove,
  onCopyMessage,
  onEditMessage,
  onReject,
}: ChatPanelProps) {
  const pendingApprovals = approvals.filter((approval) => approval.status === 'pending');

  return (
    <div className="chat-panel">
      {messages.length > 0 ? (
        <ChatCanvas messages={messages} onCopyMessage={onCopyMessage} onEditMessage={onEditMessage} />
      ) : (
        <Empty className="chat-empty" description="这个任务还没有消息" />
      )}
      {pendingApprovals.map((approval) => (
        <ApprovalCard
          key={approval.id}
          approval={approval}
          loading={approvingId === approval.id}
          onApprove={onApprove}
          onReject={onReject}
        />
      ))}
    </div>
  );
}
