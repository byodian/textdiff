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

export function detectLanguageFromFilename(filename: string, fallback = 'typescript'): string {
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
