// Calculates website UI colors based on theme type and theme definition

export interface UiThemeColors {
  editorBg: string;
  editorFg: string;
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

// Built-in presets for all available editor themes
export const PRESET_THEME_COLORS: Record<string, Partial<UiThemeColors>> = {
  // Builtin
  'vs-dark': {
    editorBg: '#1e1e1e',
    editorFg: '#d4d4d4',
    bgDefault: '#181818',
    bgElevated: '#1f1f1f',
    bgSurface: '#252526',
    border: '#333333',
    highlight: '#3c3c3c',
    textPrimary: '#f8fafc',
    textSecondary: '#cccccc',
    textMuted: '#858585',
    brandPrimary: '#38bdf8',
    isLight: false,
  },
  'vs': {
    editorBg: '#ffffff',
    editorFg: '#000000',
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
    editorBg: '#000000',
    editorFg: '#ffffff',
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
  // GitHub
  'github-light': {
    editorBg: '#ffffff',
    editorFg: '#24292e',
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
    editorBg: '#24292e',
    editorFg: '#f6f8fa',
    bgDefault: '#1f2428',
    bgElevated: '#24292e',
    bgSurface: '#2b3137',
    border: '#444d56',
    highlight: '#39414a',
    textPrimary: '#f6f8fa',
    textSecondary: '#d1d5da',
    textMuted: '#959da5',
    brandPrimary: '#58a6ff',
    isLight: false,
  },
  // Dracula & Monokai
  'dracula': {
    editorBg: '#282a36',
    editorFg: '#f8f8f2',
    bgDefault: '#21222c',
    bgElevated: '#282a36',
    bgSurface: '#343746',
    border: '#44475a',
    highlight: '#6272a4',
    textPrimary: '#f8f8f2',
    textSecondary: '#f1fa8c',
    textMuted: '#6272a4',
    brandPrimary: '#ff79c6',
    isLight: false,
  },
  'monokai': {
    editorBg: '#272822',
    editorFg: '#f8f8f2',
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
  'monokai-bright': {
    editorBg: '#272822',
    editorFg: '#f8f8f2',
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
  // Nord & Night Owl
  'nord': {
    editorBg: '#2e3440',
    editorFg: '#d8dee9',
    bgDefault: '#242933',
    bgElevated: '#2e3440',
    bgSurface: '#3b4252',
    border: '#434c5e',
    highlight: '#4c566a',
    textPrimary: '#eceff4',
    textSecondary: '#e5e9f0',
    textMuted: '#88c0d0',
    brandPrimary: '#88c0d0',
    isLight: false,
  },
  'night-owl': {
    editorBg: '#011627',
    editorFg: '#d6deeb',
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
  'cobalt2': {
    editorBg: '#193549',
    editorFg: '#ffffff',
    bgDefault: '#122738',
    bgElevated: '#193549',
    bgSurface: '#1f4662',
    border: '#274e6c',
    highlight: '#0088ff',
    textPrimary: '#ffffff',
    textSecondary: '#ffc600',
    textMuted: '#0088ff',
    brandPrimary: '#ffc600',
    isLight: false,
  },
  'oceanic-next': {
    editorBg: '#1b2b34',
    editorFg: '#cdd3de',
    bgDefault: '#16242c',
    bgElevated: '#1b2b34',
    bgSurface: '#253944',
    border: '#343d46',
    highlight: '#4f5b66',
    textPrimary: '#d8dee9',
    textSecondary: '#99c794',
    textMuted: '#65737e',
    brandPrimary: '#6699cc',
    isLight: false,
  },
  // Solarized
  'solarized-dark': {
    editorBg: '#002b36',
    editorFg: '#839496',
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
    editorBg: '#fdf6e3',
    editorFg: '#586e75',
    bgDefault: '#f5edd6',
    bgElevated: '#fdf6e3',
    bgSurface: '#eee8d5',
    border: '#d3c6aa',
    highlight: '#93a1a1',
    textPrimary: '#586e75',
    textSecondary: '#657b83',
    textMuted: '#839496',
    brandPrimary: '#268bd2',
    isLight: true,
  },
  // Tomorrow & Twilight
  'tomorrow-night': {
    editorBg: '#1d1f21',
    editorFg: '#c5c8c6',
    bgDefault: '#181a1b',
    bgElevated: '#1d1f21',
    bgSurface: '#282a2e',
    border: '#373b41',
    highlight: '#4b5059',
    textPrimary: '#c5c8c6',
    textSecondary: '#b4b7b4',
    textMuted: '#969896',
    brandPrimary: '#81a2be',
    isLight: false,
  },
  'tomorrow-night-blue': {
    editorBg: '#002451',
    editorFg: '#ffffff',
    bgDefault: '#001c3f',
    bgElevated: '#002451',
    bgSurface: '#00316e',
    border: '#003f8e',
    highlight: '#004a9e',
    textPrimary: '#ffffff',
    textSecondary: '#99ffff',
    textMuted: '#7285b7',
    brandPrimary: '#99ffff',
    isLight: false,
  },
  'tomorrow': {
    editorBg: '#ffffff',
    editorFg: '#4d4d4c',
    bgDefault: '#f6f6f6',
    bgElevated: '#ffffff',
    bgSurface: '#efefef',
    border: '#d6d6d6',
    highlight: '#c0c0c0',
    textPrimary: '#4d4d4c',
    textSecondary: '#8e908c',
    textMuted: '#a0a0a0',
    brandPrimary: '#4271ae',
    isLight: true,
  },
  'twilight': {
    editorBg: '#141414',
    editorFg: '#f8f8f8',
    bgDefault: '#0f0f0f',
    bgElevated: '#141414',
    bgSurface: '#232323',
    border: '#323232',
    highlight: '#454545',
    textPrimary: '#f8f8f8',
    textSecondary: '#cda869',
    textMuted: '#757a84',
    brandPrimary: '#cda869',
    isLight: false,
  },
  // Classical Light
  'chrome-devtools': {
    editorBg: '#ffffff',
    editorFg: '#222222',
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
  'xcode-default': {
    editorBg: '#ffffff',
    editorFg: '#000000',
    bgDefault: '#f6f8fa',
    bgElevated: '#ffffff',
    bgSurface: '#edf0f4',
    border: '#dcdfe4',
    highlight: '#c5cad2',
    textPrimary: '#000000',
    textSecondary: '#333333',
    textMuted: '#666666',
    brandPrimary: '#007aff',
    isLight: true,
  },
  'clouds': {
    editorBg: '#ffffff',
    editorFg: '#000000',
    bgDefault: '#f5f7fa',
    bgElevated: '#ffffff',
    bgSurface: '#edf1f5',
    border: '#d8dde4',
    highlight: '#c3cbd4',
    textPrimary: '#000000',
    textSecondary: '#444444',
    textMuted: '#666666',
    brandPrimary: '#3b82f6',
    isLight: true,
  },
  'clouds-midnight': {
    editorBg: '#191919',
    editorFg: '#929292',
    bgDefault: '#131313',
    bgElevated: '#191919',
    bgSurface: '#242424',
    border: '#333333',
    highlight: '#444444',
    textPrimary: '#d4d4d4',
    textSecondary: '#929292',
    textMuted: '#666666',
    brandPrimary: '#3b82f6',
    isLight: false,
  },
  // Others
  'blackboard': {
    editorBg: '#0c1021',
    editorFg: '#f8f8f8',
    bgDefault: '#080a17',
    bgElevated: '#0c1021',
    bgSurface: '#141b36',
    border: '#222b4c',
    highlight: '#323f6c',
    textPrimary: '#f8f8f8',
    textSecondary: '#fbde2d',
    textMuted: '#7f8ab3',
    brandPrimary: '#fbde2d',
    isLight: false,
  },
  'zenburnesque': {
    editorBg: '#404040',
    editorFg: '#dedede',
    bgDefault: '#363636',
    bgElevated: '#404040',
    bgSurface: '#4c4c4c',
    border: '#5c5c5c',
    highlight: '#6e6e6e',
    textPrimary: '#dedede',
    textSecondary: '#dfaf8f',
    textMuted: '#7f9f7f',
    brandPrimary: '#dfaf8f',
    isLight: false,
  },
  'birds-of-paradise': {
    editorBg: '#372725',
    editorFg: '#e6e1c4',
    bgDefault: '#2c1e1c',
    bgElevated: '#372725',
    bgSurface: '#453330',
    border: '#584340',
    highlight: '#6b5450',
    textPrimary: '#e6e1c4',
    textSecondary: '#ef5205',
    textMuted: '#8a6e6a',
    brandPrimary: '#ef5205',
    isLight: false,
  },
  'active4d': {
    editorBg: '#ffffff',
    editorFg: '#3b3b3b',
    bgDefault: '#f8f9fa',
    bgElevated: '#ffffff',
    bgSurface: '#f1f3f5',
    border: '#dee2e6',
    highlight: '#ced4da',
    textPrimary: '#3b3b3b',
    textSecondary: '#495057',
    textMuted: '#868e96',
    brandPrimary: '#228be6',
    isLight: true,
  },
};

export function getUiThemeColors(themeId: string, isLight: boolean): UiThemeColors {
  const preset = PRESET_THEME_COLORS[themeId];
  if (preset) {
    const editorBg = preset.editorBg || (isLight ? '#ffffff' : '#1e1e1e');
    const editorFg = preset.editorFg || (isLight ? '#0f172a' : '#f8fafc');
    return {
      editorBg,
      editorFg,
      bgDefault: preset.bgDefault || editorBg,
      bgElevated: preset.bgElevated || (isLight ? '#ffffff' : '#111827'),
      bgSurface: preset.bgSurface || (isLight ? '#f1f5f9' : '#161e2e'),
      border: preset.border || (isLight ? '#e2e8f0' : '#1f293d'),
      highlight: preset.highlight || (isLight ? '#cbd5e1' : '#28354f'),
      textPrimary: preset.textPrimary || editorFg,
      textSecondary: preset.textSecondary || (isLight ? '#334155' : '#cbd5e1'),
      textMuted: preset.textMuted || '#64748b',
      brandPrimary: preset.brandPrimary || (isLight ? '#0284c7' : '#38bdf8'),
      isLight,
    };
  }

  // Fallback defaults according to light or dark
  if (isLight) {
    return {
      editorBg: '#ffffff',
      editorFg: '#0f172a',
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
    editorBg: '#1e1e1e',
    editorFg: '#d4d4d4',
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

  root.style.setProperty('--color-editor-bg', colors.editorBg);
  root.style.setProperty('--color-editor-fg', colors.editorFg);
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
    root.style.setProperty('--scrollbar-thumb', 'rgba(55, 53, 47, 0.2)');
    root.style.setProperty('--scrollbar-thumb-hover', 'rgba(55, 53, 47, 0.38)');
    root.style.setProperty('--scrollbar-thumb-active', 'rgba(55, 53, 47, 0.55)');
    root.classList.add('light-theme');
    root.classList.remove('dark-theme');
  } else {
    root.style.setProperty('--scrollbar-thumb', 'rgba(255, 255, 255, 0.18)');
    root.style.setProperty('--scrollbar-thumb-hover', 'rgba(255, 255, 255, 0.35)');
    root.style.setProperty('--scrollbar-thumb-active', 'rgba(255, 255, 255, 0.55)');
    root.classList.add('dark-theme');
    root.classList.remove('light-theme');
  }
}
