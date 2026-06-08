import type { ReactNode } from 'react';
import { Sender } from '@ant-design/x';

import { Button, Tooltip } from '../ui';
import { Icon } from '../ui/icons';
import type { ComposerVariant } from '../../types/chat';

export type ComposerCommand = '/compact' | '/status' | '/tools compact' | '/reset soft';

type ChatComposerProps = {
  commandsEnabled?: boolean;
  agentName?: string;
  value: string;
  variant: ComposerVariant;
  onChange: (value: string) => void;
  onCommand?: (command: ComposerCommand) => void;
  onSubmit: (value: string) => void;
};

const commandItems: Array<{ command: ComposerCommand; label: string; icon: ReactNode }> = [
  { command: '/compact', label: '压缩上下文', icon: <Icon name="database" /> },
  { command: '/status', label: '查看状态', icon: <Icon name="clock" /> },
  { command: '/tools compact', label: '工具清单', icon: <Icon name="tool" /> },
  { command: '/reset soft', label: '软重置', icon: <Icon name="x-circle" /> },
];

export function ChatComposer({
  agentName,
  commandsEnabled = true,
  value,
  variant,
  onChange,
  onCommand,
  onSubmit,
}: ChatComposerProps) {
  const renderFooter = (actionNode: ReactNode) => (
    <div className="sender-footer">
      <div className="sender-command-bar" aria-label="OpenClaw 快捷指令">
        {commandItems.map((item) => (
          <Tooltip key={item.command} title={`${item.command} - ${item.label}`}>
            <button
              className="sender-command-button"
              disabled={!commandsEnabled}
              type="button"
              aria-label={item.label}
              onClick={() => onCommand?.(item.command)}
            >
              {item.icon}
            </button>
          </Tooltip>
        ))}
      </div>
      <div className="sender-footer-actions">
        <Tooltip title="添加附件">
          <Button
            aria-label="添加附件"
            type="text"
            icon={<Icon name="paperclip" />}
            className="sender-action-button"
          />
        </Tooltip>
        {actionNode}
      </div>
    </div>
  );

  return (
    <div className={`composer-wrap ${variant}`}>
      <Sender
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
        placeholder={`给${agentName?.trim() || '玄知助手'}发送消息`}
        submitType="enter"
        autoSize={{ minRows: 1, maxRows: 5 }}
        allowSpeech
        className="assistant-sender"
        suffix={false}
        footer={renderFooter}
      />
    </div>
  );
}
