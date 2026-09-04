'use client';

import React, { useMemo } from 'react';
import { marked } from 'marked';

interface MarkdownPreviewProps {
  content: string;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content }) => {
  const htmlContent = useMemo(() => {
    try {
      return marked.parse(content || '*No content to preview*') as string;
    } catch (e) {
      console.error('Failed to parse markdown', e);
      return '<p class="text-rose-400">Error rendering Markdown preview</p>';
    }
  }, [content]);

  return (
    <div className="h-full w-full overflow-y-auto bg-canvas p-6 md:p-8">
      <div 
        className="max-w-4xl mx-auto text-slate-300 text-sm leading-relaxed space-y-4
          [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-slate-100 [&_h1]:border-b [&_h1]:border-canvas-border [&_h1]:pb-2.5 [&_h1]:mb-4
          [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-100 [&_h2]:border-b [&_h2]:border-canvas-border/60 [&_h2]:pb-2 [&_h2]:mb-3
          [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-200
          [&_p]:leading-relaxed [&_p]:text-slate-300
          [&_a]:text-brand-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-sky-300
          [&_strong]:text-slate-100 [&_strong]:font-semibold
          [&_code]:text-sky-300 [&_code]:bg-canvas-surface [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-[13px]
          [&_pre]:bg-canvas-elevated [&_pre]:border [&_pre]:border-canvas-border [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0
          [&_blockquote]:border-l-4 [&_blockquote]:border-brand-primary/70 [&_blockquote]:bg-canvas-surface/40 [&_blockquote]:py-1.5 [&_blockquote]:px-4 [&_blockquote]:rounded-r [&_blockquote]:text-slate-400 [&_blockquote]:italic
          [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-1 [&_ul]:pl-2
          [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:space-y-1 [&_ol]:pl-2
          [&_li]:text-slate-300
          [&_table]:border-collapse [&_table]:w-full [&_table]:my-4 [&_table]:border [&_table]:border-canvas-border
          [&_th]:border [&_th]:border-canvas-border [&_th]:bg-canvas-surface [&_th]:px-3.5 [&_th]:py-2 [&_th]:text-left [&_th]:text-slate-200 [&_th]:font-semibold
          [&_td]:border [&_td]:border-canvas-border [&_td]:px-3.5 [&_td]:py-2 [&_td]:text-slate-300
          [&_hr]:border-canvas-border [&_hr]:my-6
          [&_img]:rounded-lg [&_img]:border [&_img]:border-canvas-border [&_img]:max-w-full"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
};
