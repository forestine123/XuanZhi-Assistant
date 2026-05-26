import { Button, Tooltip } from '../ui';
import { Icon } from '../ui/icons';

import { formatMessageTime } from '../../utils/time';

type MessageActionsProps = {
  message: {
    role: 'assistant' | 'system' | 'user';
    content: string;
    createdAt: string | number;
  };
  onCopy: (content: string) => void;
  onEdit: (content: string) => void;
};

export function MessageActions({ message, onCopy, onEdit }: MessageActionsProps) {
  return (
    <div className={`message-actions ${message.role}`}>
      <span className="message-time">{formatMessageTime(message.createdAt)}</span>
      <Tooltip title="复制">
        <Button
          type="text"
          size="small"
          aria-label="复制消息"
          icon={<Icon name="copy" />}
          className="message-action-button"
          onClick={() => onCopy(message.content)}
        />
      </Tooltip>
      {message.role === 'user' ? (
        <Tooltip title="编辑">
          <Button
            type="text"
            size="small"
            aria-label="编辑消息"
            icon={<Icon name="edit" />}
            className="message-action-button"
            onClick={() => onEdit(message.content)}
          />
        </Tooltip>
      ) : null}
    </div>
  );
}
