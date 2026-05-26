import { Empty } from 'antd';

import type { Message } from '../../types/protocol';
import { ChatCanvas } from './ChatCanvas';

type ChatPanelProps = {
  messages: Message[];
  onCopyMessage: (content: string) => void;
  onEditMessage: (content: string) => void;
};

export function ChatPanel({
  messages,
  onCopyMessage,
  onEditMessage,
}: ChatPanelProps) {
  return (
    <div className="chat-panel">
      {messages.length > 0 ? (
        <ChatCanvas messages={messages} onCopyMessage={onCopyMessage} onEditMessage={onEditMessage} />
      ) : (
        <Empty className="chat-empty" description="这个任务还没有消息" />
      )}
    </div>
  );
}
