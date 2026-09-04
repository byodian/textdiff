'use client';

import React from 'react';
import Editor, { DiffEditor, loader, DiffOnMount, Monaco } from '@monaco-editor/react';
import { MarkdownPreview } from './MarkdownPreview';
import { applyMonacoTheme } from '@/lib/themes';

loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs',
  },
});

export type MonacoEditorInstance = {
  getAction: (id: string) => { run: () => void } | null;
  layout?: () => void;
};

export type MonacoDiffEditorInstance = {
  goToDiff?: (target: 'next' | 'previous') => void;
  getLineChanges?: () => unknown[] | null;
  getModifiedEditor?: () => { getAction: (id: string) => { run: () => void } | null } | null;
  getOriginalEditor?: () => { getAction: (id: string) => { run: () => void } | null } | null;
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
  onCodeChange: (val: string) => void;
  editorRef: React.MutableRefObject<MonacoEditorInstance | null>;
  diffEditorRef: React.MutableRefObject<MonacoDiffEditorInstance | null>;
}

export const CodeCanvas: React.FC<CodeCanvasProps> = ({
  language,
  code,
  originalCode,
  targetCode,
  theme = 'vs-dark',
  isDiffMode,
  isSideBySide,
  markdownViewMode = 'edit',
  onCodeChange,
  editorRef,
  diffEditorRef,
}) => {
  const monacoRef = React.useRef<Monaco | null>(null);

  const handleEditorDidMount = (editor: MonacoEditorInstance, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    applyMonacoTheme(monaco, theme);
  };

  const handleDiffEditorDidMount: DiffOnMount = (editor, monaco) => {
    diffEditorRef.current = editor as unknown as MonacoDiffEditorInstance;
    monacoRef.current = monaco;
    applyMonacoTheme(monaco, theme);
  };

  // Re-apply theme dynamically when theme changes
  React.useEffect(() => {
    if (monacoRef.current) {
      applyMonacoTheme(monacoRef.current, theme);
    }
  }, [theme]);

  const [splitRatio, setSplitRatio] = React.useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('codediff_markdown_split_ratio');
        if (saved) {
          const val = parseFloat(saved);
          if (!isNaN(val) && val >= 0.15 && val <= 0.85) return val;
        }
      } catch {}
    }
    return 0.5;
  });

  const [isDraggingSplit, setIsDraggingSplit] = React.useState(false);
  const splitContainerRef = React.useRef<HTMLDivElement>(null);
  const lastClickTimeRef = React.useRef(0);
  const isPointerDownRef = React.useRef(false);
  const dragStartPosRef = React.useRef({ x: 0, y: 0 });

  const resetSplitRatio = React.useCallback(() => {
    setSplitRatio(0.5);
    lastClickTimeRef.current = 0;
    try {
      localStorage.setItem('codediff_markdown_split_ratio', '0.5');
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
            localStorage.setItem('codediff_markdown_split_ratio', splitRatio.toString());
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
      height="100%"
      language={language}
      value={code}
      onChange={(val) => onCodeChange(val || '')}
      onMount={handleEditorDidMount}
      theme={theme}
      options={{
        minimap: { enabled: false },
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
      }}
    />
  );

  return (
    <div 
      className="flex-1 h-full w-full relative bg-canvas transition-colors duration-150"
      style={{ backgroundColor: 'var(--color-editor-bg, var(--color-canvas-default))' }}
    >
      {isDiffMode ? (
        <DiffEditor
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
          }}
        />
      ) : isMarkdownPreview ? (
        <MarkdownPreview content={code} theme={theme} />
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
            title="Drag to resize (Double-click to reset 50/50)"
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
            <MarkdownPreview content={code} theme={theme} />
          </div>

          {/* Transparent drag overlay to prevent event hijacking during drag */}
          {isDraggingSplit && (
            <div className="absolute inset-0 z-30 cursor-col-resize select-none bg-transparent" />
          )}
        </div>
      ) : (
        editorElement
      )}
    </div>
  );
};
