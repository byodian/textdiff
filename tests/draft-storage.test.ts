// @vitest-environment jsdom
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { saveDraft, loadDraft, clearDraft, clearAllDrafts } from '../src/lib/draft-storage';

class MockStorage implements Storage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear() {
    this.store.clear();
  }

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
}

describe('Draft storage utility', () => {
  let mockStorage: MockStorage;

  beforeAll(() => {
    mockStorage = new MockStorage();
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
  });

  beforeEach(() => {
    mockStorage.clear();
  });

  it('saves and loads a draft when it differs from savedCode', () => {
    saveDraft('snippet-1', 'const x = 10;');
    const draft = loadDraft('snippet-1', 'const x = 1;');
    expect(draft).toBe('const x = 10;');
  });

  it('returns null when draft matches savedCode', () => {
    saveDraft('snippet-1', 'const x = 1;');
    const draft = loadDraft('snippet-1', 'const x = 1;');
    expect(draft).toBeNull();
  });

  it('returns null when no draft exists', () => {
    const draft = loadDraft('non-existent', 'const x = 1;');
    expect(draft).toBeNull();
  });

  it('clears draft for a specific snippet', () => {
    saveDraft('snippet-1', 'code 1');
    saveDraft('snippet-2', 'code 2');

    clearDraft('snippet-1');

    expect(loadDraft('snippet-1', '')).toBeNull();
    expect(loadDraft('snippet-2', '')).toBe('code 2');
  });

  it('clears all drafts with clearAllDrafts', () => {
    saveDraft('snippet-1', 'code 1');
    saveDraft('snippet-2', 'code 2');
    mockStorage.setItem('other_key', 'keep_this');

    clearAllDrafts();

    expect(loadDraft('snippet-1', '')).toBeNull();
    expect(loadDraft('snippet-2', '')).toBeNull();
    expect(mockStorage.getItem('other_key')).toBe('keep_this');
  });
});
