import { describe, it, expect } from 'vitest';
import { detectLanguageFromContent } from '../src/lib/languages';

describe('detectLanguageFromContent', () => {
  it('detects JSON from valid JSON structure', () => {
    const jsonStr = '{\n  "name": "textdiff",\n  "version": "1.0.0"\n}';
    expect(detectLanguageFromContent(jsonStr)).toBe('json');
  });

  it('detects JSON from JSON-like object with single quotes or unquoted keys', () => {
    const jsonWithSingleQuotes = "{\n  'name': 'test',\n  'count': 123\n}";
    expect(detectLanguageFromContent(jsonWithSingleQuotes)).toBe('json');

    const jsonWithUnquotedKeys = '{\n  name: "test",\n  count: 123,\n}';
    expect(detectLanguageFromContent(jsonWithUnquotedKeys)).toBe('json');
  });

  it('detects JSON from array', () => {
    const jsonArray = '[\n  {"id": 1},\n  {"id": 2}\n]';
    expect(detectLanguageFromContent(jsonArray)).toBe('json');
  });

  it('detects YAML from frontmatter or key-value structures', () => {
    const yamlWithDashes = '---\nversion: "3.8"\nservices:\n  web:\n    image: nginx';
    expect(detectLanguageFromContent(yamlWithDashes)).toBe('yaml');

    const yamlSimple = 'services:\n  web:\n    image: nginx\n    ports:\n      - "80:80"';
    expect(detectLanguageFromContent(yamlSimple)).toBe('yaml');

    const yamlList = '- name: build\n  steps:\n    - run: echo ok';
    expect(detectLanguageFromContent(yamlList)).toBe('yaml');
  });

  it('detects XML and HTML', () => {
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<root><item id="1">Text</item></root>';
    expect(detectLanguageFromContent(xml)).toBe('xml');

    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>';
    expect(detectLanguageFromContent(svg)).toBe('xml');

    const html = '<!DOCTYPE html>\n<html>\n<head><title>App</title></head>\n<body>Hello</body>\n</html>';
    expect(detectLanguageFromContent(html)).toBe('html');
  });

  it('detects SQL', () => {
    const sqlSelect = 'SELECT u.id, u.name FROM users u WHERE u.active = 1;';
    expect(detectLanguageFromContent(sqlSelect)).toBe('sql');

    const sqlCreate = 'CREATE TABLE orders (\n  id INT PRIMARY KEY,\n  total DECIMAL(10, 2)\n);';
    expect(detectLanguageFromContent(sqlCreate)).toBe('sql');
  });

  it('detects Python from shebang or python keywords', () => {
    const pyShebang = '#!/usr/bin/env python\nprint("Hello")';
    expect(detectLanguageFromContent(pyShebang)).toBe('python');

    const pyCode = 'def process_data(items):\n    result = []\n    for item in items:\n        result.append(item * 2)\n    return result';
    expect(detectLanguageFromContent(pyCode)).toBe('python');
  });

  it('detects TypeScript and JavaScript', () => {
    const tsCode = 'interface User {\n  id: string;\n  name: string;\n}\n\nexport const getUser = (id: string): User => {\n  return { id, name: "Alice" };\n};';
    expect(detectLanguageFromContent(tsCode)).toBe('typescript');

    const jsCode = 'import React from "react";\n\nexport default function App() {\n  console.log("hello");\n  return null;\n}';
    expect(detectLanguageFromContent(jsCode)).toBe('javascript');
  });

  it('detects Shell scripts', () => {
    const shShebang = '#!/bin/bash\nset -e\necho "Starting deployment..."';
    expect(detectLanguageFromContent(shShebang)).toBe('shell');
  });

  it('detects Dockerfile', () => {
    const dockerfile = 'FROM node:18-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCMD ["npm", "start"]';
    expect(detectLanguageFromContent(dockerfile)).toBe('dockerfile');
  });

  it('detects Diff / Patch', () => {
    const diff = 'diff --git a/file.txt b/file.txt\n--- a/file.txt\n+++ b/file.txt\n@@ -1,3 +1,4 @@\n hello\n+world';
    expect(detectLanguageFromContent(diff)).toBe('diff');
  });

  it('detects Markdown', () => {
    const md = '# Project Title\n\nThis is a description.\n\n```ts\nconst a = 1;\n```';
    expect(detectLanguageFromContent(md)).toBe('markdown');
  });

  it('falls back to plaintext for generic text', () => {
    const plain = 'Just some random notes written down for reference.';
    expect(detectLanguageFromContent(plain)).toBe('plaintext');
    expect(detectLanguageFromContent('', 'plaintext')).toBe('plaintext');
  });
});
