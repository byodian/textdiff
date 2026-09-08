/**
 * Draft storage – persists unsaved editor content in localStorage
 * so that refreshing the browser doesn't lose work-in-progress.
 *
 * Each snippet gets its own key: `textdiff_draft:<snippetId>`.
 * The stored value is the raw code string (no JSON wrapper) to
 * keep reads/writes fast and storage footprint minimal.
 */

const DRAFT_PREFIX = 'textdiff_draft:';

/** Return the localStorage key for a given snippet. */
function draftKey(snippetId: string): string {
  return `${DRAFT_PREFIX}${snippetId}`;
}

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.getItem === 'function') {
      return localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

/** Save a draft for the given snippet. Silently ignores quota errors. */
export function saveDraft(snippetId: string, code: string): void {
  try {
    const storage = getStorage();
    if (!storage) return;
    storage.setItem(draftKey(snippetId), code);
  } catch {
    // Storage full or unavailable – degrade silently.
  }
}

/**
 * Retrieve a stored draft. Returns `null` when no draft exists
 * or when the draft matches the current saved code (meaning there
 * is nothing unsaved to restore).
 */
export function loadDraft(snippetId: string, savedCode: string): string | null {
  try {
    const storage = getStorage();
    if (!storage) return null;
    const draft = storage.getItem(draftKey(snippetId));
    if (draft === null || draft === savedCode) return null;
    return draft;
  } catch {
    return null;
  }
}

/** Remove the draft for a snippet (e.g. after a successful save). */
export function clearDraft(snippetId: string): void {
  try {
    const storage = getStorage();
    if (!storage) return;
    storage.removeItem(draftKey(snippetId));
  } catch {
    // ignore
  }
}

/** Remove all drafts (useful for cleanup). */
export function clearAllDrafts(): void {
  try {
    const storage = getStorage();
    if (!storage) return;
    const keysToRemove: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(DRAFT_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => storage.removeItem(k));
  } catch {
    // ignore
  }
}
