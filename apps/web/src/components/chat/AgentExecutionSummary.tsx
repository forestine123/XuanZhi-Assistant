import { useState } from 'react';

import { Button, Tag } from '../ui';
import { Icon } from '../ui/icons';
import type { AgentExecutionMode, AgentStep, AgentStepStatus } from '../../utils/agentMessage';
import { formatAgentStep } from '../../utils/agentMessage';

type AgentExecutionSummaryProps = {
  steps: AgentStep[];
  mode?: AgentExecutionMode;
};

function StatusIcon({ status }: { status: AgentStepStatus }) {
  const iconName =
    status === 'running'
      ? 'loader'
      : status === 'success'
        ? 'check-circle'
        : status === 'warning'
          ? 'alert-triangle'
          : status === 'error'
            ? 'x-circle'
            : 'circle';

  return <Icon name={iconName} className={`agent-step-status-icon is-${status}`} />;
}

function getSummaryText(steps: AgentStep[]) {
  const completedCount = steps.filter((step) => step.status === 'success').length;
  const runningIndex = steps.findIndex((step) => step.status === 'running');
  const hasError = steps.some((step) => step.status === 'error');

  if (hasError) {
    return <>执行失败，已完成 {completedCount} / {steps.length} 个步骤</>;
  }

  if (runningIndex >= 0) {
    return <>正在执行第 {runningIndex + 1} / {steps.length} 个步骤</>;
  }

  return <>已完成 {completedCount} 个步骤</>;
}

function statusTagColor(steps: AgentStep[]) {
  if (steps.some((step) => step.status === 'error')) return 'error';
  if (steps.some((step) => step.status === 'warning')) return 'warning';
  if (steps.some((step) => step.status === 'running')) return 'processing';
  return 'success';
}

function previewText(value: string) {
  return value.replace(/\s+/g, ' ').trim().slice(0, 240);
}

export function AgentExecutionSummary({ steps, mode = 'standard' }: AgentExecutionSummaryProps) {
  const [open, setOpen] = useState(mode === 'debug');

  if (mode === 'simple' || steps.length === 0) {
    return null;
  }

  return (
    <section className={`agent-execution-summary is-${mode}`} aria-label="执行详情">
      <button
        className="agent-execution-trigger"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="agent-execution-title">执行详情</span>
        <Tag color={statusTagColor(steps)}>{getSummaryText(steps)}</Tag>
        <Icon name="chevron-down" className={`agent-execution-chevron ${open ? 'is-open' : ''}`} />
      </button>

      {open ? (
        <div className="agent-execution-content">
          {steps.map((step) => (
            <div className="agent-step-row" key={step.id}>
              <StatusIcon status={step.status} />
              <span className="agent-step-text">{formatAgentStep(step)}</span>
              {step.durationMs ? <span className="agent-step-duration">{step.durationMs}ms</span> : null}
              {step.result ? <span className="agent-step-result">{previewText(step.result)}</span> : null}
              {mode === 'debug' ? (
                <details className="agent-step-debug">
                  <summary>调试信息</summary>
                  <pre>{JSON.stringify(step, null, 2)}</pre>
                </details>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {mode === 'debug' ? (
        <Button type="text" size="small" onClick={() => setOpen((value) => !value)}>
          {open ? '收起调试信息' : '展开调试信息'}
        </Button>
      ) : null}
    </section>
  );
}
