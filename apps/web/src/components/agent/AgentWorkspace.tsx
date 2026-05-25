import { Tabs } from 'antd';

import type { AgentEvent, Artifact } from '../../types/protocol';
import { ArtifactPanel } from '../artifacts/ArtifactPanel';
import { AgentTimeline } from './AgentTimeline';

type AgentWorkspaceProps = {
  artifacts: Artifact[];
  events: AgentEvent[];
};

export function AgentWorkspace({ artifacts, events }: AgentWorkspaceProps) {
  return (
    <aside className="agent-workspace">
      <div className="agent-workspace-panel">
        <Tabs
          size="small"
          items={[
            {
              key: 'timeline',
              label: '执行过程',
              children: <AgentTimeline events={events} />,
            },
            {
              key: 'artifacts',
              label: '中间产物',
              children: <ArtifactPanel artifacts={artifacts} />,
            },
          ]}
        />
      </div>
    </aside>
  );
}
