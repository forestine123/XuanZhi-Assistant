import { useMemo, useState } from 'react';

import { Empty } from '../ui';
import { Icon } from '../ui/icons';
import type { Artifact } from '../../types/protocol';
import { ArtifactViewer } from './ArtifactViewer';

type ArtifactPanelProps = {
  artifacts: Artifact[];
};

export function ArtifactPanel({ artifacts }: ArtifactPanelProps) {
  const [activeId, setActiveId] = useState<string>();
  const activeArtifact = useMemo(
    () => artifacts.find((artifact) => artifact.id === activeId) ?? artifacts[0],
    [activeId, artifacts],
  );

  if (artifacts.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无中间产物" />;
  }

  return (
    <div className="artifact-panel">
      <div className="artifact-list">
        {artifacts.map((artifact) => (
          <button
            className={`ant-list-item ${artifact.id === activeArtifact?.id ? 'is-active' : ''}`}
            key={artifact.id}
            type="button"
            onClick={() => setActiveId(artifact.id)}
          >
            <span className="ant-list-item-meta">
              <span className="ant-list-item-meta-avatar">
                <Icon name="file-text" />
              </span>
              <span className="ant-list-item-meta-content">
                <span className="ant-list-item-meta-title">{artifact.title}</span>
              </span>
            </span>
          </button>
        ))}
      </div>
      <ArtifactViewer artifact={activeArtifact} />
    </div>
  );
}
