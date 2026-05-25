import { useMemo, useState } from 'react';
import { Empty, List, Typography } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';

import type { Artifact } from '../../types/protocol';
import { ArtifactViewer } from './ArtifactViewer';

const { Text } = Typography;

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
      <List
        className="artifact-list"
        size="small"
        dataSource={artifacts}
        renderItem={(artifact) => (
          <List.Item
            className={artifact.id === activeArtifact?.id ? 'is-active' : ''}
            onClick={() => setActiveId(artifact.id)}
          >
            <List.Item.Meta
              avatar={<FileTextOutlined />}
              title={artifact.title}
              description={<Text type="secondary">{artifact.format}</Text>}
            />
          </List.Item>
        )}
      />
      <ArtifactViewer artifact={activeArtifact} />
    </div>
  );
}
