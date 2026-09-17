import { describe, it, expect } from 'vitest';
import { 
  detectLanguageFromFilename, 
  detectLanguageFromTitle, 
  getDefaultExtensionForLanguage,
  splitTitleAndExtension,
  formatTitleWithExtension,
  SUPPORTED_LANGUAGES 
} from '../src/lib/languages';

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

  it('detects language from title with detectLanguageFromTitle', () => {
    expect(detectLanguageFromTitle('app.tsx')).toBe('typescript');
    expect(detectLanguageFromTitle('docker-compose.yml')).toBe('yaml');
    expect(detectLanguageFromTitle('schema.sql')).toBe('sql');
    expect(detectLanguageFromTitle('Notes')).toBe('plaintext');
    expect(detectLanguageFromTitle('Notes', '')).toBe('');
  });

  it('falls back to default language for unknown extension or empty name', () => {
    expect(detectLanguageFromFilename('file.unknown')).toBe('plaintext');
    expect(detectLanguageFromFilename('')).toBe('plaintext');
    expect(detectLanguageFromFilename('file.unknown', 'javascript')).toBe('javascript');
  });

  it('includes all registered languages in supported list', () => {
    expect(SUPPORTED_LANGUAGES.some(l => l.id === 'typescript')).toBe(true);
    expect(SUPPORTED_LANGUAGES.some(l => l.id === 'python')).toBe(true);
    expect(SUPPORTED_LANGUAGES.some(l => l.id === 'yaml')).toBe(true);
    expect(SUPPORTED_LANGUAGES.some(l => l.id === 'diff')).toBe(true);
  });

  it('returns default extension for languages correctly', () => {
    expect(getDefaultExtensionForLanguage('typescript')).toBe('.ts');
    expect(getDefaultExtensionForLanguage('javascript')).toBe('.js');
    expect(getDefaultExtensionForLanguage('python')).toBe('.py');
    expect(getDefaultExtensionForLanguage('markdown')).toBe('.md');
    expect(getDefaultExtensionForLanguage('sql')).toBe('.sql');
    expect(getDefaultExtensionForLanguage('plaintext')).toBe('.txt');
    expect(getDefaultExtensionForLanguage(null)).toBe('.txt');
  });

  it('splits and formats title with extension properly', () => {
    // Title with existing known extension
    expect(splitTitleAndExtension('README.md', 'markdown')).toEqual({
      baseTitle: 'README',
      extension: '.md',
    });
    expect(formatTitleWithExtension('app.tsx', 'typescript')).toBe('app.tsx');

    // Title without extension appends language extension
    expect(splitTitleAndExtension('Untitled Document', 'plaintext')).toEqual({
      baseTitle: 'Untitled Document',
      extension: '.txt',
    });
    expect(formatTitleWithExtension('Untitled Document', 'typescript')).toBe('Untitled Document.ts');
    expect(formatTitleWithExtension('OrderService', 'sql')).toBe('OrderService.sql');
    expect(formatTitleWithExtension('main', 'python')).toBe('main.py');

    // Dockerfile special handling
    expect(splitTitleAndExtension('Dockerfile', 'dockerfile')).toEqual({
      baseTitle: 'Dockerfile',
      extension: '',
    });

    // Filename extension fallback
    expect(splitTitleAndExtension('Component', 'typescript', 'Component.tsx')).toEqual({
      baseTitle: 'Component',
      extension: '.tsx',
    });
  });
});

