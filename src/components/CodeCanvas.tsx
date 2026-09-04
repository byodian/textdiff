'use client';

import React from 'react';
import Editor, { DiffEditor, loader, DiffOnMount } from '@monaco-editor/react';
import { MarkdownPreview } from './MarkdownPreview';

loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs',
  },
});

export type MonacoEditorInstance = {
  getAction: (id: string) => { run: () => void } | null;
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
  isDiffMode,
  isSideBySide,
  markdownViewMode = 'edit',
  onCodeChange,
  editorRef,
  diffEditorRef,
}) => {
  const handleEditorDidMount = (editor: MonacoEditorInstance) => {
    editorRef.current = editor;
  };

  const handleDiffEditorDidMount: DiffOnMount = (editor) => {
    diffEditorRef.current = editor as unknown as MonacoDiffEditorInstance;
  };

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
      theme="vs-dark"
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
    <div className="flex-1 h-full w-full relative bg-canvas">
      {isDiffMode ? (
        <DiffEditor
          height="100%"
          language={language}
          original={originalCode}
          modified={modifiedValue}
          onMount={handleDiffEditorDidMount}
          theme="vs-dark"
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
        <MarkdownPreview content={code} />
      ) : isMarkdownSplit ? (
        <div className="grid grid-cols-1 md:grid-cols-2 h-full w-full divide-y md:divide-y-0 md:divide-x divide-canvas-border">
          <div className="h-full w-full min-h-0 overflow-hidden">
            {editorElement}
          </div>
          <div className="h-full w-full min-h-0 overflow-hidden">
            <MarkdownPreview content={code} />
          </div>
        </div>
      ) : (
        editorElement
      )}
    </div>
  );
};
