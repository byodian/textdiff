'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { Marked, type Token, type TokensList } from 'marked';
import { getUiThemeColors } from '@/lib/theme-colors';
import { ALL_THEMES } from '@/lib/themes';

interface MarkdownPreviewProps {
  content: string;
  theme?: string;
}

interface MermaidDiagramProps {
  chart: string;
  isLight: boolean;
}

const customMarked = new Marked();

/**
 * Isolated React component for rendering an individual Mermaid diagram.
 * Maintains its own SVG/error state so that React re-renders of the parent
 * never overwrite or reset in-progress / rendered diagrams.
 */
const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart, isLight }) => {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const trimmed = chart.trim();
    if (!trimmed) {
      setSvg(null);
      setLoading(false);
      return;
    }

    // Polyfill getBBox if missing in current environment (e.g. headless/jsdom)
    if (typeof window !== 'undefined' && typeof window.SVGElement !== 'undefined') {
      const svgProto = window.SVGElement.prototype as unknown as { getBBox?: () => unknown };
      if (!svgProto.getBBox) {
        svgProto.getBBox = () => ({
          x: 0,
          y: 0,
          width: 200,
          height: 100,
          bottom: 100,
          left: 0,
          right: 200,
          top: 0,
          toJSON: () => {},
        });
      }
    }

    // Debounce render by 80ms to avoid flooding Mermaid during fast keystrokes
    const timer = setTimeout(async () => {
      const uniqueId = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
      try {
        const mermaidModule = await import('mermaid');
        const mermaid = (mermaidModule as unknown as { default?: { default?: unknown } }).default?.default
          || (mermaidModule as unknown as { default?: unknown }).default
          || mermaidModule;

        const m = mermaid as {
          initialize: (cfg: unknown) => void;
          render: (id: string, text: string) => Promise<{ svg: string }>;
        };

        m.initialize({
          startOnLoad: false,
          theme: isLight ? 'default' : 'dark',
          securityLevel: 'loose',
          suppressErrorRendering: true,
          fontFamily: 'inherit',
        });

        const { svg: renderedSvg } = await m.render(uniqueId, trimmed);
        if (isMounted) {
          setSvg(renderedSvg);
          setError(null);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : String(err);
          setError(msg);
          setSvg(null);
          setLoading(false);
        }
      } finally {
        if (typeof document !== 'undefined') {
          const stray = document.getElementById(`d${uniqueId}`) || document.getElementById(uniqueId);
          if (stray && stray.parentElement === document.body) {
            stray.remove();
          }
        }
      }
    }, 80);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [chart, isLight]);

  const handleCopy = () => {
    navigator.clipboard?.writeText(chart);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mermaid-block my-4" data-mermaid={encodeURIComponent(chart)}>
      <div className="mermaid-header flex items-center justify-between px-3 py-1.5 bg-[var(--preview-surface)] border-t border-x border-[var(--preview-border)] rounded-t-lg text-xs text-[var(--preview-muted)] font-mono">
        <span className="flex items-center gap-1.5 font-medium text-[var(--preview-secondary)]">
          <svg className="w-3.5 h-3.5 text-[var(--preview-brand)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="18" r="3" />
            <circle cx="6" cy="6" r="3" />
            <path d="M13 6h3a2 2 0 0 1 2 2v7" />
            <line x1="6" y1="9" x2="6" y2="21" />
          </svg>
          mermaid
        </span>
        <button
          type="button"
          onClick={handleCopy}
          data-copy-mermaid
          className="hover:text-[var(--preview-editor-fg)] transition-colors px-1.5 py-0.5 rounded cursor-pointer select-none"
          title="Copy mermaid source"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <div className="mermaid-diagram flex justify-center items-center p-4 bg-[var(--preview-surface)]/50 border border-[var(--preview-border)] rounded-b-lg overflow-x-auto min-h-[60px] text-center [&_svg]:max-w-full [&_svg]:h-auto">
        {loading ? (
          <div className="text-xs text-[var(--preview-muted)] flex items-center gap-2">
            <span className="inline-block w-3 h-3 border-2 border-[var(--preview-brand)] border-t-transparent rounded-full animate-spin" />
            <span>Rendering diagram...</span>
          </div>
        ) : error ? (
          <div className="w-full p-3 text-xs bg-rose-950/25 border border-rose-500/30 rounded text-rose-300 font-mono text-left">
            <div className="font-semibold text-rose-400 mb-1 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Mermaid 语法错误</span>
            </div>
            <div className="text-[11px] text-rose-400/80 mb-2 whitespace-pre-wrap">{error}</div>
            <pre className="bg-black/30 p-2 rounded text-[11px] text-slate-300 overflow-x-auto whitespace-pre">{chart}</pre>
          </div>
        ) : svg ? (
          <div className="w-full flex justify-center items-center" dangerouslySetInnerHTML={{ __html: svg }} />
        ) : (
          <span className="text-xs text-[var(--preview-muted)] italic">No diagram content</span>
        )}
      </div>
    </div>
  );
};

type PreviewSegment = 
  | { type: 'html'; html: string }
  | { type: 'mermaid'; code: string; key: string };

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content, theme = 'vs-dark' }) => {
  const themeOption = useMemo(() => {
    return ALL_THEMES.find((t) => t.id === theme);
  }, [theme]);

  const isLight = themeOption ? themeOption.type === 'light' : false;
  const colors = useMemo(() => getUiThemeColors(theme, isLight), [theme, isLight]);

  // Parse markdown into interleaved segments: normal HTML and interactive MermaidDiagrams
  const segments = useMemo<PreviewSegment[]>(() => {
    try {
      const rawText = content || '*No content to preview*';
      const tokens: TokensList = customMarked.lexer(rawText);
      const result: PreviewSegment[] = [];
      let accumulatedTokens: Token[] = [];
      let mermaidCounter = 0;

      for (const token of tokens) {
        const isMermaid = 
          token.type === 'code' && 
          (token.lang || '').trim().toLowerCase().split(/\s+/)[0] === 'mermaid';

        if (isMermaid) {
          if (accumulatedTokens.length > 0) {
            const list = accumulatedTokens as unknown as TokensList;
            list.links = tokens.links;
            result.push({ type: 'html', html: customMarked.parser(list) });
            accumulatedTokens = [];
          }
          result.push({
            type: 'mermaid',
            code: token.text,
            key: `mermaid-seg-${mermaidCounter++}`,
          });
        } else {
          accumulatedTokens.push(token);
        }
      }

      if (accumulatedTokens.length > 0) {
        const list = accumulatedTokens as unknown as TokensList;
        list.links = tokens.links;
        result.push({ type: 'html', html: customMarked.parser(list) });
      }

      return result;
    } catch (e) {
      console.error('Failed to parse markdown', e);
      return [{ type: 'html', html: '<p class="text-rose-400">Error rendering Markdown preview</p>' }];
    }
  }, [content]);

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
        '--scrollbar-thumb': isLight ? 'rgba(55, 53, 47, 0.2)' : 'rgba(255, 255, 255, 0.18)',
        '--scrollbar-thumb-hover': isLight ? 'rgba(55, 53, 47, 0.38)' : 'rgba(255, 255, 255, 0.35)',
        '--scrollbar-thumb-active': isLight ? 'rgba(55, 53, 47, 0.55)' : 'rgba(255, 255, 255, 0.55)',
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
      >
        {segments.map((seg, idx) => {
          if (seg.type === 'mermaid') {
            return (
              <MermaidDiagram
                key={seg.key}
                chart={seg.code}
                isLight={isLight}
              />
            );
          }
          return (
            <div
              key={`html-${idx}`}
              dangerouslySetInnerHTML={{ __html: seg.html }}
            />
          );
        })}
      </div>
    </div>
  );
};
