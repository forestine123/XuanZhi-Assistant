import { Empty, Text } from '../ui';
import { Icon } from '../ui/icons';

import type { AgentEvent, AgentEventStatus } from '../../types/protocol';

type AgentTimelineProps = {
  events: AgentEvent[];
};

function getProgressIcon(status: AgentEventStatus) {
  if (status === 'success') {
    return <Icon name="check" />;
  }

  if (status === 'running') {
    return <Icon name="loader" />;
  }

  if (status === 'error') {
    return <Icon name="x" />;
  }

  return null;
}

export function AgentTimeline({ events }: AgentTimelineProps) {
  if (events.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无执行事件" />;
  }

  return (
    <section className="agent-progress-card">
      <Text className="agent-section-title" type="secondary">
        进度
      </Text>
      <div className="agent-progress-list">
        {events.map((event) => {
          const status = event.status ?? 'pending';
          const progressIcon = getProgressIcon(status);

          return (
            <div key={event.id} className={`agent-progress-row is-${status}`}>
              <span className={`agent-progress-icon ${progressIcon ? 'has-symbol' : ''}`} aria-hidden="true">
                {progressIcon}
              </span>
              <span className="agent-progress-copy">
                <Text strong>{event.title}</Text>
                {event.message ? <Text type="secondary">{event.message}</Text> : null}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
