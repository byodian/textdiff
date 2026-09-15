# 10: Editor Status Bar & High-Frequency Action Visibility

**What to build:**
Dock a sleek, minimal 24px developer Status Bar at the bottom of the workbench window.
- **Left**: Document language badge, UTF-8 encoding indicator, cursor/line status.
- **Center**: In diff mode, display sequential diff chunk tracker (`Change X of Y`) with Prev/Next buttons.
- **Right**: One-click "Format Document" button with shortcut reminder (`Shift+Alt+F`), character & line count.

**Blocked by:**
05: Header Decluttering & Three-Zone Information Architecture, 07: Immersive Diff Mode Frame & Unified Escape Exit

**Status:** ready-for-agent

- [ ] Create `StatusBar.tsx` component with dark theme border and compact monospace typography.
- [ ] Surface "Format Document" button prominently in the status bar with hover feedback and shortcut badge.
- [ ] Display active syntax language and line/character count.
- [ ] Connect diff chunk navigation controls and change counter when in diff mode.
- [ ] Add tests verifying status bar controls and format action triggers.
