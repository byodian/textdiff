import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getPlatform,
  getShortcutLabel,
  setPlatformOverride,
  SHORTCUT_DEFINITIONS,
  Platform,
  ShortcutAction,
} from '../src/lib/platform';

describe('Platform-aware Keyboard Shortcuts & Labels', () => {
  beforeEach(() => {
    setPlatformOverride(null);
  });

  afterEach(() => {
    setPlatformOverride(null);
  });

  it('provides dedicated single-platform shortcuts without multi-platform slashes', () => {
    const platforms: Platform[] = ['mac', 'windows', 'linux'];
    const actions: ShortcutAction[] = [
      'save',
      'new',
      'commandPalette',
      'format',
      'editorPalette',
      'diffPrev',
      'diffNext',
      'esc',
    ];

    for (const platform of platforms) {
      for (const action of actions) {
        const label = getShortcutLabel(action, platform);
        expect(label).toBeTruthy();
        // Crucial requirement: must NOT display multiple platforms like "Ctrl+S / ⌘S"
        expect(label).not.toContain(' / ');
        expect(label).not.toContain(' or ');
      }
    }
  });

  it('differentiates macOS symbols from Windows and Linux', () => {
    expect(getShortcutLabel('save', 'mac')).toBe('⌘S');
    expect(getShortcutLabel('new', 'mac')).toBe('⌥⌘N');
    expect(getShortcutLabel('commandPalette', 'mac')).toBe('⇧⌘P');
    expect(getShortcutLabel('format', 'mac')).toBe('⇧⌥F');
    expect(getShortcutLabel('diffPrev', 'mac')).toBe('⇧F7');
    expect(getShortcutLabel('diffNext', 'mac')).toBe('F7');
    expect(getShortcutLabel('esc', 'mac')).toBe('Esc');
  });

  it('differentiates Windows shortcuts using Ctrl and Shift+Alt+F for format', () => {
    expect(getShortcutLabel('save', 'windows')).toBe('Ctrl+S');
    expect(getShortcutLabel('new', 'windows')).toBe('Ctrl+Alt+N');
    expect(getShortcutLabel('commandPalette', 'windows')).toBe('Ctrl+Shift+P');
    expect(getShortcutLabel('format', 'windows')).toBe('Shift+Alt+F');
    expect(getShortcutLabel('diffPrev', 'windows')).toBe('Shift+F7');
    expect(getShortcutLabel('diffNext', 'windows')).toBe('F7');
    expect(getShortcutLabel('esc', 'windows')).toBe('Esc');
  });

  it('differentiates Linux shortcuts using Ctrl and Ctrl+Shift+I for format', () => {
    expect(getShortcutLabel('save', 'linux')).toBe('Ctrl+S');
    expect(getShortcutLabel('new', 'linux')).toBe('Ctrl+Alt+N');
    expect(getShortcutLabel('commandPalette', 'linux')).toBe('Ctrl+Shift+P');
    expect(getShortcutLabel('format', 'linux')).toBe('Ctrl+Shift+I');
    expect(getShortcutLabel('diffPrev', 'linux')).toBe('Shift+F7');
    expect(getShortcutLabel('diffNext', 'linux')).toBe('F7');
    expect(getShortcutLabel('esc', 'linux')).toBe('Esc');
  });

  it('supports setPlatformOverride for deterministic testing', () => {
    setPlatformOverride('mac');
    expect(getPlatform()).toBe('mac');
    expect(getShortcutLabel('save')).toBe('⌘S');

    setPlatformOverride('linux');
    expect(getPlatform()).toBe('linux');
    expect(getShortcutLabel('format')).toBe('Ctrl+Shift+I');

    setPlatformOverride('windows');
    expect(getPlatform()).toBe('windows');
    expect(getShortcutLabel('format')).toBe('Shift+Alt+F');
  });
});
