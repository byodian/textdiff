# 03: Unsaved Changes Navigation Guard & Dirty Indicators

**What to build:**
Protect developers from accidental data loss or disorientation when navigating away from a dirty document. When `hasUnsavedChanges` is true and the user attempts to switch documents in the sidebar, switch workspaces, or create a new document, intercept the action and present an in-app guard dialog with three clear options: "Save Version & Proceed", "Discard Changes & Proceed", and "Cancel". In addition, display an amber dirty indicator dot `●` on documents in the sidebar list that have pending unsaved modifications.

**Blocked by:**
01: Domain Vocabulary & Terminology Harmonization

**Status:** ready-for-agent

- [ ] Add dirty indicator badge/dot `●` to sidebar items matching the active uncommitted document or cached local draft.
- [ ] Implement `UnsavedChangesModal` with clear action choices: Save & Continue, Discard, Cancel.
- [ ] Intercept `onSelectSnippet`, `onSelectWorkspace`, and `onNewSnippet` when uncommitted edits exist.
- [ ] Verify that confirming discard switches safely to the target document.
- [ ] Verify that confirming save commits a snapshot before switching.
- [ ] Add automated component tests for the navigation guard workflow.
