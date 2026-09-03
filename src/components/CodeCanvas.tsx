'use client';

import React from 'react';
import Editor, { DiffEditor, loader, DiffOnMount } from '@monaco-editor/react';

loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs',
  },
});

export type MonacoEditorInstance = {
  getAction: (id: string) => { run: () => void } | null;
};

export type MonacoDiffEditorInstance = {
  getDiffNavigator?: () => { next: () => void; previous: () => void };
  next?: () => void;
  previous?: () => void;
};

interface CodeCanvasProps {
  language: string;
  code: string;
  originalCode: string;
  isDiffMode: boolean;
  isSideBySide: boolean;
  onCodeChange: (val: string) => void;
  editorRef: React.MutableRefObject<MonacoEditorInstance | null>;
  diffEditorRef: React.MutableRefObject<MonacoDiffEditorInstance | null>;
}

export const CodeCanvas: React.FC<CodeCanvasProps> = ({
  language,
  code,
  originalCode,
  isDiffMode,
  isSideBySide,
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

  return (
    <div className="flex-1 h-full w-full relative bg-canvas">
      {isDiffMode ? (
        <DiffEditor
          height="100%"
          language={language}
          original={originalCode}
          modified={code}
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
      ) : (
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
            wordWrap: 'off',
            formatOnPaste: true,
            formatOnType: true,
            suggestOnTriggerCharacters: true,
          }}
        />
      )}
    </div>
  );
};
