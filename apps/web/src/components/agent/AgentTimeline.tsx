import { Empty, Typography } from 'antd';

import type { AgentEvent } from '../../types/protocol';

const { Text } = Typography;

type AgentTimelineProps = {
  events: AgentEvent[];
};

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

          return (
            <div key={event.id} className={`agent-progress-row is-${status}`}>
              <span className="agent-progress-icon" aria-hidden="true" />
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
