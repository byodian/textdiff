# 06: Unified Timeline Compare & Removal of Base-Anchor PickMode

**What to build:**
Dismantle the complex "pickMode" and "Base Anchor" mechanism in `HistoryDrawer`. Replace it with an intuitive, developer-standard timeline interface:
1. Each version card features a dedicated "Compare with Draft" button.
2. Each version card features a selection checkbox.
3. Checking any two version cards immediately enters the `vA ↔ vB` comparison view on the main canvas with a clean action bar.
4. A clear "Reset" / "Exit Diff" action restores normal viewing without friction.

**Blocked by:**
04: Safe Rollback with Diff Review & Undo Toast, 05: Header Decluttering & Three-Zone Information Architecture

**Status:** ready-for-agent

- [ ] Remove `pickMode`, `handleSetAsBase`, and `Anchor` icons from `HistoryDrawer`.
- [ ] Add direct `Compare with Draft` action button to each version item card.
- [ ] Add multi-select checkboxes on version items to select exactly two snapshots for arbitrary comparison.
- [ ] When two snapshots are selected, trigger comparison automatically and render a sticky bottom action bar (`Comparing vA ↔ vB`).
- [ ] Update tests to reflect simplified timeline comparison interactions.
