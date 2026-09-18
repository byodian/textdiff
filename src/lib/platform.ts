import { useState, useEffect } from 'react';

export type Platform = 'windows' | 'linux' | 'mac';

export type ShortcutAction =
  | 'save'
  | 'new'
  | 'commandPalette'
  | 'format'
  | 'editorPalette'
  | 'diffPrev'
  | 'diffNext'
  | 'esc';

let platformOverride: Platform | null = null;

/**
 * Detect the current operating system platform (macOS, Windows, or Linux).
 * Supports platformOverride for testing and deterministic environments.
 */
export function getPlatform(): Platform {
  if (platformOverride) {
    return platformOverride;
  }

  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'windows';
  }

  const nav = navigator as any;
  const platformStr = `${nav.userAgentData?.platform || ''} ${nav.platform || ''} ${nav.userAgent || ''}`.toLowerCase();

  if (
    platformStr.includes('mac') ||
    platformStr.includes('darwin') ||
    platformStr.includes('iphone') ||
    platformStr.includes('ipad')
  ) {
    return 'mac';
  }

  if (platformStr.includes('win')) {
    return 'windows';
  }

  if (platformStr.includes('linux') || platformStr.includes('x11')) {
    return 'linux';
  }

  return 'windows';
}

/**
 * Override platform for unit testing and deterministic checks.
 */
export function setPlatformOverride(platform: Platform | null) {
  platformOverride = platform;
}

export const SHORTCUT_DEFINITIONS: Record<Platform, Record<ShortcutAction, string>> = {
  mac: {
    save: '⌘S',
    new: '⌥⌘N',
    commandPalette: '⇧⌘P',
    format: '⇧⌥F',
    editorPalette: 'F1',
    diffPrev: '⇧F7',
    diffNext: 'F7',
    esc: 'Esc',
  },
  windows: {
    save: 'Ctrl+S',
    new: 'Ctrl+Alt+N',
    commandPalette: 'Ctrl+Shift+P',
    format: 'Shift+Alt+F',
    editorPalette: 'F1',
    diffPrev: 'Shift+F7',
    diffNext: 'F7',
    esc: 'Esc',
  },
  linux: {
    save: 'Ctrl+S',
    new: 'Ctrl+Alt+N',
    commandPalette: 'Ctrl+Shift+P',
    format: 'Ctrl+Shift+I',
    editorPalette: 'F1',
    diffPrev: 'Shift+F7',
    diffNext: 'F7',
    esc: 'Esc',
  },
};

/**
 * Get the localized shortcut label for a given action on a target platform.
 * If platform is omitted, dynamically detects the current platform.
 */
export function getShortcutLabel(action: ShortcutAction, platform?: Platform): string {
  const currentPlatform = platform ?? getPlatform();
  return SHORTCUT_DEFINITIONS[currentPlatform][action];
}

/**
 * React hook for components that want reactive platform state.
 */
export function usePlatform(): Platform {
  const [platform, setPlatform] = useState<Platform>(() => getPlatform());

  useEffect(() => {
    setPlatform(getPlatform());
  }, []);

  return platform;
}

/**
 * React hook to retrieve a shortcut label for the current platform.
 */
export function useShortcutLabel(action: ShortcutAction): string {
  const platform = usePlatform();
  return getShortcutLabel(action, platform);
}
