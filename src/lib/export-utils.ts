import { Packer } from 'docx';
import { splitTitleAndExtension } from '@/lib/languages';
import { convertMarkdownToDocx } from '@/lib/markdown-to-docx';
import { convertMarkdownToPdfBlob } from '@/lib/markdown-to-pdf';

/**
 * Triggers a client-side file download via an anchor element.
 * Defers revoking the object URL so the browser's async download manager
 * can finish reading the Blob stream without producing a 0-byte file.
 */
export function triggerFileDownload(blob: Blob, filename: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    if (a.parentNode) {
      a.parentNode.removeChild(a);
    }
    URL.revokeObjectURL(url);
  }, 2000);
}

/**
 * Determines if a document should be treated as Markdown.
 */
export function isMarkdownDocument(
  language?: string | null,
  title?: string | null,
  filename?: string | null
): boolean {
  const lang = (language || '').toLowerCase().trim();
  if (lang === 'markdown') return true;

  const t = (title || '').toLowerCase().trim();
  if (t.endsWith('.md') || t.endsWith('.markdown')) return true;

  const f = (filename || '').toLowerCase().trim();
  if (f.endsWith('.md') || f.endsWith('.markdown')) return true;

  return false;
}

/**
 * Resolves the final download filename and extension for a given document.
 */
export function resolveDocumentFilename(
  title: string,
  language: string,
  targetExtension?: string,
  filename?: string | null,
  code?: string
): string {
  const { baseTitle, extension } = splitTitleAndExtension(title, language, filename, code);
  const safeBase = (baseTitle || 'Untitled Document').trim() || 'Untitled Document';

  if (!targetExtension) {
    return `${safeBase}${extension}`;
  }

  const cleanExt = targetExtension.startsWith('.') ? targetExtension : `.${targetExtension}`;
  return `${safeBase}${cleanExt}`;
}

/**
 * Determines appropriate MIME type for raw text file export.
 */
function getMimeTypeForLanguage(language: string, extension: string): string {
  const ext = extension.toLowerCase();
  const lang = language.toLowerCase();

  if (ext === '.md' || ext === '.markdown' || lang === 'markdown') {
    return 'text/markdown;charset=utf-8';
  }
  if (ext === '.json' || lang === 'json') {
    return 'application/json;charset=utf-8';
  }
  if (ext === '.html' || ext === '.htm' || lang === 'html') {
    return 'text/html;charset=utf-8';
  }
  if (ext === '.css' || lang === 'css') {
    return 'text/css;charset=utf-8';
  }
  if (
    ['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx'].includes(ext) ||
    ['javascript', 'typescript'].includes(lang)
  ) {
    return 'text/javascript;charset=utf-8';
  }
  if (['.yaml', '.yml'].includes(ext) || lang === 'yaml') {
    return 'text/yaml;charset=utf-8';
  }
  if (ext === '.xml' || lang === 'xml') {
    return 'application/xml;charset=utf-8';
  }
  if (ext === '.svg') {
    return 'image/svg+xml;charset=utf-8';
  }
  if (ext === '.csv') {
    return 'text/csv;charset=utf-8';
  }
  if (ext === '.sql' || lang === 'sql') {
    return 'application/sql;charset=utf-8';
  }

  return 'text/plain;charset=utf-8';
}

/**
 * Exports the document in its raw/original format with the correct extension.
 */
export function exportRawDocument(
  title: string,
  content: string,
  language: string,
  filename?: string | null
): { filename: string; blob: Blob } {
  const resolvedFilename = resolveDocumentFilename(title, language, undefined, filename, content);
  const { extension } = splitTitleAndExtension(title, language, filename, content);
  const mimeType = getMimeTypeForLanguage(language, extension);

  const blob = new Blob([content ?? ''], { type: mimeType });
  triggerFileDownload(blob, resolvedFilename);

  return { filename: resolvedFilename, blob };
}

/**
 * Exports a Markdown document to a formatted Microsoft Word (.docx) document.
 */
export async function exportMarkdownToDocx(
  title: string,
  markdown: string,
  filename?: string | null
): Promise<{ filename: string; blob: Blob }> {
  const resolvedFilename = resolveDocumentFilename(title, 'markdown', '.docx', filename, markdown);
  const { baseTitle } = splitTitleAndExtension(title, 'markdown', filename, markdown);

  const doc = convertMarkdownToDocx(markdown ?? '', baseTitle);

  let blob: Blob;
  if (typeof window !== 'undefined' && typeof Packer.toBlob === 'function') {
    blob = await Packer.toBlob(doc);
  } else {
    // Node.js or Vitest/JSDOM fallback
    const buffer = await Packer.toBuffer(doc);
    blob = new Blob([buffer as unknown as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
  }

  triggerFileDownload(blob, resolvedFilename);
  return { filename: resolvedFilename, blob };
}

/**
 * Exports a Markdown document directly to a downloadable vector PDF (.pdf) document
 * with selectable/editable text, active clickable links, and embedded subsetted CJK font.
 */
export async function exportMarkdownToPdf(
  title: string,
  markdown: string,
  filename?: string | null
): Promise<{ filename: string; blob: Blob }> {
  const resolvedFilename = resolveDocumentFilename(title, 'markdown', '.pdf', filename, markdown);
  const { baseTitle } = splitTitleAndExtension(title, 'markdown', filename, markdown);

  const blob = await convertMarkdownToPdfBlob(markdown ?? '', baseTitle);
  triggerFileDownload(blob, resolvedFilename);

  return { filename: resolvedFilename, blob };
}
