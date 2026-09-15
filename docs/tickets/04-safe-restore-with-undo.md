# 04: Safe Rollback with Diff Review & Undo Toast

**What to build:**
Eliminate the risk of destructive version restoration. When a user requests to restore a historical version (from the history drawer or banner), do not silently wipe the current buffer. Instead, load the historical code into the active draft buffer while providing an instant floating Undo Toast (`"Restored vX into draft buffer. [Undo]"`). If the current buffer had uncommitted changes, provide a clear diff confirmation prompt ("Review Before Restore") so the user can inspect what code will be replaced before applying the rollback.

**Blocked by:**
01: Domain Vocabulary & Terminology Harmonization

**Status:** ready-for-agent

- [ ] Implement `UndoToast` floating banner with 6-second persistence and explicit `Undo` button.
- [ ] Maintain a pre-restore backup snapshot of the working buffer before applying historical code.
- [ ] If user clicks `Undo`, instantly restore the previous buffer state.
- [ ] When restoring while unsaved edits exist, show a confirmation dialog with added/removed line statistics.
- [ ] Add unit and interaction tests verifying restore and undo flows.
