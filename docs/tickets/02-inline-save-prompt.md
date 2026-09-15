# 02: Non-blocking Inline Version Snapshot Bar

**What to build:**
Replace the full-screen blocking `SaveModal` dialog with a lightweight, non-blocking inline snapshot input bar rendered immediately beneath the Header (or inside the header action area). When the user presses `Cmd+S` / `Ctrl+S` or clicks "Save Version", the inline bar smoothly slides in, focuses the version note input, and allows immediate confirmation with `Enter` (defaulting to a timestamped version note if left blank). Pressing `Esc` immediately cancels and dismisses the bar.

**Blocked by:**
01: Domain Vocabulary & Terminology Harmonization

**Status:** ready-for-agent

- [ ] Create `InlineSaveBar` component with clean developer styling (subtle borders, mono text, keyboard badge hints).
- [ ] Support `Enter` key to confirm and persist the new version with optional note.
- [ ] Support `Esc` key to cancel and return focus to editor.
- [ ] Support one-click quick save button alongside input.
- [ ] Replace `SaveModal` invocation in `page.tsx` with the non-blocking inline bar.
- [ ] Add unit/interaction tests for keyboard and click triggers.
