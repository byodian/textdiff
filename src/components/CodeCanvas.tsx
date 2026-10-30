'use client';

import React from 'react';
import Editor, { DiffEditor, loader, DiffOnMount, Monaco, OnMount } from '@monaco-editor/react';
import { Code, Columns, Eye } from 'lucide-react';
import { MarkdownPreview, PreviewScrollTarget } from './MarkdownPreview';
import { SyntaxDiagnosticsBar } from './SyntaxDiagnosticsBar';
import { SmartOutlinePanel } from './SmartOutlinePanel';
import { applyMonacoTheme } from '@/lib/themes';
import { validateSyntax, SyntaxDiagnostic } from '@/lib/syntax-validator';
import {
  OutlineSegment,
  parseSmartOutline,
  getSemanticFoldingRanges,
} from '@/lib/smart-outline';

loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs',
  },
});

export type MonacoModelInstance = {
  canUndo?: () => boolean;
  canRedo?: () => boolean;
  getLineMaxColumn?: (lineNumber: number) => number;
  onDidChangeContent?: (listener: () => void) => void;
};

export type MonacoEditorInstance = {
  getAction: (id: string) => { run: () => void } | null;
  trigger?: (source: string, handlerId: string, payload: unknown) => void;
  layout?: () => void;
  focus?: () => void;
  getModel?: () => MonacoModelInstance | null;
  addCommand?: (keybinding: number, handler: () => void) => void;
  setPosition?: (position: { lineNumber: number; column: number }) => void;
  revealPositionInCenter?: (position: { lineNumber: number; column: number }, scrollType?: number) => void;
  onDidChangeCursorPosition?: (listener: (e: { position: { lineNumber: number; column: number } }) => void) => { dispose?: () => void };
};

export type MonacoDiffEditorInstance = {
  goToDiff?: (target: 'next' | 'previous') => void;
  getLineChanges?: () => unknown[] | null;
  getModifiedEditor?: () => MonacoEditorInstance | null;
  getOriginalEditor?: () => MonacoEditorInstance | null;
};

interface CodeCanvasProps {
  language: string;
  code: string;
  originalCode: string;
  targetCode?: string;
  theme?: string;
  isDiffMode: boolean;
  isSideBySide: boolean;
  markdownViewMode?: 'edit' | 'split' | 'preview';
  onMarkdownViewModeChange?: (mode: 'edit' | 'split' | 'preview') => void;
  onCodeChange: (val: string) => void;
  editorRef: React.MutableRefObject<MonacoEditorInstance | null>;
  diffEditorRef: React.MutableRefObject<MonacoDiffEditorInstance | null>;
  onInstantSave?: () => void;
  onOpenSearch?: () => void;
  onDiagnosticsChange?: (diags: SyntaxDiagnostic[]) => void;
  onUndoRedoChange?: (canUndo: boolean, canRedo: boolean) => void;
  isDiagnosticsExpanded?: boolean;
  onDiagnosticsExpandedChange?: (expanded: boolean) => void;
  isDiagnosticsDismissed?: boolean;
  onDiagnosticsDismissedChange?: (dismissed: boolean) => void;
  outlineSegments?: OutlineSegment[];
  isOutlineOpen?: boolean;
  onOutlineClose?: () => void;
}

const DEFAULT_SPLIT_RATIO = 0.7;

export const CodeCanvas: React.FC<CodeCanvasProps> = ({
  language,
  code,
  originalCode,
  targetCode,
  theme = 'vs-dark',
  isDiffMode,
  isSideBySide,
  markdownViewMode = 'edit',
  onMarkdownViewModeChange,
  onCodeChange,
  editorRef,
  diffEditorRef,
  onInstantSave,
  onOpenSearch,
  onDiagnosticsChange,
  onUndoRedoChange,
  isDiagnosticsExpanded,
  onDiagnosticsExpandedChange,
  isDiagnosticsDismissed,
  onDiagnosticsDismissedChange,
  outlineSegments,
  isOutlineOpen = false,
  onOutlineClose,
}) => {
  const monacoRef = React.useRef<Monaco | null>(null);
  const onInstantSaveRef = React.useRef(onInstantSave);
  onInstantSaveRef.current = onInstantSave;
  const onOpenSearchRef = React.useRef(onOpenSearch);
  onOpenSearchRef.current = onOpenSearch;
  const onDiagnosticsChangeRef = React.useRef(onDiagnosticsChange);
  onDiagnosticsChangeRef.current = onDiagnosticsChange;
  const onUndoRedoChangeRef = React.useRef(onUndoRedoChange);
  onUndoRedoChangeRef.current = onUndoRedoChange;

  const updateUndoRedoAvailability = React.useCallback(() => {
    if (!onUndoRedoChangeRef.current) return;
    const targetEditor = isDiffMode
      ? diffEditorRef.current?.getModifiedEditor?.()
      : editorRef.current;
    const model = targetEditor?.getModel?.();
    if (model) {
      const u = typeof model.canUndo === 'function' ? model.canUndo() : false;
      const r = typeof model.canRedo === 'function' ? model.canRedo() : false;
      onUndoRedoChangeRef.current(u, r);
    } else {
      onUndoRedoChangeRef.current(false, false);
    }
  }, [isDiffMode, editorRef, diffEditorRef]);

  const [diagnostics, setDiagnostics] = React.useState<SyntaxDiagnostic[]>([]);
  const [activeLine, setActiveLine] = React.useState<number>(1);
  const [previewScrollTarget, setPreviewScrollTarget] =
    React.useState<PreviewScrollTarget | null>(null);

  const segments = React.useMemo(
    () => outlineSegments ?? parseSmartOutline(code, language),
    [outlineSegments, code, language]
  );
  const segmentsRef = React.useRef<OutlineSegment[]>(segments);
  segmentsRef.current = segments;
  const foldingProviderRef = React.useRef<{ dispose?: () => void } | null>(null);

  const registerSemanticFolding = React.useCallback(
    (monaco: Monaco, lang: string) => {
      foldingProviderRef.current?.dispose?.();
      if (monaco?.languages?.registerFoldingRangeProvider) {
        foldingProviderRef.current = monaco.languages.registerFoldingRangeProvider(lang, {
          provideFoldingRanges: () => {
            return getSemanticFoldingRanges(segmentsRef.current).map((r) => ({
              start: r.start,
              end: r.end,
              kind: monaco.languages.FoldingRangeKind?.Region,
            }));
          },
        });
      }
    },
    []
  );

  React.useEffect(() => {
    if (monacoRef.current) {
      registerSemanticFolding(monacoRef.current, language);
    }
    return () => {
      foldingProviderRef.current?.dispose?.();
    };
  }, [language, registerSemanticFolding]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor as unknown as MonacoEditorInstance;
    monacoRef.current = monaco;
    applyMonacoTheme(monaco, theme);
    registerSemanticFolding(monaco, language);

    if (typeof editor.onDidChangeCursorPosition === 'function') {
      editor.onDidChangeCursorPosition((e) => {
        if (e?.position?.lineNumber) {
          setActiveLine(e.position.lineNumber);
        }
      });
    }

    // Initial syntax validation & markers
    const diags = validateSyntax(code, language);
    setDiagnostics(diags);
    onDiagnosticsChangeRef.current?.(diags);
    const model = editor.getModel();
    if (model) {
      const markers = diags.map((d) => ({
        severity: d.severity === 'error' ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
        startLineNumber: d.line,
        startColumn: d.column,
        endLineNumber: d.endLine || d.line,
        endColumn: d.endColumn || (model.getLineMaxColumn?.(d.line) ?? d.column + 2),
        message: `${d.message}${d.suggestion ? `\n💡 修改建议: ${d.suggestion}` : ''}`,
        source: 'Syntax Linter',
      }));
      monaco.editor.setModelMarkers(model as unknown as Parameters<typeof monaco.editor.setModelMarkers>[0], 'syntax-linter', markers);

      updateUndoRedoAvailability();
      if (typeof model.onDidChangeContent === 'function') {
        model.onDidChangeContent(() => {
          updateUndoRedoAvailability();
        });
      }
    }

    if (editor && typeof editor.addCommand === 'function' && monaco?.KeyMod && monaco?.KeyCode) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        onInstantSaveRef.current?.();
      });
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP, () => {
        onOpenSearchRef.current?.();
      });
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
        onOpenSearchRef.current?.();
      });
    }
  };

  const handleDiffEditorDidMount: DiffOnMount = (editor, monaco) => {
    diffEditorRef.current = editor as unknown as MonacoDiffEditorInstance;
    monacoRef.current = monaco;
    applyMonacoTheme(monaco, theme);

    const modified = editor.getModifiedEditor();
    if (modified) {
      const model = modified.getModel();
      updateUndoRedoAvailability();
      if (model && typeof model.onDidChangeContent === 'function') {
        model.onDidChangeContent(() => {
          updateUndoRedoAvailability();
        });
      }
      if (typeof modified.addCommand === 'function' && monaco?.KeyMod && monaco?.KeyCode) {
        modified.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
          onInstantSaveRef.current?.();
        });
        modified.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP, () => {
          onOpenSearchRef.current?.();
        });
        modified.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
          onOpenSearchRef.current?.();
        });
      }
    }
  };

  // Re-apply theme dynamically when theme changes
  React.useEffect(() => {
    if (monacoRef.current) {
      applyMonacoTheme(monacoRef.current, theme);
    }
  }, [theme]);

  // Syntax validation and Monaco markers update on code or language changes
  React.useEffect(() => {
    const diags = validateSyntax(code, language);
    setDiagnostics(diags);
    onDiagnosticsChangeRef.current?.(diags);

    if (monacoRef.current && editorRef.current) {
      const monaco = monacoRef.current;
      const editor = editorRef.current;
      const model = editor.getModel?.();
      if (model) {
        const markers = diags.map((d) => ({
          severity: d.severity === 'error' ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
          startLineNumber: d.line,
          startColumn: d.column,
          endLineNumber: d.endLine || d.line,
          endColumn: d.endColumn || (model.getLineMaxColumn?.(d.line) ?? d.column + 2),
          message: `${d.message}${d.suggestion ? `\n💡 修改建议: ${d.suggestion}` : ''}`,
          source: 'Syntax Linter',
        }));
        monaco.editor.setModelMarkers(model as unknown as Parameters<typeof monaco.editor.setModelMarkers>[0], 'syntax-linter', markers);
      }
    }
  }, [code, language, editorRef]);

  const handleNavigateToError = React.useCallback(
    (line: number, column: number) => {
      const editor = editorRef.current;
      if (editor && typeof editor.setPosition === 'function') {
        editor.setPosition({ lineNumber: line, column });
        if (typeof editor.revealPositionInCenter === 'function') {
          const monaco = monacoRef.current;
          editor.revealPositionInCenter(
            { lineNumber: line, column },
            monaco?.editor?.ScrollType?.Smooth ?? 0
          );
        }
        editor.focus?.();
      }
    },
    [editorRef]
  );

  const handleApplyQuickFix = React.useCallback(
    (fixFn: (currentCode: string) => string) => {
      const updated = fixFn(code);
      onCodeChange(updated);
      setTimeout(updateUndoRedoAvailability, 20);
    },
    [code, onCodeChange, updateUndoRedoAvailability]
  );

  const handleSelectOutlineSegment = React.useCallback(
    (seg: OutlineSegment) => {
      setActiveLine(seg.startLine);
      setPreviewScrollTarget((prev) => ({
        startLine: seg.startLine,
        endLine: seg.endLine,
        seq: (prev?.seq ?? 0) + 1,
      }));
      const editor = editorRef.current;
      if (!editor) return;
      editor.trigger?.('smart-outline', 'editor.unfold', {
        selectionLines: [seg.startLine],
      });
      editor.setPosition?.({ lineNumber: seg.startLine, column: 1 });
      const monaco = monacoRef.current;
      editor.revealPositionInCenter?.(
        { lineNumber: seg.startLine, column: 1 },
        monaco?.editor?.ScrollType?.Smooth ?? 0
      );
      editor.focus?.();
    },
    [editorRef]
  );

  const handleFoldAllBlocks = React.useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const foldLines = segmentsRef.current
      .filter((s) => s.endLine > s.startLine)
      .map((s) => s.startLine);
    if (foldLines.length > 0 && typeof editor.trigger === 'function') {
      editor.trigger('smart-outline', 'editor.fold', {
        selectionLines: foldLines,
      });
    } else {
      editor.getAction?.('editor.foldAll')?.run();
    }
  }, [editorRef]);

  const handleExpandAllBlocks = React.useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (typeof editor.trigger === 'function') {
      editor.trigger('smart-outline', 'editor.unfoldAll', null);
    } else {
      editor.getAction?.('editor.unfoldAll')?.run();
    }
  }, [editorRef]);

  const [splitRatio, setSplitRatio] = React.useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('textdiff_markdown_split_ratio') || localStorage.getItem('codediff_markdown_split_ratio');
        if (saved) {
          const val = parseFloat(saved);
          if (!isNaN(val) && val >= 0.15 && val <= 0.85) return val;
        }
      } catch {}
    }
    return DEFAULT_SPLIT_RATIO;
  });

  const [isDraggingSplit, setIsDraggingSplit] = React.useState(false);
  const splitContainerRef = React.useRef<HTMLDivElement>(null);
  const lastClickTimeRef = React.useRef(0);
  const isPointerDownRef = React.useRef(false);
  const dragStartPosRef = React.useRef({ x: 0, y: 0 });

  const resetSplitRatio = React.useCallback(() => {
    setSplitRatio(DEFAULT_SPLIT_RATIO);
    lastClickTimeRef.current = 0;
    try {
      localStorage.setItem('textdiff_markdown_split_ratio', DEFAULT_SPLIT_RATIO.toString());
    } catch {}
    editorRef.current?.layout?.();
  }, [editorRef]);

  const handleSplitPointerDown = (e: React.PointerEvent) => {
    const now = Date.now();
    // Fast double-click detection (within 350ms)
    if (now - lastClickTimeRef.current < 350) {
      resetSplitRatio();
      lastClickTimeRef.current = 0;
      isPointerDownRef.current = false;
      setIsDraggingSplit(false);
      return;
    }
    lastClickTimeRef.current = now;
    isPointerDownRef.current = true;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleSplitDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resetSplitRatio();
  };

  React.useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDownRef.current || !splitContainerRef.current) return;

      const dx = Math.abs(e.clientX - dragStartPosRef.current.x);
      const dy = Math.abs(e.clientY - dragStartPosRef.current.y);

      // Only enter dragging state after moving past a tiny 2px threshold
      if (!isDraggingSplit && (dx > 2 || dy > 2)) {
        setIsDraggingSplit(true);
      }

      if (isDraggingSplit || dx > 2) {
        const rect = splitContainerRef.current.getBoundingClientRect();
        if (rect.width <= 0) return;
        const newRatio = (e.clientX - rect.left) / rect.width;
        const clampedRatio = Math.min(Math.max(newRatio, 0.15), 0.85);
        setSplitRatio(clampedRatio);
      }
    };

    const onPointerUp = () => {
      if (isPointerDownRef.current) {
        isPointerDownRef.current = false;
        if (isDraggingSplit) {
          setIsDraggingSplit(false);
          try {
            localStorage.setItem('textdiff_markdown_split_ratio', splitRatio.toString());
          } catch {}
          editorRef.current?.layout?.();
        }
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [isDraggingSplit, splitRatio, editorRef]);

  const modifiedValue = targetCode !== undefined ? targetCode : code;
  const isMarkdownPreview = !isDiffMode && language === 'markdown' && markdownViewMode === 'preview';
  const isMarkdownSplit = !isDiffMode && language === 'markdown' && markdownViewMode === 'split';

  const editorElement = (
    <Editor
      key={`monaco-${language === 'markdown' ? markdownViewMode : 'code'}`}
      width="100%"
      height="100%"
      language={language}
      value={code}
      onChange={(val) => onCodeChange(val || '')}
      onMount={handleEditorDidMount}
      theme={theme}
      options={{
        minimap: { enabled: false },
        folding: true,
        showFoldingControls: 'mouseover',
        fontSize: 13,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        wordWrap: 'on',
        formatOnPaste: true,
        formatOnType: true,
        suggestOnTriggerCharacters: true,
        scrollbar: {
          vertical: 'auto',
          horizontal: 'auto',
          verticalScrollbarSize: 9,
          horizontalScrollbarSize: 9,
          verticalSliderSize: 5,
          horizontalSliderSize: 5,
          useShadows: false,
          verticalHasArrows: false,
          horizontalHasArrows: false,
        },
      }}
    />
  );

  const showSmartOutline = !isDiffMode && isOutlineOpen && segments.length > 0;

  return (
    <div 
      className="flex-1 h-full w-full relative flex flex-row overflow-hidden bg-canvas transition-colors duration-150"
      style={{ backgroundColor: 'var(--color-editor-bg, var(--color-canvas-default))' }}
    >
      <div className="flex-1 h-full min-w-0 relative">
        {/* Floating Markdown View Mode Controls in Edit Area (Compact h-6, smaller than header h-7 controls) */}
        {!isDiffMode && language === 'markdown' && onMarkdownViewModeChange && (
          <div 
            className="absolute top-2.5 right-4 z-30 h-6 flex items-center bg-canvas-elevated/90 backdrop-blur-sm border border-canvas-border rounded p-0.5 select-none gap-0.5 shadow-sm" 
            role="group" 
            aria-label="Markdown view mode"
          >
            <button
              type="button"
              onClick={() => onMarkdownViewModeChange('edit')}
              className={`h-full w-5 rounded-sm transition-colors flex items-center justify-center ${
                markdownViewMode === 'edit'
                  ? 'bg-canvas-surface text-brand-primary font-medium shadow-xs'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-canvas-surface/80'
              }`}
              title="Edit markdown source only"
              aria-label="Edit markdown source only"
            >
              <Code className="w-3 h-3 shrink-0" />
            </button>
            <button
              type="button"
              onClick={() => onMarkdownViewModeChange('split')}
              className={`h-full w-5 rounded-sm transition-colors flex items-center justify-center ${
                markdownViewMode === 'split'
                  ? 'bg-canvas-surface text-brand-primary font-medium shadow-xs'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-canvas-surface/80'
              }`}
              title="Side-by-side edit and rendered preview"
              aria-label="Side-by-side edit and rendered preview"
            >
              <Columns className="w-3 h-3 shrink-0" />
            </button>
            <button
              type="button"
              onClick={() => onMarkdownViewModeChange('preview')}
              className={`h-full w-5 rounded-sm transition-colors flex items-center justify-center ${
                markdownViewMode === 'preview'
                  ? 'bg-canvas-surface text-brand-primary font-medium shadow-xs'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-canvas-surface/80'
              }`}
              title="Rendered preview only"
              aria-label="Rendered preview only"
            >
              <Eye className="w-3 h-3 shrink-0" />
            </button>
          </div>
        )}

        {isDiffMode ? (
          <DiffEditor
            width="100%"
            height="100%"
            language={language}
            original={originalCode}
            modified={modifiedValue}
            onMount={handleDiffEditorDidMount}
            theme={theme}
            options={{
              renderSideBySide: isSideBySide,
              readOnly: false,
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              diffWordWrap: 'off',
              renderIndicators: true,
              renderOverviewRuler: false,
              scrollbar: {
                vertical: 'auto',
                horizontal: 'auto',
                verticalScrollbarSize: 9,
                horizontalScrollbarSize: 9,
                verticalSliderSize: 5,
                horizontalSliderSize: 5,
                useShadows: false,
                verticalHasArrows: false,
                horizontalHasArrows: false,
              },
            }}
          />
        ) : isMarkdownPreview ? (
          <MarkdownPreview
            content={code}
            theme={theme}
            scrollTarget={previewScrollTarget}
          />
        ) : isMarkdownSplit ? (
          <div 
            ref={splitContainerRef}
            className="relative flex flex-row h-full w-full overflow-hidden select-none"
          >
            {/* Left Editor Pane */}
            <div 
              className="h-full min-h-0 overflow-hidden"
              style={{ width: `${splitRatio * 100}%`, flexShrink: 0 }}
            >
              {editorElement}
            </div>

            {/* Draggable Divider Handle */}
            <div
              onPointerDown={handleSplitPointerDown}
              onDoubleClick={handleSplitDoubleClick}
              className={`relative flex items-center justify-center w-2.5 cursor-col-resize select-none touch-none z-40 group transition-colors ${
                isDraggingSplit ? 'bg-brand-primary/50' : 'bg-canvas-border hover:bg-brand-primary/60'
              }`}
              title="Drag to resize (Double-click to reset)"
            >
              {/* Visual Center Grip Indicator */}
              <div
                className={`w-0.5 h-7 rounded-full transition-colors pointer-events-none ${
                  isDraggingSplit ? 'bg-brand-primary' : 'bg-slate-400/60 group-hover:bg-brand-primary'
                }`}
              />
            </div>

            {/* Right Markdown Preview Pane */}
            <div className="h-full min-h-0 flex-1 overflow-hidden min-w-0">
              <MarkdownPreview
                content={code}
                theme={theme}
                scrollTarget={previewScrollTarget}
              />
            </div>

            {/* Transparent drag overlay to prevent event hijacking during drag */}
            {isDraggingSplit && (
              <div className="absolute inset-0 z-30 cursor-col-resize select-none bg-transparent" />
            )}
          </div>
        ) : (
          editorElement
        )}

        {/* Floating Syntax Diagnostics Panel & Badge */}
        {!isDiffMode && (
          <SyntaxDiagnosticsBar
            language={language}
            diagnostics={diagnostics}
            onNavigateToError={handleNavigateToError}
            onApplyQuickFix={handleApplyQuickFix}
            isExpanded={isDiagnosticsExpanded}
            onExpandedChange={onDiagnosticsExpandedChange}
            isDismissed={isDiagnosticsDismissed}
            onDismissedChange={onDiagnosticsDismissedChange}
          />
        )}
      </div>

      {/* Zero-Config Smart Outline Panel */}
      {showSmartOutline && (
        <SmartOutlinePanel
          segments={segments}
          activeLine={activeLine}
          onSelectSegment={handleSelectOutlineSegment}
          onFoldAllBlocks={handleFoldAllBlocks}
          onExpandAllBlocks={handleExpandAllBlocks}
          onClose={() => onOutlineClose?.()}
        />
      )}
    </div>
  );
};
