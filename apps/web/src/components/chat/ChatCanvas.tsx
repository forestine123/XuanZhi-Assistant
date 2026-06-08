import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
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
  const canvasRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const isPinnedToBottomRef = useRef(true);
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
  const messageScrollKey = useMemo(
    () => messages
      .map((message) => [
        message.id,
        message.status ?? '',
        message.content.length,
        message.planSteps?.length ?? 0,
        message.toolCalls?.map((toolCall) => `${toolCall.id}:${toolCall.status}:${toolCall.result?.length ?? 0}`).join(',') ?? '',
      ].join(':'))
      .join('|'),
    [messages],
  );

  const findScrollParent = useCallback((node: HTMLElement | null): HTMLElement | Window => {
    let current = node?.parentElement;
    while (current) {
      const style = window.getComputedStyle(current);
      if (/(auto|scroll)/.test(`${style.overflowY} ${style.overflow}`)) {
        return current;
      }
      current = current.parentElement;
    }
    return window;
  }, []);

  const updatePinnedToBottom = useCallback(() => {
    const scrollParent = findScrollParent(canvasRef.current);
    const threshold = 80;
    if (!(scrollParent instanceof HTMLElement)) {
      const scrollTop = window.scrollY;
      const viewportHeight = window.innerHeight;
      const scrollHeight = document.documentElement.scrollHeight;
      isPinnedToBottomRef.current = scrollHeight - scrollTop - viewportHeight <= threshold;
      return;
    }

    isPinnedToBottomRef.current = (
      scrollParent.scrollHeight - scrollParent.scrollTop - scrollParent.clientHeight <= threshold
    );
  }, [findScrollParent]);

  const scrollToBottom = useCallback(() => {
    bottomAnchorRef.current?.scrollIntoView({ block: 'end' });
    isPinnedToBottomRef.current = true;
  }, []);

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(scrollToBottom);
    return () => window.cancelAnimationFrame(frame);
  }, [messageScrollKey, renderKey, scrollToBottom]);

  useEffect(() => {
    const scrollParent = findScrollParent(canvasRef.current);
    updatePinnedToBottom();
    scrollParent.addEventListener('scroll', updatePinnedToBottom, { passive: true });
    return () => scrollParent.removeEventListener('scroll', updatePinnedToBottom);
  }, [findScrollParent, updatePinnedToBottom]);

  useEffect(() => {
    const node = canvasRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver(() => {
      if (isPinnedToBottomRef.current) {
        window.requestAnimationFrame(scrollToBottom);
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [scrollToBottom]);

  return (
    <div className="chat-canvas" ref={canvasRef}>
      <Bubble.List items={bubbleItems} role={bubbleRoles} autoScroll className="bubble-list" />
      <div className="chat-scroll-anchor" ref={bottomAnchorRef} aria-hidden="true" />
    </div>
  );
}
