import { useMemo } from 'react';

import type { Message } from '../../types/protocol';
import { normalizeAgentMessage, type NormalizedAgentMessage } from '../../utils/agentMessage';
import { AgentExecutionSummary } from './AgentExecutionSummary';
import { CodeCard } from './CodeCard';
import { GeneratedFileList } from './GeneratedFileList';
import { MarkdownContent } from './MarkdownContent';
import { RunResult } from './RunResult';

type AssistantMessageContentProps = {
  message: Message;
  normalized?: NormalizedAgentMessage;
};

export function AssistantMessageContent({ message, normalized }: AssistantMessageContentProps) {
  const parsed = useMemo(() => normalized ?? normalizeAgentMessage(message), [message, normalized]);
  const { steps, finalAnswer, codeBlocks, generatedFiles, runResult } = parsed;

  return (
    <div className="assistant-message-content">
      {steps.length > 0 ? <AgentExecutionSummary steps={steps} mode="standard" /> : null}
      {finalAnswer ? <MarkdownContent content={finalAnswer} streaming={message.status === 'streaming'} /> : null}
      {codeBlocks.map((block) => (
        <CodeCard key={block.id} fileName={block.fileName} language={block.language} code={block.code} />
      ))}
      <GeneratedFileList files={generatedFiles} />
      {runResult ? <RunResult {...runResult} /> : null}
    </div>
  );
}
