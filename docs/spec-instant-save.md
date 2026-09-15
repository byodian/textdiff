# Feature Specification: Optimistic Instant Save & Post-Save Annotation

## Problem Statement

In the previous TextDiff architecture, saving a version intercepted the developer's editing flow:
1. **Interruption-Based Interaction**: Pressing `Ctrl+S` (or `Cmd+S`) triggered a popup dialog (initially a blocking full-screen modal, later a localized inline popover). In developer text workbenches (managing SQL, YAML, JSON, Nacos configs, Shell, and Markdown), `Ctrl+S` is an involuntary, subconscious muscle memory reflex. Intercepting it with a prompt creates save fatigue and mental friction.
2. **Cognitive Gating on Routine Snapshots**: Forcing the user to decide whether to enter a version note *before* saving causes hesitation and disrupts typing flow. In practice, developers either enter meaningless placeholder text or mash `Enter` to bypass the prompt.
3. **No Retroactive Documentation**: If a developer realizes after saving that a snapshot contained a critical fix, they cannot attach or modify the version note without rolling back or creating another dummy version.

## Solution

Adopt **Scheme A: Optimistic Instant Save + Post-Save Toast + Timeline In-Place Annotation**:
1. **0ms Optimistic Snapshot**: Pressing `Ctrl+S` / `Cmd+S` or clicking the "Save Version" button immediately creates a historical version snapshot with zero modals, popovers, or focus theft.
2. **Editor Focus Integrity**: The cursor remains locked in the Monaco editor; the Save button displays a 500ms `Saved ✓` visual confirmation.
3. **Post-Save Floating Toast**: A discreet, floating toast appears in the bottom right corner (or adjacent to the status bar) for 4 seconds showing:
   - Version number (`v{N}`)
   - Diff statistics (`+X / -Y lines`)
   - Quick action: `[ Add Note ]`
   - Quick action: `[ Revert Version ]`
4. **Expandable Note Input**: Clicking `[ Add Note ]` (or triggering `Ctrl+Shift+S`) expands the toast in-place into a compact single-line input. Hitting `Enter` saves the note asynchronously via API without reloading or disrupting editor state.
5. **Timeline In-Place Note Editing**: In the `HistoryDrawer`, each version card provides an inline pencil icon / double-click action to edit its commit note at any time retroactively.

## User Stories

1. As a developer, I want to press `Ctrl+S` / `Cmd+S` and have my snapshot saved instantly without any dialog or popup, so that my coding and editing rhythm is 100% uninterrupted.
2. As a developer, I want the Save button to provide subtle visual feedback (e.g. `Saved ✓`) upon saving, so that I have immediate confirmation that my work is persisted.
3. As a developer, I want to see a non-intrusive floating toast after saving that shows the created version number and line diff stats (`+X / -Y`), so that I have situational awareness of my changes without eye strain.
4. As a developer, I want the post-save toast to include an optional `[ Add Note ]` action, so that I can provide context when a milestone is reached without being forced to do so on every routine save.
5. As a developer, I want to click `[ Add Note ]` (or press `Ctrl+Shift+S`) to expand a single-line input in the toast, type a note, and hit `Enter` to attach it to the version, so that annotating is fluid and optional.
6. As a developer, I want an immediate `[ Revert Version ]` button in the post-save toast, so that if I pressed `Ctrl+S` by mistake, I can undo the creation of that snapshot immediately.
7. As a developer, I want to hover over or double-click any version item in the History Drawer to edit its note, so that I can organize and clarify version milestones retroactively.
8. As a developer, I want the system to generate a meaningful fallback note (e.g. `17:50 · +4 -2 lines`) if I choose not to provide a custom note, so that my version timeline remains informative.

## Implementation Decisions

1. **Retiring `SaveModal.tsx` from Primary Workflow**:
   - The primary `handleSavePrompt` in `src/app/page.tsx` is simplified into an immediate `handleInstantSave()` call.
   - When `hasUnsavedChanges` is true, clicking Save or hitting `Ctrl+S` immediately executes `handleSaveVersion()` without setting `isSaveModalOpen(true)`.
   - The obsolete blocking modal is removed from the active save path.

2. **`PostSaveToast` Component**:
   - Create `src/components/PostSaveToast.tsx`:
     - Props: `version: SnippetVersion`, `diffStats: { additions: number, deletions: number }`, `onAddNote: (versionId: string, note: string) => Promise<void>`, `onRevertVersion: (versionId: string) => Promise<void>`, `onClose: () => void`.
     - Timer: 4-second auto-dismiss with pause-on-hover.
     - Mode: Default collapsed capsule (`✓ Saved v{N} (+X/-Y) [Add Note] [Revert]`), expanding into an inline input when `Add Note` is clicked.
     - Keyboard: `Enter` to submit note, `Esc` to dismiss toast.

3. **Backend API Extension for Version Annotation**:
   - Add `PATCH` handler in `src/app/api/snippets/[id]/versions/route.ts` (or `src/app/api/snippets/[id]/route.ts`):
     - Accepts `{ versionId: string, commitMsg: string }`.
     - Updates `SnippetVersion.commitMsg` in Prisma and returns the updated record.
   - Add `DELETE` handler (or revert endpoint) if undoing a newly created snapshot is invoked.

4. **History Drawer Inline Renaming**:
   - Update `src/components/HistoryDrawer.tsx`:
     - Add inline edit state (`editingVersionId`, `editingCommitMsg`).
     - Render an edit icon (pencil) next to the commit message.
     - When active, render a sleek text input that commits on `Enter` or blur, and cancels on `Esc`.

5. **State Management in `page.tsx`**:
   - Track `postSaveToast` state (`{ visible: boolean, version: SnippetVersion | null, diffStats: { additions: number, deletions: number } }`).
   - Track `saveButtonState` (`'idle' | 'saving' | 'saved'`). When save finishes, flash `'saved'` for 600ms before returning to `'idle'`.

## Testing Decisions

1. **Instant Save Seam Test**:
   - Test pressing `Ctrl+S` or clicking the Save button when edits exist triggers version creation without rendering any modal dialog or popover.
   - Verify that `Saved ✓` visual state is briefly applied to the Save button.
2. **PostSaveToast Component Test**:
   - Test rendering of version number, diff stats badge, and action buttons.
   - Test clicking `Add Note` reveals the input and submitting calls the update callback with the typed text.
   - Test clicking `Revert` triggers the revert callback.
   - Test auto-dismiss after timeout.
3. **API Seam Test**:
   - Test `PATCH /api/snippets/[id]/versions` updates the target version's `commitMsg` in the database.
4. **History Drawer Inline Edit Test**:
   - Test activating inline edit mode on a version card, typing a new note, and committing updates the display.

## Out of Scope

- Multi-branch versioning or branching trees (TextDiff maintains a linear version list per document).
- Automatic AI-generated semantic commit messages (can be added in a future enhancement).
- Collaborative real-time cursor indicators.

## Further Notes

- Author convention: Git commits must strictly follow `git config user.name` (`BAI YONGJIAN`).
- WSL platform safety: Never execute any command containing `build` case-insensitively.
- Documentation storage: Stored exclusively in the `docs` directory.
