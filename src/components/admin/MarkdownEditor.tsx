import { useMemo } from 'react';
import { marked } from 'marked';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const html = useMemo(() => marked.parse(value || '') as string, [value]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <p className="mb-2 text-[10px] tracking-[0.16em] text-white/25">MARKDOWN</p>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          className="admin-input min-h-[320px] w-full resize-y font-mono text-sm leading-relaxed"
          placeholder="写点东西..."
          spellCheck={false}
        />
      </div>
      <div>
        <p className="mb-2 text-[10px] tracking-[0.16em] text-white/25">预览</p>
        <div
          className="min-h-[320px] border border-white/8 bg-white/[0.02] px-6 py-5 font-serif text-base leading-[2.2] tracking-[0.06em] text-white/68 [&_p]:mb-5 [&_p]:[text-indent:2em] [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:font-serif [&_h2]:text-xl [&_h2]:text-white/85 [&_em]:italic [&_strong]:font-semibold [&_strong]:text-white/88 [&_img]:my-4 [&_img]:max-w-full [&_blockquote]:border-l-2 [&_blockquote]:border-white/15 [&_blockquote]:pl-4 [&_blockquote]:text-white/50"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
