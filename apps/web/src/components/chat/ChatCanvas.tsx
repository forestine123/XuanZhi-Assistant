import { useMemo } from 'react';
import { Bubble } from '@ant-design/x';

import type { Message } from '../../types/protocol';
import { normalizeAgentMessage } from '../../utils/agentMessage';
import { AssistantMessageContent } from './AssistantMessageContent';
import { MessageActions } from './MessageActions';

const bubbleRoles = {
  assistant: {
    placement: 'start' as const,
    variant: 'borderless' as const,
    shape: 'round' as const,
    className: 'assistant-message',
    styles: {
      content: {
        background: 'transparent',
        border: 0,
        boxShadow: 'none',
        padding: 0,
      },
    },
  },
  user: {
    placement: 'end' as const,
    variant: 'filled' as const,
    shape: 'round' as const,
    className: 'user-message',
    styles: {
      content: {
        background: '#eaf2ff',
        color: '#172033',
      },
    },
  },
};

type ChatCanvasProps = {
  messages: Message[];
  renderKey: string;
  onCopyMessage: (content: string) => void;
  onEditMessage: (content: string) => void;
};

export function ChatCanvas({ messages, renderKey, onCopyMessage, onEditMessage }: ChatCanvasProps) {
  const bubbleItems = useMemo(
    () =>
      messages.map((message) => {
        const normalized = message.role === 'assistant' ? normalizeAgentMessage(message) : undefined;

        return {
          key: message.id,
          role: message.role === 'user' ? 'user' : 'assistant',
          content:
            message.role === 'assistant' ? (
              <AssistantMessageContent message={message}
                key={`${message.id}:${renderKey}`}
                normalized={normalized}
              />
            ) : (
              message.content
            ),
          footer: (
            <MessageActions
              message={normalized ? { ...message, content: normalized.copyContent } : message}
              onCopy={onCopyMessage}
              onEdit={onEditMessage}
            />
          ),
          footerPlacement: message.role === 'user' ? ('outer-end' as const) : ('outer-start' as const),
        };
      }),
    [messages, onCopyMessage, onEditMessage, renderKey],
  );

  return (
    <div className="chat-canvas">
      <Bubble.List items={bubbleItems} role={bubbleRoles} autoScroll className="bubble-list" />
    </div>
  );
}
