import type { GeneratedFile } from '../../utils/agentMessage';
import { Tag } from '../ui';
import { Icon } from '../ui/icons';

type GeneratedFileListProps = {
  files: GeneratedFile[];
};

function fileKind(file: GeneratedFile) {
  if (file.isImage) return '图片';
  const ext = file.name.split('.').pop();
  return ext ? ext.toUpperCase() : '文件';
}

export function GeneratedFileList({ files }: GeneratedFileListProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <section className="generated-file-list" aria-label="生成文件">
      <div className="generated-file-list-title">生成文件</div>
      <div className="generated-file-grid">
        {files.map((file) => (
          <article className={`generated-file-card ${file.isImage ? 'is-image' : ''}`} key={file.id}>
            {file.previewUrl ? (
              <a className="generated-file-preview" href={file.downloadUrl} download={file.name}>
                <img src={file.previewUrl} alt={file.name} loading="lazy" />
              </a>
            ) : (
              <span className="generated-file-icon" aria-hidden="true">
                <Icon name="file-text" />
              </span>
            )}
            <div className="generated-file-meta">
              <span className="generated-file-name" title={file.path}>{file.name}</span>
              <Tag>{fileKind(file)}</Tag>
            </div>
            <a
              className="ui-button ui-button-default ui-button-small generated-file-download"
              href={file.downloadUrl}
              download={file.name}
            >
              <Icon name="cloud" />
              下载
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
