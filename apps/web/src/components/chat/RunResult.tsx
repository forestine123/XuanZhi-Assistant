import { Tag } from '../ui';

type RunResultProps = {
  stdout?: string;
  stderr?: string;
  exitCode?: number;
};

export function RunResult({ stdout, stderr, exitCode }: RunResultProps) {
  const failed = typeof exitCode === 'number' && exitCode !== 0;

  if (!stdout && !stderr && exitCode === undefined) {
    return null;
  }

  return (
    <section className={`run-result ${failed ? 'is-error' : 'is-success'}`}>
      <div className="run-result-header">
        <span>运行结果</span>
        <Tag color={failed ? 'error' : 'success'}>{failed ? '运行失败' : '运行成功'}</Tag>
      </div>
      {stdout ? (
        <pre className="run-result-output">
          <code>{stdout}</code>
        </pre>
      ) : null}
      {stderr ? (
        <pre className="run-result-error">
          <code>{stderr}</code>
        </pre>
      ) : null}
    </section>
  );
}
