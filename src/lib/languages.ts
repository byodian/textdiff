export interface LanguageOption {
  id: string;
  name: string;
  extensions: string[];
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { id: 'typescript', name: 'TypeScript', extensions: ['.ts', '.tsx'] },
  { id: 'javascript', name: 'JavaScript', extensions: ['.js', '.jsx', '.mjs', '.cjs'] },
  { id: 'python', name: 'Python', extensions: ['.py'] },
  { id: 'json', name: 'JSON', extensions: ['.json'] },
  { id: 'yaml', name: 'YAML', extensions: ['.yaml', '.yml'] },
  { id: 'sql', name: 'SQL', extensions: ['.sql'] },
  { id: 'go', name: 'Go', extensions: ['.go'] },
  { id: 'rust', name: 'Rust', extensions: ['.rs'] },
  { id: 'java', name: 'Java', extensions: ['.java'] },
  { id: 'cpp', name: 'C++', extensions: ['.cpp', '.cc', '.cxx', '.hpp', '.h'] },
  { id: 'c', name: 'C', extensions: ['.c'] },
  { id: 'csharp', name: 'C#', extensions: ['.cs'] },
  { id: 'html', name: 'HTML', extensions: ['.html', '.htm'] },
  { id: 'css', name: 'CSS', extensions: ['.css', '.scss', '.less'] },
  { id: 'markdown', name: 'Markdown', extensions: ['.md', '.markdown'] },
  { id: 'shell', name: 'Shell / Bash', extensions: ['.sh', '.bash', '.zsh'] },
  { id: 'diff', name: 'Diff / Patch', extensions: ['.diff', '.patch'] },
  { id: 'xml', name: 'XML / SVG', extensions: ['.xml', '.svg'] },
  { id: 'dockerfile', name: 'Dockerfile', extensions: ['Dockerfile', '.dockerfile'] },
  { id: 'plaintext', name: 'Plain Text', extensions: ['.txt', '.log'] },
];

export function detectLanguageFromFilename(filename: string, fallback = 'plaintext'): string {
  if (!filename) return fallback;
  const lower = filename.toLowerCase();

  for (const lang of SUPPORTED_LANGUAGES) {
    for (const ext of lang.extensions) {
      if (ext.startsWith('.')) {
        if (lower.endsWith(ext)) return lang.id;
      } else {
        if (lower === ext.toLowerCase() || lower.endsWith('/' + ext.toLowerCase())) {
          return lang.id;
        }
      }
    }
  }

  return fallback;
}

export function detectLanguageFromTitle(title: string, fallback = 'plaintext'): string {
  return detectLanguageFromFilename(title, fallback);
}

export function getDefaultExtensionForLanguage(language?: string | null): string {
  if (!language) return '.txt';
  const lower = language.toLowerCase();
  const lang = SUPPORTED_LANGUAGES.find((l) => l.id === lower);
  if (!lang || !lang.extensions.length) return '.txt';
  const dotExt = lang.extensions.find((e) => e.startsWith('.'));
  return dotExt || (lang.extensions[0].startsWith('.') ? lang.extensions[0] : '.' + lang.extensions[0].toLowerCase());
}

export function splitTitleAndExtension(
  title?: string | null,
  language?: string | null,
  filename?: string | null
): { baseTitle: string; extension: string } {
  const rawTitle = (title || '').trim();
  const effectiveTitle = rawTitle || 'Untitled Document';

  if (effectiveTitle.toLowerCase() === 'dockerfile') {
    return { baseTitle: effectiveTitle, extension: '' };
  }

  // 1. Check if title ends with any supported language extension
  for (const lang of SUPPORTED_LANGUAGES) {
    for (const ext of lang.extensions) {
      if (ext.startsWith('.') && effectiveTitle.toLowerCase().endsWith(ext.toLowerCase())) {
        const base = effectiveTitle.slice(0, effectiveTitle.length - ext.length);
        if (base.length > 0) {
          return { baseTitle: base, extension: ext };
        }
      }
    }
  }

  // 2. Check if title already ends with any standard extension (e.g. .csv, .vue, .proto)
  const extMatch = effectiveTitle.match(/^(.+?)(\.[a-zA-Z][a-zA-Z0-9_-]{0,7})$/);
  if (extMatch) {
    return { baseTitle: extMatch[1], extension: extMatch[2] };
  }

  // 3. Fallback to filename extension if present
  if (filename) {
    for (const lang of SUPPORTED_LANGUAGES) {
      for (const ext of lang.extensions) {
        if (ext.startsWith('.') && filename.toLowerCase().endsWith(ext.toLowerCase())) {
          return { baseTitle: effectiveTitle, extension: ext };
        }
      }
    }
    const fnMatch = filename.match(/\.[a-zA-Z][a-zA-Z0-9_-]{0,7}$/);
    if (fnMatch) {
      return { baseTitle: effectiveTitle, extension: fnMatch[0] };
    }
  }

  // 4. Default to language extension
  const defaultExt = getDefaultExtensionForLanguage(language);
  return { baseTitle: effectiveTitle, extension: defaultExt };
}

export function formatTitleWithExtension(
  title?: string | null,
  language?: string | null,
  filename?: string | null
): string {
  const { baseTitle, extension } = splitTitleAndExtension(title, language, filename);
  return `${baseTitle}${extension}`;
}
