# ADR 0002: Local-First Storage Architecture for Public Serverless Deployment

## Status
Accepted

## Context
TextDiff is intended for public, unauthenticated access deployed on Cloudflare (e.g. Cloudflare Pages or Cloudflare Workers). 
Previously, the application utilized a centralized server-side SQLite database accessed via Next.js `/api/*` endpoints. 

In a public deployment without user authentication:
1. **Shared Database Problem**: All unauthenticated visitors would read and write to the same central database, exposing private code snippets, causing data collisions, and creating severe security and privacy risks.
2. **Serverless Database Bottlenecks**: Hosting an external server database or Cloudflare D1 introduces operational costs, latency, cold starts, and connection pool limitations for high concurrency.
3. **Privacy Expectations**: Developers pasting sensitive configuration files (e.g. MySQL migrations, Nacos YAMLs, API payloads) expect zero server leakage and complete data sovereignty.

## Decision
We migrate TextDiff to a **Local-First Architecture** utilizing browser-native **IndexedDB**:

1. **Client-Side Storage Engine (`IndexedDB`)**:
   - All workspaces, document snippets, and historical versions are persisted directly in the visitor's browser IndexedDB.
   - Storage capacity is virtually unlimited (hundreds of MBs to multiple GBs depending on device disk space), avoiding the 5MB synchronous bottleneck of `localStorage`.
   - Each visitor possesses an entirely isolated, zero-latency local database.

2. **Decoupled Storage Provider Layer (`src/lib/storage`)**:
   - Standardize all repository operations under a unified, promise-based Storage Provider interface:
     - `workspaces`: `list()`, `create(name)`, `rename(id, name)`, `delete(id)`
     - `snippets`: `list(workspaceId?)`, `get(id)`, `create(data)`, `update(id, data)`, `delete(id)`
     - `versions`: `list(snippetId)`, `update(versionId, commitMsg)`, `delete(versionId)`
     - `backup`: `exportBackup()`, `importBackup(jsonString)`
   - Provide an in-memory/fallback mode for server-side rendering (SSR) and non-browser test runners (Vitest in jsdom).

3. **Pure Static Export (`next export`)**:
   - Remove reliance on Node.js runtime and server-side `/api/*` routes.
   - Configure Next.js for static HTML/JS/CSS export (`output: 'export'`), allowing deployment to Cloudflare Pages / Workers Static Assets at zero cost, infinite scalability, and global CDN caching.

4. **Data Portability**:
   - Implement one-click JSON backup export and restore capabilities so developers can transfer, backup, or restore their documents and revision timelines across browsers and machines.

## Considered Options
1. **Shared Cloud Database with Anonymous Session IDs (Rejected)**:
   - *Pros*: Data synced to cloud; allows URL-based link sharing.
   - *Cons*: High database costs, privacy concerns for sensitive enterprise code, risk of data loss if cookies/tokens expire, complex TTL / garbage collection logic for abandoned sessions.
2. **`localStorage` Only (Rejected)**:
   - *Pros*: Simple API.
   - *Cons*: 5MB quota limit, synchronous I/O blocks UI during large file diffs, cannot reliably store dozens of large version snapshots.
3. **Browser IndexedDB with Backup Export (Accepted)**:
   - *Pros*: True zero-backend serverless architecture, 100% private and confidential, offline capability, 0ms read/write latency, seamless export/import.
   - *Cons*: Data is scoped to the specific browser profile until explicitly exported by the user.

## Consequences
- **Positive**:
  - Zero server database costs and zero maintenance overhead.
  - Complete data privacy: code never leaves the user's browser.
  - Ultra-fast 0ms latency for save, diff, and workspace switching.
  - Can be hosted on any static platform (Cloudflare Pages, Vercel, GitHub Pages).
- **Negative / Trade-offs**:
  - Clearing browser site data deletes local records; addressed by adding explicit Export/Import JSON backup functionality.
