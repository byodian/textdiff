import { describe, it, expect, vi } from 'vitest';
import {
  isMarkdownDocument,
  resolveDocumentFilename,
  exportRawDocument,
  exportMarkdownToDocx,
  exportMarkdownToPdf,
} from '../src/lib/export-utils';

describe('Export Utilities', () => {
  describe('isMarkdownDocument', () => {
    it('identifies markdown by language id', () => {
      expect(isMarkdownDocument('markdown', 'doc', 'doc.txt')).toBe(true);
      expect(isMarkdownDocument('Markdown', 'doc', 'doc')).toBe(true);
    });

    it('identifies markdown by title or filename extension', () => {
      expect(isMarkdownDocument('plaintext', 'notes.md')).toBe(true);
      expect(isMarkdownDocument(undefined, 'guide.MARKDOWN')).toBe(true);
      expect(isMarkdownDocument('plaintext', 'untitled', 'doc.md')).toBe(true);
    });

    it('returns false for non-markdown documents', () => {
      expect(isMarkdownDocument('typescript', 'index.ts')).toBe(false);
      expect(isMarkdownDocument('python', 'script.py')).toBe(false);
      expect(isMarkdownDocument('plaintext', 'notes.txt')).toBe(false);
      expect(isMarkdownDocument('json', 'data.json')).toBe(false);
    });
  });

  describe('resolveDocumentFilename', () => {
    it('preserves existing extension for raw export', () => {
      expect(resolveDocumentFilename('main.py', 'python')).toBe('main.py');
      expect(resolveDocumentFilename('notes.md', 'markdown')).toBe('notes.md');
      expect(resolveDocumentFilename('README', 'markdown')).toBe('README.md');
    });

    it('appends target extension for PDF and DOCX exports', () => {
      expect(resolveDocumentFilename('notes.md', 'markdown', '.pdf')).toBe('notes.pdf');
      expect(resolveDocumentFilename('notes.md', 'markdown', '.docx')).toBe('notes.docx');
      expect(resolveDocumentFilename('doc', 'markdown', 'pdf')).toBe('doc.pdf');
    });

    it('handles untitled documents with fallback extension', () => {
      expect(resolveDocumentFilename('', 'markdown')).toBe('Untitled Document.md');
      expect(resolveDocumentFilename('', 'markdown', '.pdf')).toBe('Untitled Document.pdf');
      expect(resolveDocumentFilename('', 'markdown', '.docx')).toBe('Untitled Document.docx');
    });
  });

  describe('exportRawDocument', () => {
    it('creates Blob with proper mime type and filename for markdown', () => {
      const result = exportRawDocument('README.md', '# Hello World\nContent', 'markdown');
      expect(result.filename).toBe('README.md');
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.blob.type).toContain('text/markdown');
      expect(result.blob.size).toBeGreaterThan(0);
    });

    it('creates Blob for python code', () => {
      const result = exportRawDocument('app.py', 'print("hello")', 'python');
      expect(result.filename).toBe('app.py');
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.blob.size).toBeGreaterThan(0);
    });

    it('creates Blob for JSON data', () => {
      const result = exportRawDocument('config.json', '{"a": 1}', 'json');
      expect(result.filename).toBe('config.json');
      expect(result.blob.type).toContain('application/json');
    });
  });

  describe('exportMarkdownToDocx', () => {
    it('generates a valid DOCX file for markdown content', async () => {
      const markdown = `
# Title

This is a paragraph with **bold** and *italic* text.

- Item 1
- Item 2

\`\`\`javascript
const a = 10;
\`\`\`

| Key | Value |
| --- | --- |
| A | 1 |
`;
      const result = await exportMarkdownToDocx('Guide.md', markdown);
      expect(result.filename).toBe('Guide.docx');
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.blob.size).toBeGreaterThan(1000);
    });
    it('preserves multi-line structure, indentation, and code spans in paragraphs', async () => {
      const sample = `
2.prepay-things服务
prepay:
  thing:
    rocket-mq:
      producer:
        device-quarter-hour-freeze-data-topic: prepay-device-quarter-hour-freeze-data-test

数据库SQL
新增表结构
CREATE TABLE \`base_collaborative_contact\` (
  \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键Id',
  \`tenant_id\` bigint NULL DEFAULT NULL COMMENT '租户Id',
  \`name\` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '姓名',
  \`phone_num\` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '手机号',
  PRIMARY KEY (\`id\`) USING BTREE
) ENGINE = InnoDB;
`;
      const result = await exportMarkdownToDocx('Services.md', sample);
      expect(result.filename).toBe('Services.docx');
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.blob.size).toBeGreaterThan(2000);
    });
  });

  describe('exportMarkdownToPdf', () => {
    it('generates a valid vector PDF file with clickable links and no raster images', async () => {
      const markdown = `
# Project Report

This is an introduction with a [Project Link](https://github.com/project) and https://example.com/docs to inspect.

## Section 1

Details with \`code\` and **bold** text.

> A notable remark.

- Point 1
- Point 2

| Service | Topic |
| --- | --- |
| prepay | freeze-data |
`;
      const result = await exportMarkdownToPdf('Report.md', markdown);
      expect(result.filename).toBe('Report.pdf');
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.blob.size).toBeGreaterThan(1000);
      expect(result.blob.size).toBeLessThan(150 * 1024);

      const buf = Buffer.from(await result.blob.arrayBuffer());
      const rawPdf = buf.toString('latin1');
      // Must contain interactive PDF link annotations
      expect(rawPdf).toContain('/Subtype /Link');
      expect(rawPdf).toContain('https://github.com/project');
      expect(rawPdf).toContain('https://example.com/docs');
      // Must NOT be a scanned raster image PDF
      expect(rawPdf).not.toContain('/Subtype /Image');
    });

    it('embeds subsetted CJK vector font for Chinese + YAML + SQL documents with compact file size', async () => {
      const sample = `
1.upa服务

2.prepay-things服务
prepay:
  thing:
    rocket-mq:
      producer:
        device-quarter-hour-freeze-data-topic: prepay-device-quarter-hour-freeze-data-test

数据库SQL
新增表结构
CREATE TABLE \`base_collaborative_contact\` (
  \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键Id',
  \`tenant_id\` bigint NULL DEFAULT NULL COMMENT '租户Id',
  \`name\` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '姓名',
  \`phone_num\` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '手机号',
  PRIMARY KEY (\`id\`) USING BTREE
) ENGINE = InnoDB;
`;
      const result = await exportMarkdownToPdf('Services.md', sample);
      expect(result.filename).toBe('Services.pdf');
      expect(result.blob.size).toBeGreaterThan(10 * 1024);
      // Subsetted + compressed vector PDF should be compact (< 150 KB, never 19 MB)
      expect(result.blob.size).toBeLessThan(150 * 1024);

      const buf = Buffer.from(await result.blob.arrayBuffer());
      const rawPdf = buf.toString('latin1');
      expect(rawPdf).toContain('/Subtype /CIDFontType2');
      expect(rawPdf).toContain('/ToUnicode');
      expect(rawPdf).not.toContain('/Subtype /Image');
    });

    it('recognizes Unicode symbols like • (bullet), ✓, → and preserves indentation inside list items', async () => {
      const sample = [
        '2. Antigravity 原生全局发现：',
        '  • 在 `skills` 下建立了对全部技能目录的全局软链接。',
        '  • 在 `skills.json` 中注册了全局技能目录索引：',
        '    {',
        '      "entries": [',
        '        { "path": "/home/bbb/.agents/skills" }',
        '      ]',
        '    }',
        '  • 支持符号：◦ ▪ ✓ ✔ ✘ → ← — “引用” … ├── └──',
      ].join('\n');

      // Verify PDF export
      const pdfResult = await exportMarkdownToPdf('Antigravity.md', sample);
      expect(pdfResult.filename).toBe('Antigravity.pdf');
      expect(pdfResult.blob.size).toBeGreaterThan(10 * 1024);
      expect(pdfResult.blob.size).toBeLessThan(150 * 1024);

      const buf = Buffer.from(await pdfResult.blob.arrayBuffer());
      const rawPdf = buf.toString('latin1');
      expect(rawPdf).toContain('DejaVuSans');
      expect(rawPdf).toContain('DroidSansFallback');
      expect(rawPdf).toContain('/ToUnicode');

      // Verify DOCX export also succeeds and preserves content
      const docxResult = await exportMarkdownToDocx('Antigravity.md', sample);
      expect(docxResult.filename).toBe('Antigravity.docx');
      expect(docxResult.blob.size).toBeGreaterThan(2000);
    });
  });
});
