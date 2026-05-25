import { ClockCircleOutlined, ExclamationCircleOutlined, LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Empty, Timeline, Typography } from 'antd';

import type { AgentEvent } from '../../types/protocol';

const { Text } = Typography;

const statusIcon = {
  pending: <ClockCircleOutlined />,
  running: <LoadingOutlined />,
  success: <CheckCircleOutlined />,
  error: <ExclamationCircleOutlined />,
  waiting: <ClockCircleOutlined />,
};

const statusColor = {
  pending: 'gray',
  running: 'blue',
  success: 'green',
  error: 'red',
  waiting: 'orange',
};

type AgentTimelineProps = {
  events: AgentEvent[];
};

export function AgentTimeline({ events }: AgentTimelineProps) {
  if (events.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无执行事件" />;
  }

  return (
    <Timeline
      className="agent-timeline"
      items={events.map((event) => ({
        key: event.id,
        color: statusColor[event.status ?? 'pending'],
        dot: statusIcon[event.status ?? 'pending'],
        children: (
          <div className="agent-timeline-item">
            <Text strong>{event.title}</Text>
            {event.message ? <Text type="secondary">{event.message}</Text> : null}
          </div>
        ),
      }))}
    />
  );
}
