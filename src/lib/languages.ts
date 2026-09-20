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

export function detectLanguageFromContent(content: string, fallback = 'plaintext'): string {
  const text = (content || '').trim();
  if (!text) return fallback;

  // 1. Shebang
  if (text.startsWith('#!')) {
    const firstLine = text.split('\n')[0].toLowerCase();
    if (firstLine.includes('python')) return 'python';
    if (firstLine.includes('bash') || firstLine.includes('sh') || firstLine.includes('zsh')) return 'shell';
    if (firstLine.includes('node')) return 'javascript';
  }

  // 2. Diff / Patch
  if (
    text.startsWith('diff --git') ||
    text.startsWith('Index: ') ||
    text.startsWith('--- a/') ||
    text.startsWith('*** ') ||
    /^@@\s+-\d+,\d+\s+\+\d+,\d+\s+@@/m.test(text)
  ) {
    return 'diff';
  }

  // 3. XML / SVG / HTML
  if (/^<\?xml\b/i.test(text) || /^<svg\b/i.test(text)) {
    return 'xml';
  }
  if (/^<!DOCTYPE\s+html\b/i.test(text) || /^<html\b/i.test(text)) {
    return 'html';
  }

  // 4. JSON
  if ((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'))) {
    try {
      JSON.parse(text);
      return 'json';
    } catch {
      // JSON with minor errors or formatting
      if (
        /^\{[\s\S]*\}$/.test(text) &&
        (/"[\w$-]+"\s*:|'[\w$-]+'\s*:|[\w$]+\s*:\s*["'{[\d]|,\s*["'}]/.test(text))
      ) {
        return 'json';
      }
      if (/^\[[\s\S]*\]$/.test(text) && (/,\s*["'{\d[]/.test(text) || /["'{\d[]/.test(text))) {
        return 'json';
      }
    }
  }

  // 5. Dockerfile
  const rawLines = text.split(/\r?\n/);
  const trimmedLines = rawLines.map((l) => l.trim()).filter(Boolean);
  const dockerfileKeywords = /^(FROM|RUN|CMD|LABEL|EXPOSE|ENV|ADD|COPY|ENTRYPOINT|VOLUME|USER|WORKDIR|ARG|STOPSIGNAL|HEALTHCHECK|SHELL)\s+/i;
  const dockerfileMatches = trimmedLines.filter((l) => dockerfileKeywords.test(l));
  if (trimmedLines.length > 0 && dockerfileMatches.length >= Math.min(2, trimmedLines.length) && dockerfileKeywords.test(trimmedLines[0])) {
    return 'dockerfile';
  }

  // 6. SQL
  const sqlKeywords = /^\s*(SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|CREATE\s+TABLE|CREATE\s+DATABASE|ALTER\s+TABLE|DROP\s+TABLE|DROP\s+DATABASE|TRUNCATE\s+TABLE|WITH\s+[\w$]+\s+AS)\b/i;
  if (sqlKeywords.test(text)) {
    return 'sql';
  }

  // 7. YAML
  if (/^---\s*(\r?\n|$)/.test(text) || /^%YAML\s+/.test(text)) {
    return 'yaml';
  }
  const yamlKvPattern = /^[\w$-]+:\s*(\r?\n|\S.*)/m;
  const yamlDashPattern = /^-\s+[\w$-]+:/m;
  if (
    !text.includes(';') &&
    !text.includes('{') &&
    ((yamlKvPattern.test(text) && rawLines.some((l) => /^ {2,}[\w$-]+:/.test(l))) ||
      yamlDashPattern.test(text))
  ) {
    return 'yaml';
  }

  // 8. Markdown
  const mdHeading = /^#{1,6}\s+\S/m;
  const mdList = /^[-*]\s+\[[ x]\]\s+\S/m;
  const mdFence = /^```[a-zA-Z0-9_-]*\r?\n[\s\S]*?\r?\n```/m;
  if (mdFence.test(text) || mdList.test(text) || (mdHeading.test(text) && !text.includes(';') && !text.includes('{'))) {
    return 'markdown';
  }

  // 9. TypeScript / JavaScript
  const hasTsTypes = /\b(interface|type)\s+[A-Z][\w$]*\s*[<={]|\bas\s+(const|[A-Z][\w$]*)|:\s*(string|number|boolean|any|unknown|never|void)\b/;
  const hasJsKeywords = /\b(import\s+.*from\s+['"]|export\s+(default|const|let|function|class)|const\s+[\w$]+\s*=\s*|function\s*[\w$]*\s*\(|console\.log\()/;
  if (hasTsTypes.test(text) && (hasJsKeywords.test(text) || /^[ \t]*export\s+/m.test(text))) {
    return 'typescript';
  }
  if (hasJsKeywords.test(text)) {
    return 'javascript';
  }

  // 10. Python
  const hasPyKeywords = /\bdef\s+[\w$]+\s*\(.*?\)\s*:|\bclass\s+[\w$]+(\(.*?\))?\s*:|\bif\s+__name__\s*==\s*['"]__main__['"]\s*:|\bimport\s+[\w$]+|\bfrom\s+[\w$]+\s+import\b|\belif\s+.*?:|\bexcept\s+.*?:/;
  if (hasPyKeywords.test(text) && !text.includes(';') && !text.includes('{')) {
    return 'python';
  }

  // 11. CSS
  if (
    /@(media|keyframes|import|charset)\b/.test(text) ||
    /^[.#a-zA-Z0-9_-][.#a-zA-Z0-9_ -]*\s*\{\s*[\w-]+\s*:\s*[^;]+;/m.test(text)
  ) {
    return 'css';
  }

  // 12. Shell
  if (
    /^(\$|#)\s+[a-zA-Z0-9_-]+/m.test(text) ||
    /\b(echo\s+['"].*?['"]|chmod\s+\+x|sudo\s+apt|export\s+[A-Z_]+=)/.test(text)
  ) {
    return 'shell';
  }

  // 13. General HTML / XML tag match
  if (/^<([a-zA-Z][a-zA-Z0-9-]*)(\s+[^>]*)?>[\s\S]*<\/\1>$/s.test(text)) {
    return 'xml';
  }

  return fallback;
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
