# 08: In-App Destructive Action Modal & Soft-Delete Safety

**What to build:**
Replace the primitive `window.confirm` dialog used for document deletion with a custom, styled in-app modal (`DeleteDocumentModal`). The modal clearly articulates what will happen:
- Displays document title, filename, and total number of historical version snapshots that will be permanently removed.
- Explains the irreversible nature of the action.
- Features a prominent red destructive confirmation button and a clear cancel button.
- Dismissible via `Esc` or clicking the backdrop.

**Blocked by:**
01: Domain Vocabulary & Terminology Harmonization

**Status:** ready-for-agent

- [ ] Create `DeleteDocumentModal` component adhering to canvas dark theme styling.
- [ ] Render exact version snapshot count in confirmation dialog body.
- [ ] Connect delete trigger in `Sidebar.tsx` to open the modal instead of `window.confirm()`.
- [ ] Ensure focus trap, `Esc` key handling, and cancel operations preserve document.
- [ ] Add interaction tests for delete confirmation and cancellation.
