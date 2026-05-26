import { Empty, Paragraph, Text } from '../ui';

import type { Artifact } from '../../types/protocol';

type ArtifactViewerProps = {
  artifact?: Artifact;
};

function renderJson(content: unknown) {
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return <pre className="artifact-code">{JSON.stringify(content, null, 2)}</pre>;
  }

  return (
    <dl className="artifact-description-list">
      {Object.entries(content).map(([key, value]) => (
        <div className="artifact-description-row" key={key}>
          <dt>{key}</dt>
          <dd>{Array.isArray(value) ? value.join('、') : typeof value === 'object' ? JSON.stringify(value) : String(value)}</dd>
        </div>
      ))}
    </dl>
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
        <Text className="artifact-type-badge" type="secondary">
          {artifact.type}
        </Text>
      </div>
      {artifact.format === 'json' ? (
        renderJson(artifact.content)
      ) : (
        <Paragraph className="artifact-markdown">{String(artifact.content ?? '')}</Paragraph>
      )}
    </div>
  );
}
