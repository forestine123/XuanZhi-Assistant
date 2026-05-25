import { Descriptions, Empty, Typography } from 'antd';

import type { Artifact } from '../../types/protocol';

const { Paragraph, Text } = Typography;

type ArtifactViewerProps = {
  artifact?: Artifact;
};

function renderJson(content: unknown) {
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return <pre className="artifact-code">{JSON.stringify(content, null, 2)}</pre>;
  }

  return (
    <Descriptions
      column={1}
      size="small"
      bordered
      items={Object.entries(content).map(([key, value]) => ({
        key,
        label: key,
        children: Array.isArray(value) ? value.join('、') : typeof value === 'object' ? JSON.stringify(value) : String(value),
      }))}
    />
  );
}

export function ArtifactViewer({ artifact }: ArtifactViewerProps) {
  if (!artifact) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无产物" />;
  }

  return (
    <div className="artifact-viewer">
      <div className="artifact-viewer-header">
        <Text strong>{artifact.title}</Text>
        <Text type="secondary">{artifact.type}</Text>
      </div>
      {artifact.format === 'json' ? (
        renderJson(artifact.content)
      ) : (
        <Paragraph className="artifact-markdown">{String(artifact.content ?? '')}</Paragraph>
      )}
    </div>
  );
}
