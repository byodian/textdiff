# 05: Header Decluttering & Three-Zone Information Architecture

**What to build:**
Reorganize `EditorHeader` into a crisp, spacious 3-zone layout:
1. **Left (Identity)**: Document Title (with adequate min/max widths) + `/` + Filename + Language badge.
2. **Center (Core View Switcher)**: Segmented pill toggle `[ Edit | Diff (+add/-del) ]`.
3. **Right (Actions)**: History button with version count, `Save Version` primary button, and `···` overflow menu.
Move the localized view toggles (Markdown Edit/Split/Preview, Diff Side-by-Side/Inline) out of the top header and into sleek canvas-anchored floating control pills or toolbars.

**Blocked by:**
01: Domain Vocabulary & Terminology Harmonization, 02: Non-blocking Inline Version Snapshot Bar

**Status:** ready-for-agent

- [ ] Structure `EditorHeader` into Left, Center, and Right zones with proper flex shrinkage.
- [ ] Ensure document title has ample space (min 160px up to 320px) without premature truncation.
- [ ] Move Markdown Edit/Split/Preview segmented controls to a floating overlay on the top-right of the markdown editor pane.
- [ ] Move Diff Side-by-Side / Inline toggle to the Diff Inspector header.
- [ ] Retain responsive collapsing for narrow viewports gracefully.
- [ ] Add component tests verifying header rendering and mode switching.
