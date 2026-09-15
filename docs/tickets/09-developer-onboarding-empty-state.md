# 09: Developer Empty States & Onboarding Starter Templates

**What to build:**
Upgrade the barren empty workspace screen into an engaging developer onboarding experience.
1. When no document is selected or the document list is empty, display curated starter templates:
   - **Nacos / Spring Cloud Config** (`application.yml`)
   - **MySQL Migration DDL** (`V1__schema_init.sql`)
   - **Docker Compose Service** (`docker-compose.yml`)
   - **Shell Automation Script** (`deploy.sh`)
2. Offer a prominent "Paste from Clipboard" action that automatically detects the syntax and creates a new document.
3. In the empty history drawer, provide visual onboarding explaining how version snapshots work.

**Blocked by:**
01: Domain Vocabulary & Terminology Harmonization, 05: Header Decluttering & Three-Zone Information Architecture

**Status:** ready-for-agent

- [ ] Create `WorkspaceEmptyState` component with developer template cards.
- [ ] Clicking a template creates a new document populated with standard snippet scaffolding.
- [ ] Add "Paste from Clipboard" button that attempts clipboard read (falling back to manual paste prompt).
- [ ] Upgrade empty `HistoryDrawer` view with clear pictorial guidance on taking snapshots.
- [ ] Add tests verifying template creation and empty state rendering.
