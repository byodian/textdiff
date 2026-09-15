# 11: Optimistic Instant Save & Post-Save Annotation

**What to build:**
Replace the inline prompt save interruption with an instantaneous 0ms optimistic save on `Ctrl+S` / `Cmd+S` or "Save Version" click. Persist focus inside the editor without opening any modal or prompt. Trigger a temporary `Saved ✓` flash on the Save button and display a floating `PostSaveToast` with version info, diff stats (`+X / -Y lines`), `[ Add Note ]`, and `[ Revert ]` actions. Support expanding into a single-line input to attach a version note asynchronously, and support inline note editing in the `HistoryDrawer`.

**Blocked by:**
02: Non-blocking Inline Version Snapshot Bar (supersedes and refactors ticket 02)

**Status:** ready-for-agent

- [ ] Create `PostSaveToast` component with version info, line diff stats, `[ Add Note ]` and `[ Revert ]` actions, and 4s auto-dismiss.
- [ ] Add `PATCH /api/snippets/[id]/versions` endpoint to update version `commitMsg` asynchronously.
- [ ] Refactor `page.tsx`: eliminate `SaveModal` interruption from `Ctrl+S` and primary Save button, making saving instantaneous.
- [ ] Add `Saved ✓` flash feedback state to `EditorHeader` Save button.
- [ ] Add inline note editing (pencil icon / double-click) to `HistoryDrawer` version list items.
- [ ] Add unit and integration tests in `tests/instant-save.test.tsx`.
