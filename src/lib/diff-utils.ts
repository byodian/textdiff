import * as diff from 'diff';

export interface DiffStats {
  added: number;
  removed: number;
  hasChanges: boolean;
}

export function calculateDiffStats(oldText: string, newText: string): DiffStats {
  const changes = diff.diffLines(oldText ?? '', newText ?? '');
  let added = 0;
  let removed = 0;

  for (const part of changes) {
    if (part.added) {
      added += part.count ?? 0;
    } else if (part.removed) {
      removed += part.count ?? 0;
    }
  }

  return {
    added,
    removed,
    hasChanges: added > 0 || removed > 0,
  };
}

export function createUnifiedPatchText(filename: string, oldText: string, newText: string): string {
  return diff.createPatch(filename || 'snippet.txt', oldText ?? '', newText ?? '', 'original', 'modified');
}
