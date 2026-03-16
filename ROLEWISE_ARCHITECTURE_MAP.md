# ROLEWISE — Architecture Map

> **Last updated:** 2026-03-12
> **Purpose:** Describes the real, current system architecture. Not aspirational — what exists today.

---

## 1. Purpose

Rolewise is a single-user job search intelligence tool. It ingests job descriptions, runs structured AI analysis, tracks roles through a 7-stage hiring pipeline, and accumulates signals/patterns across roles to provide increasingly sophisticated career guidance. The system is designed around a "two-brain" AI architecture: one brain for analytical JD parsing, another for conversational guidance within role workspaces.

---

## 2. Core Product Areas

| Area | Description | Maturity |
|------|-------------|----------|
| **Role Pipeline** | 7-stage hiring funnel (JD Review → Offer) with status tracking, events, snapshots | Production — 81 roles tracked |
| **JD Analysis** | AI-powered job description parsing into traits, blockers, signals, match scores | Production — 93 matches generated |
| **Workspace Chat** | Per-role conversational AI guidance with context-aware responses | Production — 200 conversations |
| **Reasoning Map** | Full-screen SVG knowledge graph for inspecting how the system understands a role | Development — real data integration complete, uses role.latest_match_output |
| **Recruiter Tracking** | Recruiter profiles linked to roles | Early — 4 recruiters |
| **Memory Signals** | Cross-role pattern extraction from conversations and documents | Scaffolded — tables + edge functions exist, 0 rows |
| **Analytics** | Usage telemetry and daily rollups | Early — 32 events, 3 rollups |

---

## 3. File Ownership Map

```
app/
├── index.html                (494 lines)   — HTML shell, 3-column layout, modals, font loading
├── config.js                 (5 lines)     — Supabase URL + anon key
├── app.js                    (22,433 lines) — MONOLITH: all views, state, data layer, AI calls, navigation
├── styles.css                (11,553 lines) — Main stylesheet for all views
├── reasoning-map.js          (2,763 lines)  — Self-contained Reasoning Map IIFE
├── reasoning-map.css         (1,459 lines)  — Reasoning Map styles (couples only to tokens.css)
├── recruiter-backfill.js     (295 lines)    — One-time data repair script
├── design-system/
│   └── tokens.css            (~800 lines)   — CSS custom properties (Untitled UI PRO v7.0, Gray Modern)
├── ai/
│   └── prompts/
│       └── rolewise-prompts.js (~400 lines) — JD Analysis + Chat Guidance prompts + Language Rulebook
└── REASONING-MAP-LOG.md                     — Task log for Reasoning Map refinement work
```

**Ownership rules:**
- `app.js` owns ALL views, ALL state, ALL data functions, ALL navigation. Everything except the Reasoning Map lives here.
- `reasoning-map.js` owns the Reasoning Map feature entirely. It has zero imports from `app.js`. Communication is one-way: `app.js` calls `window.openReasoningMap()`.
- `styles.css` styles everything in `app.js`. `reasoning-map.css` styles only the Reasoning Map.
- `tokens.css` is the shared design foundation. Both `styles.css` and `reasoning-map.css` reference its CSS custom properties.

---

## 4. Data Flow Map

### 4A — Role Creation Flow
```
User pastes JD → app.js creates role row in `roles` table
                → app.js calls _wsRunAnalysis()
                → analyse-jd edge function runs ROLEWISE_JD_ANALYSIS_PROMPT
                → Response stored in `roles.analysis_json`, `jd_matches` row created
                → role_events entry logged
                → renderRoleDoc() re-renders with analysis data
```

### 4B — Chat Flow
```
User types message in workspace → wsAddMessage() inserts into `role_conversations`
                                → _wsTriggerChat() calls workspace-chat edge function
                                → workspace-chat runs ROLEWISE_CHAT_GUIDANCE_PROMPT with role context
                                → Response inserted into `role_conversations`
                                → Workspace re-renders with new message
```

### 4C — Stage Transition Flow
```
User changes role stage → app.js updates `roles.stage` column
                        → role_events entry logged (type: stage_change)
                        → status_events entry logged
                        → role_snapshots entry created (point-in-time state)
                        → renderInbox() re-renders with new stage position
```

### 4D — Reasoning Map Flow
```
User clicks "View Reasoning Map" button (app.js line 722)
  → app.js line 22099-22107: click handler calls window.openReasoningMap(role)
  → reasoning-map.js openReasoningMap(role) receives the enriched role object
  → resolveGraphData(role) called:
      → buildGraphFromRole(role) transforms role.latest_match_output into graph
      → role.latest_match_output sourced from jd_matches.output_json (app.js line 955)
      → Returns { nodes: [], edges: [] } or null
  → If graph exists:
      → computeLayout() positions nodes in arc-based radial layout
      → SVG rendered with full graph
      → User interacts (select, focus, path, search, filter, guided mode)
  → If graph is null (no analysis data):
      → Overlay still built (user has back button)
      → showEmpty() displays "Reasoning Map unavailable for this role"
  → User closes → window.closeReasoningMap() tears down overlay
```

---

## 5. State Model

### Global State (app.js)
| Variable | Type | Purpose |
|----------|------|---------|
| `allRoles` | Array | All role objects for the current user |
| `selectedRoleId` | String/null | Currently selected role ID |
| `currentNav` | String | Active view identifier (drives rendering) |
| `filterState` | Object | Active filters for inbox/list views |
| `userProfile` | Object | Current user's profile data |
| `_profileId` | String | Current user's profile UUID |

### Reasoning Map State (reasoning-map.js)
| Variable | Type | Purpose |
|----------|------|---------|
| `_graphData` | `{ nodes: [], edges: [] }` | Current graph dataset |
| `_state.selectedNodeId` | String/null | Currently selected node |
| `_state.selectedEdgeId` | String/null | Currently selected edge |
| `_state.reasoningPath` | Array | Active BFS reasoning path |
| `_state.focusMode` | Boolean | Whether focus mode is active |
| `_state.zoom` | Number | Current zoom level |
| `_state.pan` | `{ x, y }` | Current pan offset |
| `_guidedStep` | Number | Current step in guided mode |

### State Persistence
- All persistent state lives in Supabase Postgres (26 tables).
- Client state (`allRoles`, `selectedRoleId`, etc.) is hydrated on page load from Supabase queries.
- Reasoning Map state is ephemeral — reset on each open.
- No `localStorage` or `sessionStorage` usage.

---

## 6. Database / Persistence Map

**Provider:** Supabase Postgres
**Region:** eu-west-1
**Project:** `peuaflazxvkkbpbhhjtu`
**RLS:** Enabled on all 26 tables

### Entity Relationships
```
profiles (1)
  └── roles (many) ─── jd_matches (many)
       │                analyses (many)
       │                shared_analyses (many)
       │                role_enrichments (many)
       ├── role_conversations (many)
       ├── role_decisions (many)
       ├── role_interactions (many)
       ├── role_insights (many)
       ├── role_artifacts (many)
       ├── role_documents (many)
       ├── role_memory_signals (many)
       ├── role_updates (many)
       ├── role_events (many)
       ├── role_snapshots (many)
       ├── role_learnings (many)
       ├── status_events (many)
       └── role_recruiters (many) ─── recruiters (many)

profiles (1)
  └── cv_versions (many)
  └── user_trust_state (1)
  └── job_search_snapshots (many)

usage_events (standalone, profile-linked)
usage_daily_rollups (standalone, profile-linked)
abuse_signals (standalone, profile-linked)
skip_reasons (standalone, role-linked)
```

### Key Table: `roles` (39 columns)
Central entity. Holds JD text, company name, salary data, stage, parsed analysis JSON, match scores, recruiter references, timestamps. All other role_* tables join on `role_id`.

---

## 7. AI Surface Map

| Surface | Edge Function | Model | Prompt | Input | Output |
|---------|---------------|-------|--------|-------|--------|
| JD Analysis | `analyse-jd` (v9) | Claude (via Supabase AI) | `ROLEWISE_JD_ANALYSIS_PROMPT` | Raw JD text + user profile | Structured JSON: traits, blockers, signals, match score, reasoning |
| Chat Guidance | `workspace-chat` (v41) | Claude (via Supabase AI) | `ROLEWISE_CHAT_GUIDANCE_PROMPT` | Conversation history + role context + user profile | Natural language guidance response |
| Memory Extract | `memory-extract` (v1) | Claude (via Supabase AI) | Internal | Conversation text | Structured memory signals |
| Document Extract | `document-extract` (v1) | Claude (via Supabase AI) | Internal | Uploaded document content | Structured role data |
| Role Enrichment | `enrich-role` (v1) | Claude (via Supabase AI) | Internal | Role data | Enriched role metadata |
| Smart Endpoint | `smart-endpoint` (v5) | Claude (via Supabase AI) | Dynamic | Varies | Varies |
| Lens Generation | `generate-lens` (v1) | Claude (via Supabase AI) | Internal | Role/analysis data | Analytical lens view |

**Language Governance:** All AI surfaces are constrained by `ROLEWISE_LANGUAGE_RULEBOOK` which enforces consistent tone, terminology, and response structure.

---

## 8. Rendering Responsibility Map

| Component | Renderer | Target Element | Trigger |
|-----------|----------|----------------|---------|
| Sidebar navigation | `app.js` (inline) | `#sidebar` | `currentNav` change |
| Inbox role list | `renderInbox()` | `#main-content` | Nav to inbox |
| Role document | `renderRoleDoc()` | `#main-content` | Role selection |
| Workspace | `renderWorkspaceView()` | `#main-content` | Nav to workspace |
| Radar dashboard | `renderRadarView()` | `#main-content` | Nav to radar |
| Recruiter list | `renderRecruiterList()` | `#main-content` | Nav to recruiters |
| Profile | `renderProfileView()` | `#main-content` | Nav to profile |
| Admin panel | `renderAdminView()` | `#main-content` | Nav to admin |
| Compare view | `renderCompareView()` | `#main-content` | Nav to compare |
| Public page | `renderPublicPage()` | `#main-content` | Nav to public |
| Reasoning Map | `reasoning-map.js` IIFE | Creates own overlay `#rm-overlay` | `window.openReasoningMap()` |
| Modals | `app.js` (various) | Modal containers in `index.html` | User actions |

**Rendering pattern:** Every view function wipes its target container's `innerHTML` and rebuilds from scratch. No virtual DOM, no diffing. Simple and predictable but means full re-renders on every state change.

---

## 9. Extension Rules

### Adding a New View
1. Create a `renderNewView()` function in `app.js`
2. Add a `currentNav` case to the navigation switch
3. Add sidebar link in the nav builder
4. Add styles to `styles.css`

### Adding a New AI Surface
1. Create a new edge function in Supabase
2. Add prompt to `rolewise-prompts.js` (respect Language Rulebook)
3. Add calling function (`_wsXxx`) in `app.js`
4. Wire to UI trigger

### Extending the Reasoning Map
1. All changes go in `reasoning-map.js` and `reasoning-map.css` ONLY
2. Never import from or create dependencies on `app.js`
3. Use `tokens.css` variables for design consistency
4. Test in isolation (the map has its own sample data)

### Adding a New Database Table
1. Create migration via Supabase dashboard or CLI
2. Enable RLS with appropriate policies
3. Add workspace-scoped data functions in `app.js` (`wsXxx` pattern)

---

## 10. Known Risks

| Risk | Severity | Description |
|------|----------|-------------|
| **Monolith fragility** | High | `app.js` at 22,433 lines is a single point of failure. Any edit risks breaking unrelated features. No module boundaries. |
| **No test coverage** | High | Zero automated tests. All verification is manual. Regressions are discovered by users. |
| **No build pipeline** | Medium | No bundler, no minification, no tree-shaking. Raw JS served directly. |
| **Single-user architecture** | Medium | Database schema supports multi-user (RLS is profile-scoped), but all client code assumes single user. |
| **CSS monolith** | Medium | `styles.css` at 11,553 lines with no scoping or naming convention. Style conflicts are likely. |
| **reasoning-map.js file size** | Low | At 2,763 lines the module is large but single-responsibility. Dead sample code was removed (−387 lines 2026-03-12). Monitor as features are added. |
| **Empty pipelines** | Low | Memory signals, document processing, trust state, and learning tables all have 0 rows. Edge functions deployed but workflows not connected end-to-end. |
| **No error boundary** | Medium | No global error handler. A thrown exception can break the entire app with no recovery path. |
| **Token exposure** | Low | Supabase anon key is in `config.js` (this is expected for client-side Supabase, but worth noting). |

---

## 11. Recommended Future Module Split

The 22,433-line `app.js` should eventually be broken into focused modules:

| Proposed Module | Responsibility | Estimated Lines |
|-----------------|---------------|-----------------|
| `core/state.js` | Global state management, navigation | ~500 |
| `core/auth.js` | Supabase auth, session management | ~300 |
| `data/roles.js` | Role CRUD, queries, stage transitions | ~2,000 |
| `data/workspace.js` | Workspace data functions (wsXxx) | ~1,500 |
| `data/recruiters.js` | Recruiter data layer | ~400 |
| `ai/pipeline.js` | AI invocation, prompt routing | ~800 |
| `views/inbox.js` | Inbox view | ~1,500 |
| `views/role-doc.js` | Role document view | ~2,500 |
| `views/workspace.js` | Workspace view | ~2,000 |
| `views/radar.js` | Radar dashboard | ~1,000 |
| `views/profile.js` | Profile view | ~800 |
| `views/compare.js` | Compare view | ~600 |
| `views/recruiter-list.js` | Recruiter list view | ~500 |
| `views/admin.js` | Admin panel | ~500 |
| `views/public.js` | Public page | ~400 |
| `ui/modals.js` | Modal management | ~800 |
| `ui/components.js` | Shared UI components | ~1,000 |
| `utils/helpers.js` | Utility functions | ~500 |

**Note:** This is a recommended future split, not current architecture. Today, all of this lives in `app.js`.

---

## 12. Change Log

| Date | Change | Files |
|------|--------|-------|
| 2026-03-12 | Added provenance metadata to Reasoning Map (PROVENANCE taxonomy, node/edge tagging, inspector integration) | `reasoning-map.js`, `reasoning-map.css` |
| 2026-03-12 | Added `.rm-node--missing` CSS treatment | `reasoning-map.css` |
| 2026-03-12 | Created Reasoning Map task log | `REASONING-MAP-LOG.md` |
| 2026-03-12 | Connected Reasoning Map to real role analysis data (KG-02): buildGraphFromRole, resolveGraphData, null handling | `reasoning-map.js` |
| 2026-03-12 | Created Master Build Ledger | `ROLEWISE_MASTER_BUILD_LEDGER.md` |
| 2026-03-12 | Created Architecture Map | `ROLEWISE_ARCHITECTURE_MAP.md` |
| 2026-03-12 | RM-07: Verified reasoning path highlight end-to-end; G-01 patch — null-path button feedback (+5 lines) | `reasoning-map.js` |
| 2026-03-12 | RM-04 + RM-06: Audit-verified as already fully implemented; doc-only closure (no code changes) | — |
