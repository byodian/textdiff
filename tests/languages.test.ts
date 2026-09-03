import { describe, it, expect } from 'vitest';
import { detectLanguageFromFilename, SUPPORTED_LANGUAGES } from '../src/lib/languages';

describe('Language detection and configuration seam', () => {
  it('detects typescript and javascript correctly', () => {
    expect(detectLanguageFromFilename('main.ts')).toBe('typescript');
    expect(detectLanguageFromFilename('component.tsx')).toBe('typescript');
    expect(detectLanguageFromFilename('index.js')).toBe('javascript');
    expect(detectLanguageFromFilename('view.jsx')).toBe('javascript');
  });

  it('detects backend and system languages', () => {
    expect(detectLanguageFromFilename('server.go')).toBe('go');
    expect(detectLanguageFromFilename('main.rs')).toBe('rust');
    expect(detectLanguageFromFilename('script.py')).toBe('python');
    expect(detectLanguageFromFilename('App.java')).toBe('java');
    expect(detectLanguageFromFilename('algo.cpp')).toBe('cpp');
  });

  it('detects config and data formats', () => {
    expect(detectLanguageFromFilename('config.yaml')).toBe('yaml');
    expect(detectLanguageFromFilename('manifest.yml')).toBe('yaml');
    expect(detectLanguageFromFilename('package.json')).toBe('json');
    expect(detectLanguageFromFilename('query.sql')).toBe('sql');
    expect(detectLanguageFromFilename('style.css')).toBe('css');
    expect(detectLanguageFromFilename('page.html')).toBe('html');
    expect(detectLanguageFromFilename('README.md')).toBe('markdown');
    expect(detectLanguageFromFilename('run.sh')).toBe('shell');
    expect(detectLanguageFromFilename('patch.diff')).toBe('diff');
  });

  it('falls back to default language for unknown extension or empty name', () => {
    expect(detectLanguageFromFilename('file.unknown')).toBe('typescript');
    expect(detectLanguageFromFilename('')).toBe('typescript');
  });

  it('includes all registered languages in supported list', () => {
    expect(SUPPORTED_LANGUAGES.some(l => l.id === 'typescript')).toBe(true);
    expect(SUPPORTED_LANGUAGES.some(l => l.id === 'python')).toBe(true);
    expect(SUPPORTED_LANGUAGES.some(l => l.id === 'yaml')).toBe(true);
    expect(SUPPORTED_LANGUAGES.some(l => l.id === 'diff')).toBe(true);
  });
});
