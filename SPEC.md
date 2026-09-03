# Feature Specification: Online Code Snippet Editor with Diff & Version History

## Problem Statement

Developers and technical writers frequently need to edit, tweak, and format code snippets, configuration files, and structured documents across different languages. However, existing pastebins or lightweight text editors lack intuitive and instant visual diffing against original or previous states, and full git repositories or IDEs are too heavy for quick snippet iterations. Users lack a streamlined, zero-setup, self-hosted web tool where they can paste or write code in multiple formats, inspect differences with flexible side-by-side or unified diff views, save timestamped snapshots with commit notes, and easily compare or revert to historical revisions.

## Solution

A responsive, lightweight full-stack web application built on Next.js 14+ (App Router) and SQLite that allows users to:
1. Create and manage code snippets with automatic language detection based on filenames (or manual selection).
2. Edit code with Monaco Editor (rich syntax highlighting, linting indicators, format document support).
3. Toggle into a Monaco Diff view seamlessly, switching between side-by-side split and unified inline modes with line-change summaries (+/- stats).
4. Save snapshot versions on demand with optional commit notes.
5. Inspect revision histories on a timeline, compare any two arbitrary versions side-by-side, and restore or revert to any prior snapshot with one click.

## User Stories

1. As a developer, I want to create a new code snippet with a title and optional filename, so that I can organize my working drafts.
2. As a developer, I want the editor to automatically detect the programming or data language when I type a filename extension (e.g. \`.ts\`, \`.py\`, \`.yaml\`, \`.sql\`, \`.json\`), so that I get appropriate syntax highlighting without extra clicks.
3. As a developer, I want to manually choose the language from a dropdown, so that I can override auto-detection or set a language when no filename is specified.
4. As a developer, I want a full-featured code editor with syntax highlighting, line numbers, folding, and bracket matching, so that editing feels like a modern IDE.
5. As a developer, I want to format my code snippet with a keyboard shortcut or button, so that my snippet remains clean and readable.
6. As a developer, I want to view diffs between my current working buffer and the last saved version, so that I can review my uncommitted changes before saving.
7. As a developer, I want to toggle between side-by-side split view and inline unified view in the diff viewer, so that I can review changes according to my screen width and personal preference.
8. As a developer, I want to see added and removed line counts in the diff header, so that I have a quick metric of how much code changed.
9. As a developer, I want to navigate through diff changes sequentially (next diff chunk / previous diff chunk), so that I don't miss modifications in long files.
10. As a developer, I want to save a new version of the snippet with an optional commit message/note, so that I can capture a snapshot of my progress with context.
11. As a developer, I want to view a history timeline of all saved versions of a snippet, including creation time, version number, commit message, and author notes, so that I understand how the snippet evolved.
12. As a developer, I want to select any two arbitrary versions from the history timeline and view their diff, so that I can understand changes introduced across non-consecutive revisions.
13. As a developer, I want to revert the current snippet code to any historical version with one click, so that I can recover earlier working logic safely.
14. As a developer, I want to search and filter my snippets from a sidebar list by title or language, so that I can quickly switch between different snippets.
15. As a developer, I want to delete a snippet along with all its version history, so that I can keep my workspace decluttered.
16. As a developer, I want to duplicate an existing snippet, so that I can branch off an experiment without modifying the original snippet.
17. As a developer, I want to copy the snippet content or diff output to my clipboard with one click, so that I can easily share or paste it elsewhere.
18. As a self-hoster, I want the application to store data in a local SQLite database without requiring user accounts or external authentication services, so that deployment and maintenance are effortless.

## Implementation Decisions

- **Full-Stack Architecture**: Next.js 14+ with App Router and TypeScript. Backend logic and data queries are handled directly via Next.js Route Handlers and Server Actions, keeping the codebase in a single unified project.
- **Data Persistence**: SQLite managed via Prisma ORM. SQLite provides zero-config file-based storage suitable for personal self-hosting and local development.
- **Data Models**:
  - \`Snippet\`: Core entity storing \`id\`, \`title\`, \`filename\`, \`language\`, \`currentCode\`, \`createdAt\`, and \`updatedAt\`.
  - \`SnippetVersion\`: Child entity linked via foreign key with cascade delete, storing \`snippetId\`, \`versionNo\`, \`title\`, \`code\`, \`commitMsg\`, and \`createdAt\`.
- **Editor & Diff Component**: \`@monaco-editor/react\` wrapping VS Code's Monaco Editor and Monaco Diff Editor.
- **Language Detection**: A client-side filename parser mapping extensions (\`.js\`, \`.jsx\`, \`.ts\`, \`.tsx\`, \`.py\`, \`.go\`, \`.rs\`, \`.json\`, \`.yaml\`, \`.yml\`, \`.sql\`, \`.html\`, \`.css\`, \`.md\`, \`.sh\`, etc.) to Monaco language identifiers.
- **State Management**: React state hooks with optimistic UI updates for switching snippets, toggling diff views, and selecting comparison versions.
- **Diff Modes**: Configurable Monaco diff editor options dynamically switching between \`renderSideBySide: true\` and \`renderSideBySide: false\` based on the user's toggle state.
- **UI & Layout**: Tailwind CSS responsive layout featuring a collapsible snippet sidebar, an active snippet header with metadata (title, filename, language badge, diff mode switches), a main editor/diff canvas, and a slide-over/tabbed history revisions panel.

## Testing Decisions

- **Testing Philosophy**: Test external user-visible behavior at the highest seam possible rather than mocking internal helper functions or implementation details.
- **Primary Testing Seam**:
  - **Full-Stack Integration / API Seam**: End-to-end HTTP contract tests against Next.js API route handlers verifying snippet CRUD, version snapshot creation, cascade deletions, and version query endpoints using an in-memory or isolated test SQLite database.
  - **Component & Interaction Seam**: Component tests verifying filename-to-language resolution, diff view toggle switches, and history reversion triggers.
- **Prior Art**: Modern Next.js testing patterns utilizing Vitest or Jest with \`@testing-library/react\` and an isolated test SQLite database.

## Out of Scope

- Multi-user authentication, JWT/session management, and role-based permissions (intentionally kept single-user/open local access).
- Real-time collaborative editing (operational transformation or CRDTs like Yjs).
- Cloud storage integrations (e.g. S3, GitHub Gist automatic sync).
- Direct multi-file repository workspace diffing (this tool is strictly scoped to single-file snippets and documents).

## Further Notes

- The design guarantees low barrier to entry: \`npm run dev\` or a single \`docker compose\` container is sufficient to run the entire application.
- Monaco Editor is loaded asynchronously to keep initial bundle size lean.
