// Calculates website UI colors based on theme type and theme definition

export interface UiThemeColors {
  bgDefault: string;
  bgElevated: string;
  bgSurface: string;
  border: string;
  highlight: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  brandPrimary: string;
  isLight: boolean;
}

// Built-in presets for instant response, plus dynamic generator from editor.background
export const PRESET_THEME_COLORS: Record<string, Partial<UiThemeColors>> = {
  'vs-dark': {
    bgDefault: '#0b0f19',
    bgElevated: '#111827',
    bgSurface: '#161e2e',
    border: '#1f293d',
    highlight: '#28354f',
    textPrimary: '#f8fafc',
    textSecondary: '#cbd5e1',
    textMuted: '#64748b',
    brandPrimary: '#38bdf8',
    isLight: false,
  },
  'vs': {
    bgDefault: '#f8fafc',
    bgElevated: '#ffffff',
    bgSurface: '#f1f5f9',
    border: '#e2e8f0',
    highlight: '#cbd5e1',
    textPrimary: '#0f172a',
    textSecondary: '#334155',
    textMuted: '#64748b',
    brandPrimary: '#0284c7',
    isLight: true,
  },
  'hc-black': {
    bgDefault: '#000000',
    bgElevated: '#0a0a0a',
    bgSurface: '#141414',
    border: '#262626',
    highlight: '#404040',
    textPrimary: '#ffffff',
    textSecondary: '#e5e5e5',
    textMuted: '#a3a3a3',
    brandPrimary: '#38bdf8',
    isLight: false,
  },
  'github-light': {
    bgDefault: '#f6f8fa',
    bgElevated: '#ffffff',
    bgSurface: '#eaeef2',
    border: '#d0d7de',
    highlight: '#afb8c1',
    textPrimary: '#24292f',
    textSecondary: '#57606a',
    textMuted: '#6e7781',
    brandPrimary: '#0969da',
    isLight: true,
  },
  'github-dark': {
    bgDefault: '#0d1117',
    bgElevated: '#161b22',
    bgSurface: '#21262d',
    border: '#30363d',
    highlight: '#3b434d',
    textPrimary: '#c9d1d9',
    textSecondary: '#8b949e',
    textMuted: '#6e7681',
    brandPrimary: '#58a6ff',
    isLight: false,
  },
  'dracula': {
    bgDefault: '#21222c',
    bgElevated: '#282a36',
    bgSurface: '#343746',
    border: '#44475a',
    highlight: '#6272a4',
    textPrimary: '#f8f8f2',
    textSecondary: '#bd93f9',
    textMuted: '#6272a4',
    brandPrimary: '#ff79c6',
    isLight: false,
  },
  'monokai': {
    bgDefault: '#1e1f1c',
    bgElevated: '#272822',
    bgSurface: '#3e3d32',
    border: '#49483e',
    highlight: '#75715e',
    textPrimary: '#f8f8f2',
    textSecondary: '#e6db74',
    textMuted: '#75715e',
    brandPrimary: '#a6e22e',
    isLight: false,
  },
  'nord': {
    bgDefault: '#242933',
    bgElevated: '#2e3440',
    bgSurface: '#3b4252',
    border: '#434c5e',
    highlight: '#4c566a',
    textPrimary: '#eceff4',
    textSecondary: '#e5e9f0',
    textMuted: '#d8dee9',
    brandPrimary: '#88c0d0',
    isLight: false,
  },
  'solarized-dark': {
    bgDefault: '#00212b',
    bgElevated: '#002b36',
    bgSurface: '#073642',
    border: '#0d4a58',
    highlight: '#586e75',
    textPrimary: '#93a1a1',
    textSecondary: '#839496',
    textMuted: '#657b83',
    brandPrimary: '#268bd2',
    isLight: false,
  },
  'solarized-light': {
    bgDefault: '#fdf6e3',
    bgElevated: '#eee8d5',
    bgSurface: '#e0d6be',
    border: '#d3c6aa',
    highlight: '#93a1a1',
    textPrimary: '#586e75',
    textSecondary: '#657b83',
    textMuted: '#839496',
    brandPrimary: '#268bd2',
    isLight: true,
  },
  'chrome-devtools': {
    bgDefault: '#f3f3f3',
    bgElevated: '#ffffff',
    bgSurface: '#ececec',
    border: '#d0d0d0',
    highlight: '#c0c0c0',
    textPrimary: '#222222',
    textSecondary: '#555555',
    textMuted: '#777777',
    brandPrimary: '#1a73e8',
    isLight: true,
  },
  'night-owl': {
    bgDefault: '#01111d',
    bgElevated: '#011627',
    bgSurface: '#0b2942',
    border: '#1d3b53',
    highlight: '#5f7e97',
    textPrimary: '#d6deeb',
    textSecondary: '#addb67',
    textMuted: '#5f7e97',
    brandPrimary: '#82aaff',
    isLight: false,
  },
};

export function getUiThemeColors(themeId: string, isLight: boolean): UiThemeColors {
  const preset = PRESET_THEME_COLORS[themeId];
  if (preset) {
    return {
      bgDefault: preset.bgDefault || (isLight ? '#f8fafc' : '#0b0f19'),
      bgElevated: preset.bgElevated || (isLight ? '#ffffff' : '#111827'),
      bgSurface: preset.bgSurface || (isLight ? '#f1f5f9' : '#161e2e'),
      border: preset.border || (isLight ? '#e2e8f0' : '#1f293d'),
      highlight: preset.highlight || (isLight ? '#cbd5e1' : '#28354f'),
      textPrimary: preset.textPrimary || (isLight ? '#0f172a' : '#f8fafc'),
      textSecondary: preset.textSecondary || (isLight ? '#334155' : '#cbd5e1'),
      textMuted: preset.textMuted || '#64748b',
      brandPrimary: preset.brandPrimary || (isLight ? '#0284c7' : '#38bdf8'),
      isLight,
    };
  }

  // Fallback defaults according to light or dark
  if (isLight) {
    return {
      bgDefault: '#f8fafc',
      bgElevated: '#ffffff',
      bgSurface: '#f1f5f9',
      border: '#e2e8f0',
      highlight: '#cbd5e1',
      textPrimary: '#0f172a',
      textSecondary: '#334155',
      textMuted: '#64748b',
      brandPrimary: '#0284c7',
      isLight: true,
    };
  }

  return {
    bgDefault: '#0b0f19',
    bgElevated: '#111827',
    bgSurface: '#161e2e',
    border: '#1f293d',
    highlight: '#28354f',
    textPrimary: '#f8fafc',
    textSecondary: '#cbd5e1',
    textMuted: '#64748b',
    brandPrimary: '#38bdf8',
    isLight: false,
  };
}

/**
 * Injects CSS custom properties to the document root (:root)
 * so that all Tailwind colors (bg-canvas, bg-canvas-elevated, border-canvas-border, etc.)
 * update smoothly across the entire application.
 */
export function applyGlobalThemeColors(themeId: string, isLight: boolean): void {
  if (typeof document === 'undefined') return;

  const colors = getUiThemeColors(themeId, isLight);
  const root = document.documentElement;

  root.style.setProperty('--color-canvas-default', colors.bgDefault);
  root.style.setProperty('--color-canvas-elevated', colors.bgElevated);
  root.style.setProperty('--color-canvas-surface', colors.bgSurface);
  root.style.setProperty('--color-canvas-border', colors.border);
  root.style.setProperty('--color-canvas-highlight', colors.highlight);
  root.style.setProperty('--color-brand-primary', colors.brandPrimary);
  root.style.setProperty('--color-text-primary', colors.textPrimary);
  root.style.setProperty('--color-text-secondary', colors.textSecondary);
  root.style.setProperty('--color-text-muted', colors.textMuted);
  root.style.setProperty('--foreground', colors.textPrimary);
  root.style.setProperty('--background', colors.bgDefault);

  if (colors.isLight) {
    root.classList.add('light-theme');
    root.classList.remove('dark-theme');
  } else {
    root.classList.add('dark-theme');
    root.classList.remove('light-theme');
  }
}
