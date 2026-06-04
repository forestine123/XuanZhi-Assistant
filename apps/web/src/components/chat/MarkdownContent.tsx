import { XMarkdown } from '@ant-design/x-markdown';

type MarkdownContentProps = {
  content: string;
  streaming?: boolean;
};

function hasMarkdownSyntax(content: string) {
  return /(^|\n)\s{0,3}(#{1,6}\s|[-*+]\s|\d+\.\s|>\s|```|~~~|\|.+\|)|!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\)|[*_~`]/m.test(content);
}

export function MarkdownContent({ content, streaming = false }: MarkdownContentProps) {
  if (!hasMarkdownSyntax(content)) {
    return <p className="assistant-markdown assistant-plain-text">{content}</p>;
  }

  return (
    <XMarkdown
      className="assistant-markdown"
      content={content}
      streaming={{
        hasNextChunk: streaming,
        enableAnimation: streaming,
        tail: streaming,
      }}
    />
  );
}
