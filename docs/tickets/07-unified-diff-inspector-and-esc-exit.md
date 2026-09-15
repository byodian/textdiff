# 07: Immersive Diff Mode Frame & Unified Escape Exit

**What to build:**
Create a unified, immersive diff inspection experience across all diff scenarios (both draft-vs-saved and historical version-vs-version).
1. Display a standardized Diff Inspector Banner pinned at the top of the canvas:
   - Showing `Source A` ↔ `Source B` with line change metrics (`+X / -Y`).
   - Side-by-side vs. Inline view toggle.
   - Jump to Prev/Next change buttons.
   - Clear `Exit Diff (Esc)` exit button.
2. Enable the global `Esc` keyboard key to immediately exit diff mode and return to editing.

**Blocked by:**
05: Header Decluttering & Three-Zone Information Architecture, 06: Unified Timeline Compare & Removal of Base-Anchor PickMode

**Status:** ready-for-agent

- [ ] Create `DiffInspectorBar` component shared across all diff views.
- [ ] Display precise label indicating comparison targets (e.g. `Working Draft ↔ Latest Saved (v3)` or `v1 ↔ v3`).
- [ ] Include Side-by-Side vs. Inline toggle inside the `DiffInspectorBar`.
- [ ] Register global `Esc` key handler to exit diff mode when active.
- [ ] Add tests verifying Escape key exit and inspector bar metrics.
