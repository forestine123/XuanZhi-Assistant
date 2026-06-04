import { useState } from 'react';

import { Button, Tag } from '../ui';
import { Icon } from '../ui/icons';

type CodeCardProps = {
  fileName?: string;
  language?: string;
  code: string;
};

export function CodeCard({ fileName, language, code }: CodeCardProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="code-card">
      <div className="code-card-header">
        <div className="code-card-meta">
          <span className="code-card-file">{fileName ?? '代码片段'}</span>
          {language ? <Tag>{language}</Tag> : null}
        </div>
        <Button type="text" size="small" icon={<Icon name="copy" />} onClick={copyCode}>
          {copied ? '已复制' : '复制'}
        </Button>
      </div>
      <pre className="code-card-body">
        <code>{code}</code>
      </pre>
    </section>
  );
}
