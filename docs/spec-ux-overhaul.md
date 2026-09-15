# Feature Specification: TextDiff UX & Interaction Overhaul

## Problem Statement

Developers managing critical text assets (SQL migration scripts, Nacos configs, Kubernetes/Docker YAMLs, JSON schemas, Shell scripts) face severe workflow friction and cognitive anxiety in the current TextDiff UI:
1. **Disruptive Save Flow**: Pressing `Cmd+S` or clicking Save triggers a full-screen blocking modal dialog, disrupting the developer's editing rhythm and causing modal fatigue.
2. **Silent Data Loss Risk**: Navigating to another document in the sidebar while having unsaved changes silently switches the active buffer without warning or persistence confirmation.
3. **Anxiety-Inducing Restores**: Clicking "Revert to version" abruptly overwrites the current working buffer without a diff preview or an undo mechanism.
4. **Header Overcrowding**: Over 14 interactive elements compete for space in a single 56px bar, crushing document titles down to a few characters and causing visual chaos.
5. **Confusing Diff Mental Model**: Dual comparison mechanisms (working buffer diff vs. history timeline "pickMode/Base Anchor") confuse users about what is being compared and how to exit.
6. **Destructive Operations & Domain Misalignment**: Destructive deletions use crude browser `confirm()` popups, and the codebase labels professional versioned configurations as disposable "snippets".
7. **Barren Empty States & Hidden Engineering Tools**: Empty states lack onboarding guidance, and crucial actions like document formatting and diff chunk navigation are tucked away into deep submenus.

## Solution

A comprehensive UX and interaction overhaul that elevates TextDiff into a professional, distraction-free versioned text workbench:
1. **Lightweight Inline Snapshot**: Replace blocking save modals with a non-blocking inline snapshot bar with optional notes and instant shortcut confirmation.
2. **Unsaved Edits Guard**: Intercept document and workspace navigation when uncommitted changes exist, backed by visual dirty indicators on document list items.
3. **Safe Restore Workflow**: Provide a "Review Before Restore" diff comparison and a floating undo notification upon restore.
4. **Three-Zone Header & Floating Canvas Controls**: Streamline the main header into [Document Identity], [Primary Mode Switcher (Edit vs Diff)], and [Action Group]. Move secondary view toggles (Markdown split, Diff inline/side-by-side) to localized canvas overlays.
5. **Unified Timeline Diffing**: Remove the confusing "Base Anchor / pickMode" state. Offer direct "Compare with Draft" and intuitive two-version checkbox selection on the timeline.
6. **Immersive Diff Inspection Bar**: Unify diff mode with a persistent top inspection banner across both draft and historical diffs, supported by universal `Esc` key exit.
7. **In-App Destructive Modal**: Replace browser alerts with an informative, styled deletion modal showing version counts and clear cancellation paths.
8. **Unified Domain Vocabulary**: Standardize all user-facing terminology to "Document", "Version Note", and "Restore to Draft".
9. **Developer-Centric Empty States**: Populate zero-data screens with pre-configured templates (Nacos YAML, MySQL Migration, Docker Compose) and clipboard quick-paste.
10. **Developer Status Bar**: Add a minimal 24px bottom bar exposing cursor coordinates, syntax indicator, one-click document formatting, and sequential diff chunk counters.

## User Stories

1. As a developer, I want to press `Cmd+S` / `Ctrl+S` and have my snapshot saved immediately without a full-screen blocking modal, so that my coding flow is uninterrupted.
2. As a developer, I want an optional inline note prompt when saving a snapshot, so that I can provide context when desired without being forced to click through a dialog.
3. As a developer, I want to be warned if I click another document while I have unsaved changes in my current draft, so that I don't accidentally lose or orphan work.
4. As a developer, I want to see a visual dirty indicator (dot) on documents with unsaved local changes in the sidebar, so that I know which files have pending edits.
5. As a developer, I want to preview differences between a historical version and my current draft before confirming a restore, so that I know exactly what will change.
6. As a developer, I want an "Undo" option immediately after restoring a historical version, so that I can safely recover if I made a mistake.
7. As a developer, I want a clean, spacious header with full visibility of my document title and filename extension, so that I can easily identify what I am editing.
8. As a developer, I want Markdown view controls (Edit, Split, Preview) to be located in the canvas area rather than cluttering the global header, so that the top bar remains clean.
9. As a developer, I want to compare any two historical versions simply by checking two cards on the timeline, so that I don't have to learn a proprietary "Base Anchor" mode.
10. As a developer, I want to compare any historical snapshot against my current working draft with a single click, so that I can quickly verify regressions.
11. As a developer, I want a consistent, prominent Diff Banner at the top of the canvas in all diff modes, so that I always know what two states are being compared.
12. As a developer, I want to press the `Esc` key to exit any diff comparison and return to editing, so that navigation feels native and fast.
13. As a developer, I want an in-app confirmation modal before deleting a document that explicitly informs me how many historical versions will be deleted, so that I don't accidentally destroy valuable audit history.
14. As a developer, I want the tool to use professional vocabulary ("Document", "Version Note") rather than toy terms ("Snippet"), so that the interface reflects the seriousness of production configuration management.
15. As a developer starting with an empty workspace, I want starter templates (SQL, YAML, Docker) and clipboard paste shortcuts, so that I can immediately evaluate the workbench.
16. As a developer, I want a bottom status bar with a one-click "Format Document" button and shortcut indicator, so that I can quickly clean up JSON, SQL, or YAML before diffing.
17. As a developer in diff mode, I want to see a sequential diff chunk counter (e.g. "Change 2 of 5"), so that I know my navigation progress through large configuration files.

## Implementation Decisions

1. **State Management & Navigation Guard**:
   - Introduce a pending navigation interception hook/state in the main workspace controller. When `hasUnsavedChanges` is true and a navigation intent is detected (switching document, switching workspace, or creating a new document), hold the target action and display an in-app `UnsavedChangesModal`.
   - Actions provided: "Save Version & Proceed", "Discard Draft & Proceed", and "Cancel".

2. **Save Flow Architecture**:
   - Deprecate `SaveModal.tsx` in favor of an inline, lightweight `InlineSavePrompt` anchored directly beneath the Header.
   - When `Cmd+S` is triggered, focus the inline input with auto-selected suggested version text (e.g. `Update v3`). Hitting `Enter` immediately commits the snapshot and closes the inline bar. Hitting `Esc` dismisses the prompt without saving.

3. **Restore Safety Pipeline**:
   - When "Restore" is initiated from the history drawer or banner:
     - If the working buffer has unsaved changes compared to the latest version, prompt the user with a diff preview before applying the restore.
     - Store the pre-restore working buffer in a transient undo stack.
     - Upon applying restore, trigger a floating bottom `UndoToast` (5 seconds timeout) that restores the previous working buffer if clicked.

4. **Information Architecture & Header Streamlining**:
   - `EditorHeader` partitioned into three distinct flex zones:
     - Left: Document Title (expandable) + File extension/name + Language badge.
     - Center: View Switcher `[ Edit | Diff (+add/-del) ]`.
     - Right: Version Pill (`vX`), History Trigger (`History (N)`), Save Button (`Save Version`), Overflow Menu (`···`).
   - Move Markdown controls and Diff side-by-side toggles into canvas-anchored floating pills.

5. **History Drawer & Timeline Simplification**:
   - Remove `pickMode`, `setBaseVersionId`, and the `Anchor` icon concept entirely.
   - Each card provides a direct `Compare with Draft` quick action and a multi-select checkbox. Selecting two checkboxes triggers the `vA ↔ vB` diff comparison automatically.

6. **Unified Diff Inspector Bar**:
   - Render a standardized top sticky bar on the canvas whenever `isDiffMode` is active:
     - Left: Source A pill ↔ Source B pill with change stats (+X / -Y).
     - Right: Action buttons (`Restore to Draft`, `Exit Diff (Esc)`).
   - Register a global `Esc` keyboard listener that gracefully closes diff mode.

7. **Destructive Action Protection**:
   - Implement `DeleteConfirmModal` replacing native `confirm()`. Display document title, language, and total version snapshot count to be cascaded.

8. **Developer Status Bar**:
   - Introduce `StatusBar.tsx` docked at the bottom of the workspace:
     - Left: Cursor line & column info, document encoding (UTF-8), language.
     - Center: When in diff mode, display `Change X of Y` with up/down jump arrows.
     - Right: Quick Format Document button (`Shift+Alt+F`), character/line count.

9. **Onboarding Empty State**:
   - Replace the generic empty screen in `page.tsx` with a rich `WorkspaceEmptyState` component featuring template cards (Nacos YAML, MySQL Migration DDL, Kubernetes Service, Docker Compose) and a "Paste from Clipboard" action.

## Testing Decisions

1. **Behavioral Seam & Interaction Testing**:
   - Test user-visible behaviors using `@testing-library/react` without mocking internal component states.
   - Core seams to test:
     - Save workflow: Triggering save, typing note, pressing Enter creates version; pressing Esc dismisses.
     - Navigation guard: Attempting to switch document with unsaved changes renders guard modal; confirming discard loads new document; confirming save persists and switches.
     - Restore workflow: Restoring a historical snapshot updates the editor buffer and renders the undo banner; clicking undo restores previous buffer.
     - Diff mode: Toggling diff mode renders the unified diff inspection banner; pressing Esc returns to editor mode.
     - Deletion guard: Clicking delete opens custom in-app modal; cancelling preserves document; confirming executes deletion.
2. **Regression Verification**:
   - Run the existing 18 test suites (`npm test` / Vitest) to guarantee zero regression across language detection, diff calculations, theme styling, and API routes.

## Out of Scope

- Multi-user collaboration, presence indicators, or server-side locking.
- Cloud storage or Git remote sync (GitHub/GitLab push).
- Multi-file directory tree workspaces (the product is strictly single-document versioning).

## Further Notes

- Author convention: Git commit author must strictly follow `git config user.name` (`BAI YONGJIAN`). No AI agent or assistant names in any author fields.
- WSL platform safety: Never execute any command containing `build` case-insensitively.
- Documentation storage: Stored exclusively in the `docs` directory.
