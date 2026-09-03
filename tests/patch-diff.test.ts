import { describe, it, expect } from 'vitest';
import { createUnifiedPatchText } from '../src/lib/diff-utils';

describe('Unified Patch generator seam', () => {
  it('generates unified diff patch string', () => {
    const oldCode = 'function hello() {\n  return "old";\n}\n';
    const newCode = 'function hello() {\n  return "new";\n}\n';
    const patch = createUnifiedPatchText('test.ts', oldCode, newCode);

    expect(patch).toContain('--- test.ts');
    expect(patch).toContain('+++ test.ts');
    expect(patch).toContain('-  return "old";');
    expect(patch).toContain('+  return "new";');
  });
});
