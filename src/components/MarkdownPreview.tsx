'use client';

import React, { useMemo } from 'react';
import { marked } from 'marked';
import { getUiThemeColors } from '@/lib/theme-colors';
import { ALL_THEMES } from '@/lib/themes';

interface MarkdownPreviewProps {
  content: string;
  theme?: string;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content, theme = 'vs-dark' }) => {
  const htmlContent = useMemo(() => {
    try {
      return marked.parse(content || '*No content to preview*') as string;
    } catch (e) {
      console.error('Failed to parse markdown', e);
      return '<p class="text-rose-400">Error rendering Markdown preview</p>';
    }
  }, [content]);

  const themeOption = useMemo(() => {
    return ALL_THEMES.find((t) => t.id === theme);
  }, [theme]);

  const isLight = themeOption ? themeOption.type === 'light' : false;
  const colors = useMemo(() => getUiThemeColors(theme, isLight), [theme, isLight]);

  return (
    <div 
      className="h-full w-full overflow-y-auto p-6 md:p-8 transition-colors duration-150 select-text"
      style={{
        backgroundColor: colors.editorBg,
        color: colors.textPrimary,
        '--preview-editor-bg': colors.editorBg,
        '--preview-editor-fg': colors.textPrimary,
        '--preview-secondary': colors.textSecondary,
        '--preview-muted': colors.textMuted,
        '--preview-surface': colors.bgSurface,
        '--preview-elevated': colors.bgElevated,
        '--preview-border': colors.border,
        '--preview-brand': colors.brandPrimary,
      } as React.CSSProperties}
    >
      <div 
        className="max-w-4xl mx-auto text-sm leading-relaxed space-y-4
          [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-[var(--preview-editor-fg)] [&_h1]:border-b [&_h1]:border-[var(--preview-border)] [&_h1]:pb-2.5 [&_h1]:mb-4
          [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[var(--preview-editor-fg)] [&_h2]:border-b [&_h2]:border-[var(--preview-border)]/60 [&_h2]:pb-2 [&_h2]:mb-3
          [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[var(--preview-editor-fg)]
          [&_p]:leading-relaxed [&_p]:text-[var(--preview-secondary)]
          [&_a]:text-[var(--preview-brand)] [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:opacity-80
          [&_strong]:text-[var(--preview-editor-fg)] [&_strong]:font-semibold
          [&_code]:text-[var(--preview-brand)] [&_code]:bg-[var(--preview-surface)] [&_code]:border [&_code]:border-[var(--preview-border)]/70 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-[13px]
          [&_pre]:bg-[var(--preview-elevated)] [&_pre]:border [&_pre]:border-[var(--preview-border)] [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:border-0 [&_pre_code]:text-[var(--preview-editor-fg)]
          [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--preview-brand)]/80 [&_blockquote]:bg-[var(--preview-surface)]/50 [&_blockquote]:py-1.5 [&_blockquote]:px-4 [&_blockquote]:rounded-r [&_blockquote]:text-[var(--preview-muted)] [&_blockquote]:italic
          [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-1 [&_ul]:pl-2
          [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:space-y-1 [&_ol]:pl-2
          [&_li]:text-[var(--preview-secondary)]
          [&_table]:border-collapse [&_table]:w-full [&_table]:my-4 [&_table]:border [&_table]:border-[var(--preview-border)]
          [&_th]:border [&_th]:border-[var(--preview-border)] [&_th]:bg-[var(--preview-surface)] [&_th]:px-3.5 [&_th]:py-2 [&_th]:text-left [&_th]:text-[var(--preview-editor-fg)] [&_th]:font-semibold
          [&_td]:border [&_td]:border-[var(--preview-border)] [&_td]:px-3.5 [&_td]:py-2 [&_td]:text-[var(--preview-secondary)]
          [&_hr]:border-[var(--preview-border)] [&_hr]:my-6
          [&_img]:rounded-lg [&_img]:border [&_img]:border-[var(--preview-border)] [&_img]:max-w-full"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
};
