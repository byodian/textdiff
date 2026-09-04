export interface EditorThemeOption {
  id: string;
  name: string;
  type: 'dark' | 'light';
  file?: string; // filename in /monaco-themes/<file>.json (undefined for built-ins)
}

export const BUILTIN_THEMES: EditorThemeOption[] = [
  { id: 'vs-dark', name: 'VS Dark (Default)', type: 'dark' },
  { id: 'vs', name: 'VS Light', type: 'light' },
  { id: 'hc-black', name: 'High Contrast Dark', type: 'dark' },
];

export const POPULAR_THEMES: EditorThemeOption[] = [
  // GitHub
  { id: 'github-dark', name: 'GitHub Dark', type: 'dark', file: 'GitHub Dark.json' },
  { id: 'github-light', name: 'GitHub Light', type: 'light', file: 'GitHub Light.json' },
  // Dracula & Monokai
  { id: 'dracula', name: 'Dracula', type: 'dark', file: 'Dracula.json' },
  { id: 'monokai', name: 'Monokai', type: 'dark', file: 'Monokai.json' },
  { id: 'monokai-bright', name: 'Monokai Bright', type: 'dark', file: 'Monokai Bright.json' },
  // Nord & Night Owl
  { id: 'nord', name: 'Nord', type: 'dark', file: 'Nord.json' },
  { id: 'night-owl', name: 'Night Owl', type: 'dark', file: 'Night Owl.json' },
  { id: 'cobalt2', name: 'Cobalt2', type: 'dark', file: 'Cobalt2.json' },
  { id: 'oceanic-next', name: 'Oceanic Next', type: 'dark', file: 'Oceanic Next.json' },
  // Solarized
  { id: 'solarized-dark', name: 'Solarized Dark', type: 'dark', file: 'Solarized-dark.json' },
  { id: 'solarized-light', name: 'Solarized Light', type: 'light', file: 'Solarized-light.json' },
  // Tomorrow & Twilight
  { id: 'tomorrow-night', name: 'Tomorrow Night', type: 'dark', file: 'Tomorrow-Night.json' },
  { id: 'tomorrow-night-blue', name: 'Tomorrow Night Blue', type: 'dark', file: 'Tomorrow-Night-Blue.json' },
  { id: 'tomorrow', name: 'Tomorrow (Light)', type: 'light', file: 'Tomorrow.json' },
  { id: 'twilight', name: 'Twilight', type: 'dark', file: 'Twilight.json' },
  // Classical Light
  { id: 'chrome-devtools', name: 'Chrome DevTools', type: 'light', file: 'Chrome DevTools.json' },
  { id: 'xcode-default', name: 'Xcode Default', type: 'light', file: 'Xcode_default.json' },
  { id: 'clouds', name: 'Clouds (Light)', type: 'light', file: 'Clouds.json' },
  { id: 'clouds-midnight', name: 'Clouds Midnight', type: 'dark', file: 'Clouds Midnight.json' },
  // Others
  { id: 'blackboard', name: 'Blackboard', type: 'dark', file: 'Blackboard.json' },
  { id: 'zenburnesque', name: 'Zenburn', type: 'dark', file: 'Zenburnesque.json' },
  { id: 'birds-of-paradise', name: 'Birds of Paradise', type: 'dark', file: 'Birds of Paradise.json' },
  { id: 'active4d', name: 'Active4D (Light)', type: 'light', file: 'Active4D.json' },
];

export const ALL_THEMES: EditorThemeOption[] = [
  ...BUILTIN_THEMES,
  ...POPULAR_THEMES,
];

const loadedThemes = new Set<string>();

export interface MonacoThemeInstance {
  editor: {
    setTheme: (theme: string) => void;
    defineTheme: (themeName: string, themeData: unknown) => void;
  };
}

/**
 * Loads and defines a custom theme in Monaco Editor if not already loaded.
 */
export async function applyMonacoTheme(monaco: MonacoThemeInstance | null | undefined, themeId: string): Promise<void> {
  if (!monaco || !monaco.editor) return;

  if (themeId === 'vs-dark' || themeId === 'vs' || themeId === 'hc-black') {
    monaco.editor.setTheme(themeId);
    return;
  }

  const found = POPULAR_THEMES.find((t) => t.id === themeId);
  if (!found || !found.file) {
    monaco.editor.setTheme('vs-dark');
    return;
  }

  if (loadedThemes.has(themeId)) {
    monaco.editor.setTheme(themeId);
    return;
  }

  try {
    const res = await fetch(`/monaco-themes/${encodeURIComponent(found.file)}`);
    if (res.ok) {
      const themeData = await res.json();
      monaco.editor.defineTheme(themeId, themeData);
      loadedThemes.add(themeId);
      monaco.editor.setTheme(themeId);
    } else {
      monaco.editor.setTheme('vs-dark');
    }
  } catch (err) {
    console.error(`Failed to load Monaco theme: ${themeId}`, err);
    monaco.editor.setTheme('vs-dark');
  }
}
