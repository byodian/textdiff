// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UnsavedChangesModal } from '../src/components/UnsavedChangesModal';
import { DeleteDocumentModal } from '../src/components/DeleteDocumentModal';
import { UndoToast } from '../src/components/UndoToast';
import { DiffInspectorBar } from '../src/components/DiffInspectorBar';
import { WorkspaceEmptyState } from '../src/components/WorkspaceEmptyState';
import { StatusBar } from '../src/components/StatusBar';

describe('TextDiff UX Overhaul Component Seams', () => {
  it('renders UnsavedChangesModal and triggers save/discard/cancel options', () => {
    const onSave = vi.fn();
    const onDiscard = vi.fn();
    const onClose = vi.fn();

    render(
      <UnsavedChangesModal
        isOpen={true}
        documentTitle="config.yml"
        onClose={onClose}
        onSaveAndProceed={onSave}
        onDiscardAndProceed={onDiscard}
      />
    );

    expect(screen.getByText(/Unsaved Changes in Document/i)).toBeDefined();
    expect(screen.getByText('config.yml')).toBeDefined();

    // Discard
    fireEvent.click(screen.getByText('Discard & Switch'));
    expect(onDiscard).toHaveBeenCalledTimes(1);

    // Save & Switch
    fireEvent.click(screen.getByText('Save & Switch'));
    expect(onSave).toHaveBeenCalledTimes(1);

    // Cancel
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders DeleteDocumentModal with snapshot count and irreversible alert', () => {
    const onConfirmDelete = vi.fn();
    const onClose = vi.fn();

    render(
      <DeleteDocumentModal
        isOpen={true}
        documentTitle="orders.sql"
        versionCount={4}
        onClose={onClose}
        onConfirmDelete={onConfirmDelete}
      />
    );

    expect(screen.getByText(/Delete Document/i)).toBeDefined();
    expect(screen.getByText('orders.sql')).toBeDefined();
    expect(screen.getByText(/4 historical version snapshots/i)).toBeDefined();

    fireEvent.click(screen.getByText('Delete Permanently'));
    expect(onConfirmDelete).toHaveBeenCalledTimes(1);
  });

  it('renders UndoToast and handles undo action', () => {
    const onUndo = vi.fn();
    const onDismiss = vi.fn();

    render(
      <UndoToast
        message="Restored v2 to draft buffer."
        onUndo={onUndo}
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByText('Restored v2 to draft buffer.')).toBeDefined();
    const undoBtn = screen.getByText('Undo');
    fireEvent.click(undoBtn);
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders DiffInspectorBar with stats, side-by-side toggle and exit button', () => {
    const onToggleSideBySide = vi.fn();
    const onExitDiff = vi.fn();
    const onNext = vi.fn();
    const onPrev = vi.fn();

    render(
      <DiffInspectorBar
        versionA={{ id: 'v1', versionNo: 1, title: 't', code: 'a', commitMsg: null, createdAt: '' }}
        versionB={null}
        currentVersionNo={2}
        isSideBySide={true}
        diffStats={{ added: 5, removed: 2, hasChanges: true }}
        onToggleSideBySide={onToggleSideBySide}
        onNextDiffChunk={onNext}
        onPrevDiffChunk={onPrev}
        onExitDiff={onExitDiff}
      />
    );

    expect(screen.getByText('v1')).toBeDefined();
    expect(screen.getByText('Working Draft')).toBeDefined();
    expect(screen.getByText('+5')).toBeDefined();
    expect(screen.getByText('-2')).toBeDefined();

    fireEvent.click(screen.getByTitle(/Switch to Unified Inline View/i));
    expect(onToggleSideBySide).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTitle(/Exit Diff Mode/i));
    expect(onExitDiff).toHaveBeenCalledTimes(1);
  });

  it('renders WorkspaceEmptyState and provides starter templates', () => {
    const onNew = vi.fn();
    const onApply = vi.fn();
    const onPaste = vi.fn();

    render(
      <WorkspaceEmptyState
        onNewDocument={onNew}
        onApplyTemplate={onApply}
        onPasteFromClipboard={onPaste}
      />
    );

    expect(screen.getByText('No document selected')).toBeDefined();
    expect(screen.getByText('Nacos Spring Cloud Config')).toBeDefined();
    expect(screen.getByText('MySQL Schema Migration')).toBeDefined();

    fireEvent.click(screen.getByText('MySQL Schema Migration'));
    expect(onApply).toHaveBeenCalledTimes(1);
  });

  it('renders StatusBar with language, line count, and format document action', () => {
    const onFormat = vi.fn();
    const onOpenLanguagePicker = vi.fn();

    render(
      <StatusBar
        language="sql"
        code={"SELECT * FROM users;\nSELECT * FROM orders;"}
        isDiffMode={false}
        onFormatDocument={onFormat}
        onOpenLanguagePicker={onOpenLanguagePicker}
      />
    );

    expect(screen.getByText(/sql/i)).toBeDefined();
    expect(screen.getByText('UTF-8')).toBeDefined();
    expect(screen.getByText(/2 lines/i)).toBeDefined();

    const formatBtn = screen.getByTitle(/Format Document/i);
    fireEvent.click(formatBtn);
    expect(onFormat).toHaveBeenCalledTimes(1);

    const langBtn = screen.getByTitle(/Select Language Mode/i);
    fireEvent.click(langBtn);
    expect(onOpenLanguagePicker).toHaveBeenCalledTimes(1);
  });
});
