# ADR 0001: Optimistic Instant Save with Post-Save Annotation

## Status
Accepted

## Context
In developer configuration and script editing (SQL, YAML, JSON, Shell, Markdown), `Ctrl+S` (or `Cmd+S`) is an involuntary muscle-memory operation executed dozens of times per session. In previous iterations, TextDiff intercepted this shortcut with either a full-screen blocking modal or a localized inline popover asking for an optional version summary. 

Even though an inline popover removed the visual backdrop, it retained the fundamental flaw of **interruption-based UX**: the user's focus was stolen from the editor, forcing a micro-decision ("Should I type a note or press Enter to skip?") and inducing save fatigue.

## Decision
We adopt **Optimistic Instant Save with Post-Save Toast and In-Place Note Annotation**:
1. **Zero-Latency Execution**: Pressing `Ctrl+S` or clicking the "Save Version" button immediately commits a snapshot version to storage without popping up any prompt, modal, or confirmation dialog.
2. **Editor Focus Continuity**: Focus remains pinned inside the Monaco editor throughout the save cycle. The save button displays a transient 500ms `Saved ✓` confirmation state.
3. **Non-Intrusive Post-Save Toast**: A lightweight, floating notification appears in the lower corner for 3 seconds displaying the newly created version number (`v{N}`), diff metrics (`+X / -Y lines`), and two optional actions: `[ Add Note ]` and `[ Revert ]`.
4. **Retroactive Annotation**: If the user clicks `[ Add Note ]` or presses `Ctrl+Shift+S`, the toast expands in place into a single-line input to attach a version summary asynchronously.
5. **Timeline In-Place Editing**: All version cards in the `HistoryDrawer` support double-clicking or clicking a pencil icon to add or edit the version summary at any time in the future.

## Considered Options
1. **Modal / Inline Popover Interception (Rejected)**:
   - *Pros*: Guarantees users are aware they can provide a version note before saving.
   - *Cons*: Destroys editing flow, introduces save anxiety/fatigue, and forces frequent redundant keystrokes (`Ctrl+S` followed by `Enter`).
2. **Dual-Key Bifurcation (`Ctrl+S` for Silent Snapshot, `Ctrl+Shift+S` for Named Milestone) (Rejected as primary flow)**:
   - *Pros*: Separates quick checkpoints from formal milestones.
   - *Cons*: Adds cognitive complexity and requires users to categorize their edits upfront before saving.
3. **Persistent Commit Input Bar in Header (Rejected)**:
   - *Pros*: Zero modal popup; users can type a note ahead of time.
   - *Cons*: Permanently consumes valuable horizontal header space, often stays blank, and adds visual clutter.
4. **Optimistic Instant Save + Post-Save Toast (Accepted)**:
   - *Pros*: 0ms interruption, preserves IDE muscle memory, provides retroactive note-taking, and includes safety rollback.

## Consequences
- **Positive**:
  - `Ctrl+S` operates identically to VS Code, Sublime, and JetBrains IDEs.
  - Zero cognitive overhead on routine saves; users can snapshot as frequently as they want.
  - Eliminates the `SaveModal.tsx` blocking dialogue in the primary user path.
  - Gives users retroactive control over documentation rather than enforcing upfront gatekeeping.
- **Negative / Trade-offs**:
  - Many versions will be created without custom notes (they will default to automatic timestamp/diff stat summaries like `17:50 · +4 -2 lines`). This is mitigated by timeline searchability and in-place renaming.
  - Requires an API endpoint or payload support to update a version's summary retroactively (PATCH / PUT version note).
