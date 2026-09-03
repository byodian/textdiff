import { describe, it, expect } from 'vitest';
import { calculateDiffStats } from '../src/lib/diff-utils';

describe('Diff statistics calculation seam', () => {
  it('detects added lines', () => {
    const oldCode = 'line 1\nline 2\n';
    const newCode = 'line 1\nline 1.5\nline 2\nline 3\n';
    const stats = calculateDiffStats(oldCode, newCode);
    expect(stats.added).toBe(2);
    expect(stats.removed).toBe(0);
  });

  it('detects removed lines', () => {
    const oldCode = 'line 1\nline 2\nline 3\n';
    const newCode = 'line 1\nline 3\n';
    const stats = calculateDiffStats(oldCode, newCode);
    expect(stats.added).toBe(0);
    expect(stats.removed).toBe(1);
  });

  it('detects modified lines (one add, one remove)', () => {
    const oldCode = 'const a = 1;\n';
    const newCode = 'const a = 2;\n';
    const stats = calculateDiffStats(oldCode, newCode);
    expect(stats.added).toBe(1);
    expect(stats.removed).toBe(1);
  });

  it('returns zeroes for identical strings', () => {
    const code = 'const hello = "world";\nconsole.log(hello);';
    const stats = calculateDiffStats(code, code);
    expect(stats.added).toBe(0);
    expect(stats.removed).toBe(0);
    expect(stats.hasChanges).toBe(false);
  });
});
