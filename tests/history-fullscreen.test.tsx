// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HistoryDrawer, VersionItem } from '../src/components/HistoryDrawer';

describe('Dedicated Full-Screen History Workspace (Scheme 2)', () => {
  const sampleVersions: VersionItem[] = [
    {
      id: 'v-2',
      versionNo: 2,
      title: 'config.json',
      code: '{\n  "version": 2\n}',
      commitMsg: 'Update version to 2',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'v-1',
      versionNo: 1,
      title: 'config.json',
      code: '{\n  "version": 1\n}',
      commitMsg: 'Initial snapshot',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  it('renders dedicated full-screen layout with theme colors and zero backdrop blur', () => {
    const { container } = render(
      <HistoryDrawer
        isOpen={true}
        onClose={vi.fn()}
        versions={sampleVersions}
        selectedVersionA={null}
        selectedVersionB={null}
        onCompareWithCurrent={vi.fn()}
        onCompareTwoVersions={vi.fn()}
        onClearCustomDiff={vi.fn()}
        onRevertToVersion={vi.fn()}
        documentTitle="config.json"
        language="json"
        currentDraftCode='{\n  "version": 3\n}'
        theme="vs-dark"
      />
    );

    // Root modal container is full screen and uses theme background
    const root = container.firstElementChild as HTMLElement;
    expect(root).toBeDefined();
    expect(root.className).toContain('fixed inset-0');
    expect(root.className).toContain('bg-canvas-default');
    // Ensure no blurred backdrop overlay
    expect(root.className).not.toContain('backdrop-blur');

    // Header has document title and comparison context badge
    expect(screen.getByText('Revision History')).toBeDefined();
    expect(screen.getByText('config.json')).toBeDefined();
    expect(screen.getByText(/v2 ↔ Current Draft/)).toBeDefined();

    // Side-by-side & inline view toggles exist
    expect(screen.getByTitle('Side by side diff')).toBeDefined();
    expect(screen.getByTitle('Inline diff')).toBeDefined();

    // Global Restore action is present in header
    expect(screen.getByText('Restore v2')).toBeDefined();

    // Close button directly uses X icon with no redundant text
    const closeBtn = screen.getByTitle('Close (Esc)');
    expect(closeBtn).toBeDefined();
    expect(closeBtn.querySelector('svg')).toBeDefined();
  });

  it('removes redundant Diff Draft and Restore buttons from version cards', () => {
    render(
      <HistoryDrawer
        isOpen={true}
        onClose={vi.fn()}
        versions={sampleVersions}
        selectedVersionA={null}
        selectedVersionB={null}
        onCompareWithCurrent={vi.fn()}
        onCompareTwoVersions={vi.fn()}
        onClearCustomDiff={vi.fn()}
        onRevertToVersion={vi.fn()}
        documentTitle="config.json"
      />
    );

    // No redundant buttons inside timeline cards
    expect(screen.queryByText('Diff Draft')).toBeNull();
    expect(screen.queryByText('Restore v1 to Draft')).toBeNull();
  });

  it('clicking version card triggers onCompareWithCurrent directly', () => {
    const onCompare = vi.fn();
    render(
      <HistoryDrawer
        isOpen={true}
        onClose={vi.fn()}
        versions={sampleVersions}
        selectedVersionA={sampleVersions[0]}
        selectedVersionB={null}
        onCompareWithCurrent={onCompare}
        onCompareTwoVersions={vi.fn()}
        onClearCustomDiff={vi.fn()}
        onRevertToVersion={vi.fn()}
        documentTitle="config.json"
      />
    );

    // Click on version 1 card
    const v1Card = screen.getByText('Initial snapshot').closest('.cursor-pointer')!;
    expect(v1Card).toBeDefined();
    fireEvent.click(v1Card);
    expect(onCompare).toHaveBeenCalledWith(sampleVersions[1]);
  });

  it('toggles 2-version comparison when checking checkboxes', () => {
    const onCompareTwo = vi.fn();
    render(
      <HistoryDrawer
        isOpen={true}
        onClose={vi.fn()}
        versions={sampleVersions}
        selectedVersionA={sampleVersions[0]}
        selectedVersionB={null}
        onCompareWithCurrent={vi.fn()}
        onCompareTwoVersions={onCompareTwo}
        onClearCustomDiff={vi.fn()}
        onRevertToVersion={vi.fn()}
        documentTitle="config.json"
      />
    );

    // Checkbox for version 1
    const v1Checkbox = screen.getByTitle('Select for 2-version comparison');
    fireEvent.click(v1Checkbox);
    expect(onCompareTwo).toHaveBeenCalledWith(sampleVersions[1], sampleVersions[0]);
  });

  it('closes full-screen history mode on Escape key and close X icon', () => {
    const handleClose = vi.fn();
    render(
      <HistoryDrawer
        isOpen={true}
        onClose={handleClose}
        versions={sampleVersions}
        selectedVersionA={null}
        selectedVersionB={null}
        onCompareWithCurrent={vi.fn()}
        onCompareTwoVersions={vi.fn()}
        onClearCustomDiff={vi.fn()}
        onRevertToVersion={vi.fn()}
      />
    );

    const closeBtn = screen.getByTitle('Close (Esc)');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
