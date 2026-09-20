import { describe, it, expect } from 'vitest';
import {
  validateJsonSyntax,
  validateYamlSyntax,
  validateXmlSyntax,
  validateMarkdownSyntax,
  validateSyntax,
} from '../src/lib/syntax-validator';

describe('JSON Syntax Validator & Diagnostics', () => {
  it('returns empty diagnostics for valid JSON', () => {
    const validJson = JSON.stringify({ name: 'test', count: 42, active: true }, null, 2);
    expect(validateJsonSyntax(validJson)).toEqual([]);
    expect(validateSyntax(validJson, 'json')).toEqual([]);
  });

  it('detects trailing commas with exact location, explanation, and quickFix', () => {
    const code = `{\n  "name": "test",\n  "count": 42,\n}`;
    const diags = validateJsonSyntax(code);
    expect(diags.length).toBeGreaterThanOrEqual(1);

    const tc = diags.find((d) => d.rule === 'json/trailing-comma');
    expect(tc).toBeDefined();
    expect(tc?.line).toBe(3);
    expect(tc?.message).toContain('尾随逗号');
    expect(tc?.suggestion).toContain('删除此处的逗号');
    expect(tc?.quickFix).toBeDefined();

    // Test quick fix
    const fixed = tc?.quickFix?.apply(code);
    expect(fixed).toBeDefined();
    expect(validateJsonSyntax(fixed!)).toEqual([]);
  });

  it('detects single quotes with location, suggestion, and quickFix', () => {
    const code = `{\n  'name': 'test'\n}`;
    const diags = validateJsonSyntax(code);
    expect(diags.length).toBeGreaterThanOrEqual(1);

    const sq = diags.find((d) => d.rule === 'json/single-quote');
    expect(sq).toBeDefined();
    expect(sq?.line).toBe(2);
    expect(sq?.message).toContain('单引号');
    expect(sq?.suggestion).toContain('双引号');
    expect(sq?.quickFix).toBeDefined();

    const fixed = sq?.quickFix?.apply(code);
    expect(fixed).toBeDefined();
    expect(validateJsonSyntax(fixed!)).toEqual([]);
  });

  it('detects invalid literals like True, False, None', () => {
    const code = `{\n  "active": True,\n  "empty": None\n}`;
    const diags = validateJsonSyntax(code);
    const litDiags = diags.filter((d) => d.rule === 'json/literal-casing');
    expect(litDiags.length).toBe(2);

    expect(litDiags[0].line).toBe(2);
    expect(litDiags[0].suggestion).toContain('true');
    expect(litDiags[1].line).toBe(3);
    expect(litDiags[1].suggestion).toContain('null');

    const fixed = litDiags[0].quickFix?.apply(code);
    expect(fixed).toContain('"active": true');
    expect(fixed).toContain('"empty": null');
    expect(validateJsonSyntax(fixed!)).toEqual([]);
  });

  it('detects unquoted property keys with suggestion and quickFix', () => {
    const code = `{\n  title: "hello"\n}`;
    const diags = validateJsonSyntax(code);
    const uq = diags.find((d) => d.rule === 'json/unquoted-key');
    expect(uq).toBeDefined();
    expect(uq?.line).toBe(2);
    expect(uq?.message).toContain('title');
    expect(uq?.suggestion).toContain('"title"');

    const fixed = uq?.quickFix?.apply(code);
    expect(fixed).toContain('"title": "hello"');
    expect(validateJsonSyntax(fixed!)).toEqual([]);
  });

  it('detects comments with suggestion and quickFix', () => {
    const code = `{\n  // This is a comment\n  "foo": "bar"\n}`;
    const diags = validateJsonSyntax(code);
    const commentDiag = diags.find((d) => d.rule === 'json/no-comments');
    expect(commentDiag).toBeDefined();
    expect(commentDiag?.line).toBe(2);
    expect(commentDiag?.message).toContain('不支持代码注释');

    const fixed = commentDiag?.quickFix?.apply(code);
    expect(fixed).not.toContain('// This is a comment');
    expect(validateJsonSyntax(fixed!)).toEqual([]);
  });

  it('detects unclosed brackets and braces', () => {
    const code = `{\n  "foo": [1, 2, 3\n}`;
    const diags = validateJsonSyntax(code);
    const bracketDiag = diags.find((d) => d.rule === 'json/unclosed-bracket');
    expect(bracketDiag).toBeDefined();
    expect(bracketDiag?.suggestion).toContain(']');
  });
});

describe('YAML Syntax Validator & Diagnostics', () => {
  it('returns empty diagnostics for valid YAML', () => {
    const validYaml = `name: test\nversion: 1.0.0\nitems:\n  - apple\n  - banana\n`;
    expect(validateYamlSyntax(validYaml)).toEqual([]);
    expect(validateSyntax(validYaml, 'yaml')).toEqual([]);
  });

  it('detects forbidden tab characters in YAML indentation with location and quickFix', () => {
    const code = `name: test\nitems:\n\t- item1\n\t- item2`;
    const diags = validateYamlSyntax(code);
    const tabDiag = diags.find((d) => d.rule === 'yaml/no-tabs');
    expect(tabDiag).toBeDefined();
    expect(tabDiag?.line).toBe(3);
    expect(tabDiag?.message).toContain('制表符 Tab');
    expect(tabDiag?.suggestion).toContain('空格');

    const fixed = tabDiag?.quickFix?.apply(code);
    expect(fixed).not.toContain('\t');
    expect(fixed).toContain('  - item1');
    expect(validateYamlSyntax(fixed!)).toEqual([]);
  });

  it('detects missing space after colon with location and quickFix', () => {
    const code = `service:nginx\nport: 80`;
    const diags = validateYamlSyntax(code);
    const colonDiag = diags.find((d) => d.rule === 'yaml/missing-space-after-colon');
    expect(colonDiag).toBeDefined();
    expect(colonDiag?.line).toBe(1);
    expect(colonDiag?.message).toContain('冒号');

    const fixed = colonDiag?.quickFix?.apply(code);
    expect(fixed).toContain('service: nginx');
  });

  it('provides helpful suggestions for bad indentation and mapping errors', () => {
    const code = `root:\n  child: 1\n bad_indent: 2`;
    const diags = validateYamlSyntax(code);
    expect(diags.length).toBeGreaterThan(0);
    expect(diags[0].suggestion).toBeDefined();
  });
});

describe('XML & HTML Tag Validator', () => {
  it('detects unclosed tags with location and suggestion', () => {
    const code = `<catalog>\n  <book>\n    <title>Great Book</title>\n</catalog>`;
    const diags = validateXmlSyntax(code);
    const unclosed = diags.find((d) => d.rule === 'xml/unclosed-tag');
    expect(unclosed).toBeDefined();
    expect(unclosed?.line).toBe(2);
    expect(unclosed?.message).toContain('book');
    expect(unclosed?.suggestion).toContain('</book>');
  });

  it('detects mismatched closing tags', () => {
    const code = `<section>\n  <article>Content</section>\n</article>`;
    const diags = validateXmlSyntax(code, false);
    const unclosed = diags.find((d) => d.rule === 'xml/unclosed-tag');
    expect(unclosed).toBeDefined();
    expect(unclosed?.message).toContain('article');

    const directMismatch = validateXmlSyntax('<foo>Content</bar>', false);
    const mismatch = directMismatch.find((d) => d.rule === 'xml/mismatched-tag');
    expect(mismatch).toBeDefined();
    expect(mismatch?.message).toContain('期望 "</foo>"');
  });

  it('allows void HTML tags in HTML mode', () => {
    const html = `<div>\n  <img src="pic.jpg">\n  <br>\n  <input type="text">\n</div>`;
    expect(validateXmlSyntax(html, true)).toEqual([]);
  });
});

describe('Markdown Syntax Validator', () => {
  it('detects unclosed code fences with location, suggestion, and quickFix', () => {
    const code = `# Title\n\n\`\`\`ts\nconst x = 1;\n`;
    const diags = validateMarkdownSyntax(code);
    expect(diags.length).toBe(1);
    expect(diags[0].rule).toBe('markdown/unclosed-code-fence');
    expect(diags[0].line).toBe(3);
    expect(diags[0].suggestion).toContain('```');

    const fixed = diags[0].quickFix?.apply(code);
    expect(validateMarkdownSyntax(fixed!)).toEqual([]);
  });
});
