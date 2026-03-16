# ROLEWISE — Master Build Ledger

> **Last updated:** 2026-03-12 (RM-04 + RM-06 closed — audit-verified as already implemented; RM-13 planning brief produced)
> **Maintainer:** Ross Mackintosh
> **Purpose:** Single source of truth for everything built, in progress, and planned.
> **Rule:** Every feature gets a task ID. Every completion moves to Completed Tasks. Every architectural decision is logged in Build Notes. Every subtask is tracked.

---

## 0. Master Task Index

All features must receive a task ID from this index. All task references throughout the ledger use these IDs.

### Reasoning Map
| ID | Name | Status |
|----|------|--------|
| RM-01 | Create master task log | ✅ Done |
| RM-02 | Audit current Reasoning Map implementation | ✅ Done |
| RM-03 | Add provenance metadata to graph model | ✅ Done |
| RM-04 | Rebuild graph layout as structured radial model | ✅ Done |
| RM-05 | Improve node selection / focus mode | ✅ Done (CSS polish) |
| RM-06 | Add centre-selected + double-click focus | ✅ Done |
| RM-07 | Build reasoning path highlight | ✅ Done |
| RM-08 | Improve graph legibility | ✅ Done |
| RM-09 | Upgrade inspector panel | ✅ Done |
| RM-10 | Polish top bar / workspace chrome | ✅ Done |
| RM-11 | Polish controls / filters | ✅ Done |
| RM-12 | Add lightweight guided mode | ✅ Done |
| RM-13 | Enrich graph data model | Pending |
| RM-14 | QA / verification pass | ✅ Done |
| RM-15 | Final cleanup + implementation report | ✅ Done |

### Knowledge Graph Intelligence Layer
| ID | Name | Status |
|----|------|--------|
| KG-01 | Role Reasoning Graph | ✅ Done |
| KG-02 | Real Data Integration for Reasoning Map | ✅ Done |
| KG-03 | Node Focus Mode | Planned |
| KG-04 | Reasoning Path Highlight | Planned |
| KG-05 | Cross-Role Pattern Graph | Planned |
| KG-06 | Career Trajectory Engine | Planned |
| KG-07 | Graph Data Integrity Rules | Planned |

### Decision Intelligence Layer
| ID | Name | Status |
|----|------|--------|
| JD-01 | Job description parsing engine | ✅ Built (analyse-jd v9) |
| DNA-01 | Role DNA card | Planned |
| KO-01 | Knockout criteria detection | Planned |
| DEC-01 | Decision snapshot system | Planned |
| SIG-01 | Pattern signals engine | Planned |
| ARC-01 | Role archetype clustering | Planned |
| EVD-01 | Evidence card system | Planned |

### Interaction Layer
| ID | Name | Status |
|----|------|--------|
| INT-01 | Suggestion chips | Planned |
| CHAT-01 | Prompt scaffolding | Planned |
| CHAT-02 | Slash commands | Planned |
| CHAT-03 | Context object mentions | Planned |
| ANL-01 | Analysis trace | Planned |

### System
| ID | Name | Status |
|----|------|--------|
| SYS-01 | App.js module extraction | Planned |
| LEDGER-01 | Create Master Build Ledger | ✅ Done |
| LEDGER-02 | Upgrade ledger to operational control document | ✅ Done |
| ARCH-01 | Create Architecture Map | ✅ Done |
| STATE-01 | Create System State file | ✅ Done |
| CTX-01 | Create Working Context file | ✅ Done |
| GOV-01 | Create AI Operating Manual | ✅ Done |

---

## 1. Already Built

### 1A — Core Application Shell
| Feature | File(s) | Lines | Status |
|---------|---------|-------|--------|
| Three-column layout (sidebar / main / panel) | `index.html`, `styles.css` | 494 / 11,553 | Live |
| Supabase auth + RLS | `config.js`, `app.js` | — | Live |
| Design token system (Untitled UI PRO v7.0, Gray Modern) | `design-system/tokens.css` | 1,307 | Live |
| Font stack (Inter, Inter Tight, JetBrains Mono) | `index.html` (Google Fonts) | — | Live |
| Feature flag pattern (`window.ROLEWISE_REASONING_MAP`) | `app.js` line 22099 | — | Live |

### 1B — Views & Navigation
| View | Render Function | Line | Description |
|------|-----------------|------|-------------|
| Inbox | `renderInbox()` | 1208 | Default landing; lists all tracked roles |
| Role Document | `renderRoleDoc()` | 6933 | Full role detail page with JD, analysis, chat |
| Workspace | `renderWorkspaceView()` | 6430 | Per-role workspace with conversations, artifacts, signals |
| Radar | `renderRadarView()` | 19026 | Aggregated signal/pattern dashboard |
| Recruiters | `renderRecruitersView()` | 18654 | Recruiter directory with linked roles |
| Recruiter Detail | `renderRecruiterDetail()` | 18235 | Single recruiter view |
| Profile | `renderProfileView()` | 9906 | User profile + CV management |
| Admin | `renderAdminView()` | 19455 | System admin / debug panel |
| Compare | `renderCompareView()` | 1565 | Side-by-side role comparison |
| Public Page | `renderPublicPage()` | 22264 | Public-facing shareable analysis |
| Reasoning Map | `openReasoningMap()` | reasoning-map.js | Full-screen knowledge graph (separate module) |
| Safeguards | `renderSafeguardsView()` | 20650 | Trust/safety safeguards view |
| Review | `renderReviewView()` | 21196 | Review workflow view |
| Placeholder | `renderPlaceholderView()` | 21631 | Generic placeholder for unbuilt views |

### 1C — AI System (Two-Brain Architecture)
| Brain | Edge Function | Prompt Source | Purpose |
|-------|---------------|---------------|---------|
| JD Analysis Brain | `analyse-jd` (v9) | `ROLEWISE_JD_ANALYSIS_PROMPT` | Parses job descriptions, extracts traits/blockers/signals |
| Chat Guidance Brain | `workspace-chat` (v41) | `ROLEWISE_CHAT_GUIDANCE_PROMPT` | Conversational guidance within a role workspace |
| Language Rulebook | — | `ROLEWISE_LANGUAGE_RULEBOOK` | Shared tone/voice constraints for both brains |

### 1D — Edge Functions
| Function | Version | JWT Required | Status | Purpose |
|----------|---------|--------------|--------|---------|
| `analyse-jd` | v9 | No | ACTIVE | JD parsing and structured analysis |
| `workspace-chat` | v41 | No | ACTIVE | Context-aware role workspace chat |
| `memory-extract` | v1 | No | ACTIVE | Extract memory signals from conversations |
| `document-extract` | v1 | No | ACTIVE | Parse uploaded documents for role data |
| `enrich-role` | v1 | No | ACTIVE | Enrich role with external data |
| `smart-endpoint` | v5 | Yes | ACTIVE | Multi-purpose smart routing endpoint |
| `generate-lens` | v1 | No | ACTIVE | Generate analytical lenses for role views |

### 1E — Database (Supabase, 26 tables, RLS on all)

**Core:**
- `roles` — 81 rows, 39 columns. Central entity. Stores JD text, parsed analysis, stage, company, salary, signals.
- `jd_matches` — 93 rows. Links roles to match scores and analysis results.
- `analyses` — 5 rows. Stores full analysis outputs.

**Workspace:**
- `role_conversations` — 200 rows. Chat history per role workspace.
- `role_decisions` — 4 rows. User decisions (accept/reject/pause) with rationale. Append-only ledger.
- `role_interactions` — 1 row. Tracks user interactions with role data.
- `role_insights` — 7 rows. AI-generated insights per role.
- `role_artifacts` — 46 rows. Generated artifacts (cover letters, prep notes, etc).
- `role_documents` — 0 rows. Uploaded documents linked to roles.
- `role_memory_signals` — 0 rows. Lightweight structured signals extracted from conversations.

**History & Tracking:**
- `role_updates` — 108 rows. Change log for role record mutations.
- `role_events` — 157 rows. Lifecycle events (stage changes, actions).
- `role_snapshots` — 53 rows. Point-in-time role state snapshots.
- `role_learnings` — 0 rows. Accumulated learning data.
- `status_events` — 5 rows. Pipeline status transitions.

**Recruiters:**
- `recruiters` — 4 rows. Recruiter profiles.
- `role_recruiters` — 4 rows. Role-to-recruiter links.

**User:**
- `profiles` — 1 row. User profile data.
- `cv_versions` — 5 rows. CV revisions.

**Analytics:**
- `usage_events` — 32 rows. Raw usage telemetry.
- `usage_daily_rollups` — 3 rows. Aggregated daily metrics.
- `user_trust_state` — 0 rows. Trust level progression.
- `abuse_signals` — 0 rows. Abuse detection data.

**Other:**
- `shared_analyses` — 4 rows. Publicly shared analysis links.
- `skip_reasons` — 0 rows. Reasons for skipping roles.
- `job_search_snapshots` — 1 row. Full search state snapshots.
- `role_enrichments` — 5 rows. External enrichment data.

### 1F — Workspace Data Layer
| Function Pattern | Table(s) Hit | Purpose |
|------------------|-------------|---------|
| `wsAddMessage` | `role_conversations` | Insert chat message |
| `wsLoadMemory` | `role_memory_signals` | Load memory signals for a role |
| `wsLoadSignals` | `role_memory_signals` | Load signal data |
| `_wsTriggerChat` | `workspace-chat` edge fn | Fire chat guidance brain |
| `_wsRunAnalysis` | `analyse-jd` edge fn | Fire JD analysis brain |
| `_wsExtractAndStoreSignals` | `memory-extract` edge fn | Extract + persist signals |
| `_wsProcessUploadedFile` | `document-extract` edge fn | Parse uploaded doc |

### 1G — Intelligence Unlock Gates
| Threshold | Unlock |
|-----------|--------|
| 10+ roles | Hiring signals visible |
| 30+ roles | Decision signals visible |
| 100+ roles | Full pattern engine |

### 1H — Stage Pipeline
`JD Review → Applied → Recruiter Screen → Hiring Manager → Panel → Final → Offer`

### 1I — Reasoning Map (Isolated Module)
| Capability | Status |
|------------|--------|
| Full-screen overlay with SVG graph | ✅ Built |
| 27-node, 28-edge sample dataset | ✅ Built |
| Arc-based radial layout with clock-degree clustering | ✅ Built |
| Evidence pull-to-parent algorithm | ✅ Built |
| Node selection + edge selection | ✅ Built |
| Double-click focus mode | ✅ Built |
| BFS reasoning path traversal | ✅ Built |
| Inspector panel (node, edge, path) | ✅ Built |
| Provenance metadata (origin, evidence, confidence, temporal, scenario) | ✅ Built |
| Search | ✅ Built |
| Filters (focus, strength, signal type) | ✅ Built |
| Keyboard navigation (Tab, Enter, arrows, Escape, F, R, /, +/-) | ✅ Built |
| Guided mode (step-through walkthrough) | ✅ Built |
| Pan/zoom | ✅ Built |
| Accessibility (focus trap, ARIA) | ✅ Built |
| Missing evidence visual treatment | ✅ Built |
| Real data integration (buildGraphFromRole) | ✅ Built |
| Graceful fallback when no analysis data | ✅ Built |

### 1J — Supporting Files
| File | Lines | Purpose |
|------|-------|---------|
| `recruiter-backfill.js` | 295 | Repairs historical roles missing recruiter links |
| `ai/prompts/rolewise-prompts.js` | 254 | Two-brain prompt definitions + language rulebook |

---

## 2. Core Systems

### System 1: Authentication & Authorization
- **Technology:** Supabase Auth
- **Scope:** Single-user (1 profile row), RLS enforced on all 26 tables
- **Session:** Browser-based, Supabase JS client handles token refresh

### System 2: Data Layer
- **Pattern:** Workspace-scoped functions (`wsXxx`) in `app.js`
- **Storage:** Supabase Postgres (eu-west-1, project `peuaflazxvkkbpbhhjtu`)
- **Key tables:** `roles` (39 cols, central entity), `role_conversations`, `role_events`, `role_snapshots`
- **State variables:** `allRoles`, `selectedRoleId`, `currentNav`, `filterState`, `userProfile`, `_profileId`

### System 3: AI Pipeline
- **Architecture:** Two-brain system (JD Analysis + Chat Guidance)
- **Runtime:** Supabase Edge Functions (Deno)
- **Prompt governance:** Centralized in `rolewise-prompts.js` (254 lines) with shared language rulebook
- **Invocation:** `_wsRunAnalysis` → `analyse-jd`, `_wsTriggerChat` → `workspace-chat`

### System 4: Rendering Engine
- **Pattern:** Vanilla JS DOM manipulation; each view is a render function that rebuilds its section
- **Navigation:** `currentNav` state drives which render function fires
- **Layout:** 3-column CSS grid (sidebar + main + panel), responsive
- **Design system:** CSS custom properties from `tokens.css` (Untitled UI PRO v7.0, 1,307 lines)
- **Views:** 14 render functions (see section 1B)

### System 5: Reasoning Map
- **Pattern:** Self-contained IIFE in `reasoning-map.js` (2,745 lines) + `reasoning-map.css` (1,454 lines)
- **Rendering:** Custom SVG with `createElementNS`, CSS class state management
- **Layout:** Arc-based radial with TYPE_ARCS clock-degree clustering
- **Integration:** Feature flag `window.ROLEWISE_REASONING_MAP`, bridge in `app.js` lines 722 + 22099-22107

### System 6: Recruiter System
- **Tables:** `recruiters`, `role_recruiters`
- **Backfill:** `recruiter-backfill.js` (295 lines) repairs historical data
- **Views:** `renderRecruitersView()`, `renderRecruiterDetail()`, `renderRecruiterEditForm()`, `renderRecruiterAddForm()`

---

## 3. Roadmap

### Phase 1 — Foundation (Complete)
- [x] Core app shell + 3-column layout
- [x] Supabase auth + database schema (26 tables, RLS)
- [x] JD Analysis Brain — `analyse-jd` v9 (Task JD-01)
- [x] Chat Guidance Brain — `workspace-chat` v41
- [x] Role pipeline (7 stages)
- [x] Basic views (Inbox, Role Doc, Workspace, Profile, Admin, Compare, Radar, Recruiters, Public, Safeguards, Review)
- [x] Reasoning Map v1 (Task RM-01, RM-03)

### Phase 2 — Intelligence Depth
- [ ] Memory signal extraction pipeline (tables exist, edge function v1 deployed, 0 rows)
- [ ] Document processing pipeline (tables exist, edge function v1 deployed, 0 rows)
- [ ] Role enrichment pipeline (edge function v1 deployed, 5 rows)
- [ ] Intelligence unlock gates (thresholds defined, rendering not yet gated)
- [ ] Trust state progression (table exists, 0 rows)
- [ ] Learning accumulation (table exists, 0 rows)

### Phase 3 — Reasoning Map Refinement
- [ ] RM-02: Audit current implementation
- [x] RM-04: Structured radial layout rebuild
- [ ] RM-05: Improve node selection / focus mode
- [x] RM-06: Centre-selected + double-click focus
- [x] RM-07: Reasoning path highlight polish
- [x] RM-08: Graph legibility improvements
- [x] RM-09: Inspector panel upgrade
- [x] RM-10: Top bar / workspace chrome polish
- [x] RM-11: Controls / filters refinement
- [x] RM-12: Guided mode enhancement
- [ ] RM-13: Enrich graph data model
- [x] RM-14: QA / verification pass
- [x] RM-15: Final cleanup + implementation report

### Phase 3.5 — Knowledge Graph Intelligence Layer

These tasks describe the evolution of Rolewise from JD analysis to graph-based career intelligence.

#### KG-01: Role Reasoning Graph
The foundational knowledge graph that represents how the system reasons about a single role. Built as a self-contained IIFE in `reasoning-map.js`. Includes node types (role, company, trait, blocker, question, career_signal, jd_evidence, missing_evidence, cv, preference, outcome), edge types, arc-based radial layout, inspector panel, search, filters, guided mode, and provenance metadata.

#### KG-02: Real Data Integration for Reasoning Map
Replace sample graph data with real role analysis data from `jd_matches.output_json`. Built `buildGraphFromRole(role)` to transform analysis output into a full graph. Added `resolveGraphData(role)` wrapper with graceful null fallback. Completed.

#### KG-03: Node Focus Mode
Enhanced node selection that centres the selected node and dims unrelated nodes. Double-click to enter focus mode showing only the selected node and its direct connections. Extends existing focus mode infrastructure.

#### KG-04: Reasoning Path Highlight
Highlight the reasoning chain from any node back to the root role node using BFS traversal. Show the path as a distinct visual treatment (thicker edges, brighter nodes). Extends existing `_traceReasoningPath()` infrastructure.

#### KG-05: Cross-Role Pattern Graph
Build a graph that spans multiple roles, showing shared traits, common blockers, and recurring signals across the user's role pipeline. Requires 10+ analysed roles. Feeds into the Radar view.

#### KG-06: Career Trajectory Engine
Use accumulated role data to project career trajectories. Show which role archetypes the user gravitates toward, which signals correlate with positive outcomes, and where the user's career momentum is heading. Requires 20+ analysed roles with decision data.

#### KG-07: Graph Data Integrity Rules
Define validation rules for graph data: required fields per node type, valid edge source/target combinations, provenance completeness checks, and cycle detection. Run validation before rendering to catch malformed data early.

### Phase 4 — Decision Intelligence Layer

These features transform Rolewise from a JD analyser into a decision-support system.

#### DNA-01: Role DNA Card
Displays structured traits extracted from job descriptions. Traits include: industry, company stage, company size, work model, salary transparency, coding expectation, product type. Purpose: make roles legible immediately.

#### KO-01: Knockout Criteria Detection
Detect potential blockers: salary mismatch, hybrid requirement, coding expectation, domain mismatch. User confirms whether these blockers matter. Integrates with existing `role_decisions` table.

#### DEC-01: Decision Snapshot System
When a user skips a role, store: role DNA, blockers, skip reason, short role summary. Purpose: preserve decision memory. Uses `skip_reasons` table (0 rows, exists) and `role_decisions` table (4 rows).

#### SIG-01: Pattern Signals Engine
Activated after approximately 20 analysed roles. Shows patterns: interview signals, low response signals, common blockers, recurring traits. Feeds into Radar view.

#### ARC-01: Role Archetype Clustering
Cluster roles into archetypes: Product Design Owner, Growth Designer, Design Systems Lead, Founding Designer, etc. Rolewise shows which archetype a role resembles. Requires 10+ roles minimum.

#### EVD-01: Evidence Card System
All AI insights must show supporting JD evidence. Inline quote extracts linked to source JD text. Purpose: improve trust and transparency.

### Phase 5 — Interaction Layer

These features improve AI interaction usability.

#### INT-01: Suggestion Chips
Display contextual actions under analysis results. Examples: "show red flags", "recruiter questions", "compare roles". Rendered as clickable chip elements below AI output.

#### CHAT-01: Prompt Scaffolding
Replace empty chat input with suggested prompts: "What would I actually do here?", "What questions should I ask the recruiter?", "What are the red flags?". Disappear on first user input.

#### CHAT-02: Slash Commands
Allow commands in chat input: `/compare` (compare with another role), `/redflags` (list red flags), `/questions` (generate recruiter questions). Parsed before sending to `workspace-chat`.

#### CHAT-03: Context Object Mentions
Allow referencing objects in chat: `@Stripe role`, `@Natter interview`, `@recruiter-name`. Resolved to structured context injected into the chat prompt.

#### ANL-01: Analysis Trace
During JD analysis, show step-by-step progress: "Extracting role traits…", "Detecting signals…", "Comparing patterns…", "Building match score…". Renders as a live progress indicator.

### Phase 6 — Scale & Polish
- [ ] SYS-01: Module extraction (break 22,433-line app.js into focused modules)
- [ ] Performance optimization for 100+ roles
- [ ] Offline support / PWA
- [ ] Public page enhancement
- [ ] Multi-user support (currently single-user)
- [ ] Abuse detection pipeline (table exists, 0 rows)

---

## 4. Active Tasks

| Task ID | Description | Phase | Status | Owner | Started |
|---------|-------------|-------|--------|-------|---------|
| RM-02 | Audit current Reasoning Map implementation | 3 | ✅ Done | AI | 2026-03-12 |
| RM-04 | Rebuild graph layout as structured radial model | 3 | ✅ Done | AI | 2026-03-12 |
| RM-05 | Improve node selection / focus mode (CSS) | 3 | ✅ Done | AI | 2026-03-12 |
| RM-06 | Add centre-selected + double-click focus | 3 | ✅ Done | AI | 2026-03-12 |
| RM-07 | Build reasoning path highlight | 3 | ✅ Done | AI | 2026-03-12 |
| RM-08 | Improve graph legibility | 3 | ✅ Done | AI | 2026-03-12 |
| RM-09 | Upgrade inspector panel | 3 | ✅ Done | AI | 2026-03-12 |
| RM-10 | Polish top bar / workspace chrome | 3 | ✅ Done | AI | 2026-03-12 |
| RM-11 | Polish controls / filters | 3 | ✅ Done | AI | 2026-03-12 |
| RM-12 | Add lightweight guided mode | 3 | ✅ Done | AI | 2026-03-12 |
| RM-13 | Enrich graph data model | 3 | Pending | — | — |
| RM-14 | QA / verification pass | 3 | ✅ Done | AI | 2026-03-12 |
| RM-15 | Final cleanup + implementation report | 3 | ✅ Done | AI | 2026-03-12 |
| DNA-01 | Role DNA card | 4 | Planned | — | — |
| KO-01 | Knockout criteria detection | 4 | Planned | — | — |
| DEC-01 | Decision snapshot system | 4 | Planned | — | — |
| SIG-01 | Pattern signals engine | 4 | Planned | — | — |
| ARC-01 | Role archetype clustering | 4 | Planned | — | — |
| EVD-01 | Evidence card system | 4 | Planned | — | — |
| INT-01 | Suggestion chips | 5 | Planned | — | — |
| CHAT-01 | Prompt scaffolding | 5 | Planned | — | — |
| CHAT-02 | Slash commands | 5 | Planned | — | — |
| CHAT-03 | Context object mentions | 5 | Planned | — | — |
| ANL-01 | Analysis trace | 5 | Planned | — | — |
| KG-03 | Node Focus Mode | 3.5 | Planned | — | — |
| KG-04 | Reasoning Path Highlight | 3.5 | Planned | — | — |
| KG-05 | Cross-Role Pattern Graph | 3.5 | Planned | — | — |
| KG-06 | Career Trajectory Engine | 3.5 | Planned | — | — |
| KG-07 | Graph Data Integrity Rules | 3.5 | Planned | — | — |
| SYS-01 | App.js module extraction | 6 | Planned | — | — |

---

## 5. Completed Tasks

| Task ID | Description | Completed | Files Changed | Notes |
|---------|-------------|-----------|---------------|-------|
| JD-01 | Job description parsing engine | Pre-ledger | `analyse-jd` edge fn (v9), `rolewise-prompts.js` | Core analysis brain. 93 JD matches generated. |
| RM-01 | Create master task log | 2026-03-12 | `REASONING-MAP-LOG.md` | Tracking file for RM work |
| RM-03 | Add provenance metadata to graph model | 2026-03-12 | `reasoning-map.js`, `reasoning-map.css` | PROVENANCE taxonomy (10+5+3+4+4 values), 27 nodes + 28 edges tagged, `_renderProvenance()` helper, inspector integration, `.rm-node--missing` CSS |
| LEDGER-01 | Create Master Build Ledger | 2026-03-12 | `ROLEWISE_MASTER_BUILD_LEDGER.md` | Initial ledger creation |
| LEDGER-02 | Upgrade ledger to operational control document | 2026-03-12 | `ROLEWISE_MASTER_BUILD_LEDGER.md` | Added Master Task Index, Decision Intelligence Layer, Interaction Layer, SYS-01, verification corrections |
| ARCH-01 | Create Architecture Map | 2026-03-12 | `ROLEWISE_ARCHITECTURE_MAP.md` | 12-section architecture document |
| STATE-01 | Create System State file | 2026-03-12 | `ROLEWISE_SYSTEM_STATE.md` | Live system metrics tracking |
| CTX-01 | Create Working Context file | 2026-03-12 | `ROLEWISE_WORKING_CONTEXT.md` | AI developer working memory with current focus, recent changes, open questions, temp notes, next tasks |
| KG-02 | Connect Reasoning Map to real role analysis data | 2026-03-12 | `reasoning-map.js` | buildGraphFromRole (~350 lines), resolveGraphData, null handling in all callers, 12 node types, 11 edge types, provenance tagging, graceful fallback |
| GOV-01 | Create AI Operating Manual | 2026-03-12 | `ROLEWISE_AI_OPERATING_MANUAL.md` | AI governance rules: safety editing, change declarations, post-change reports, documentation update requirements |
| RM-02 | Audit current Reasoning Map implementation | 2026-03-12 | (documentation only) | Full audit: KG-02 verification (7 checks passed), UX assessment, strengths/weaknesses, risk inventory. Edge type mismatch initially reported but later found to be incorrect — all emitted types exist in EDGE_DEFS. |
| RM-05 | Improve node selection / focus mode (CSS) | 2026-03-12 | `reasoning-map.css` | Strengthened `rm-node--connected` (body opacity 0.92, label opacity 0.85, ring opacity 0.3). Strengthened `rm-edge--active` (stroke-width 2.8, brightness 1.15). 8 lines added. Zero JS changes. |
| RM-08 | Improve graph legibility (CSS) | 2026-03-12 | `reasoning-map.css` | Node labels: 11px weight 500 (was 10.5px/400). Dimmed nodes: body/icon 0.18, label 0.15 (was 0.12). Connected label: 0.92 (was 0.85). Edge labels: 10.5px (was 9.5px). Dimmed edges: 0.10 (was 0.06). 2 lines added, 5 values changed. Zero JS changes. |
| RM-09 | Upgrade inspector panel (CSS) | 2026-03-12 | `reasoning-map.css` | Header padding 16/12 (was 14/10). Section padding 12px (was 10). Section title gap 9px (was 7). Evidence bar 6px/12px (was 5/11). Metadata key/val contrast improved. Connection list gap 5px (was 3). 10 value changes, 0 lines added. Zero JS changes. |
| RM-10 | Polish top bar / workspace chrome (CSS) | 2026-03-12 | `reasoning-map.css` | Top bar padding balanced (14px both sides). Right controls gap 6px (was 4). Dividers taller (24px, was 20) and darker (--border, was --border-light). Divider margin 6px (was 4). Centre stats gap 12px (was 10). Canvas inset shadow for depth. Sidebar section bottom padding 8px (was 6). 7 changes, 1 line added. Zero JS changes. |
| RM-11 | Polish controls / filters (CSS) | 2026-03-12 | `reasoning-map.css` | Sidebar label gap 8px (was 7). Focus pills: gap 5px (was 4), padding 4px 9px (was 3px 8px). Node toggles: gap 3px (was 2), row padding 5px (was 4). Strength: gap 5px (was 4), padding 4px 10px (was 3px 9px), active font-weight 600. Signal toggles: gap 3px (was 2), row padding 5px (was 4). Actions gap 5px (was 4). 11 changes, 1 line added. Zero JS changes. |
| — | Dead sample cleanup | 2026-03-12 | `reasoning-map.js` | Removed buildSampleGraph (355 lines), loadSampleData (25 lines), #rm-btn-load-sample button + event wiring. −387 lines total. Zero behaviour changes. |

---

## 6. Build Notes

### 2026-03-12 — Ledger Verification Corrections
- `tokens.css` corrected from ~800 to 1,307 lines
- `rolewise-prompts.js` corrected from ~400 to 254 lines
- Added 4 missing views to section 1B: `renderSafeguardsView()` (line 20650), `renderReviewView()` (line 21196), `renderRecruiterDetail()` (line 18235), `renderPlaceholderView()` (line 21631)
- Corrected recruiter view entry point from `renderRecruiterList()` to `renderRecruitersView()` (line 18654)
- Added line numbers for all render functions
- Added JWT requirement column to edge functions table (only `smart-endpoint` requires JWT)
- Confirmed all 26 tables match live Supabase schema exactly
- Confirmed all 7 edge functions match live deployment exactly

### 2026-03-12 — Reasoning Map Provenance
- Added full provenance metadata taxonomy: `origin_type` (10 values), `evidence_mode` (5), `confidence_band` (3), `temporal_scope` (4), `scenario_state` (4)
- All 27 sample nodes and 28 sample edges tagged with provenance data
- Shared `_renderProvenance()` helper renders metadata in both node and edge inspectors
- Added `.rm-node--missing` CSS for missing_evidence visual treatment (italic label, reduced opacity)

### 2026-03-12 — Architecture Scan
- Full codebase scan: `app.js` (22,433 lines), `styles.css` (11,553), `reasoning-map.js` (2,532), `reasoning-map.css` (1,440), `tokens.css` (1,307), `index.html` (494), `recruiter-backfill.js` (295), `rolewise-prompts.js` (254), `config.js` (5)
- Database: 26 tables, all with RLS. 81 roles, 200 conversations, 157 events, 53 snapshots.
- Edge functions: 7 deployed (analyse-jd v9, workspace-chat v41, memory-extract v1, document-extract v1, enrich-role v1, smart-endpoint v5, generate-lens v1)

### 2026-03-12 — Edge Type Verification (documentation correction)
- Re-verified all edge types emitted by `buildGraphFromRole`: supports, conflicts_with, linked_to, mentions, recommends, weakens, missing_evidence_for
- All 7 emitted types already exist in `EDGE_DEFS` (lines 50–62)
- Previous audit (RM-02) incorrectly reported a mismatch. The mismatched types (supported_by, contradicts, shaped_by, etc.) were from the design spec in the prior conversation, not from the actual implementation
- Corrected RM-02 notes in ledger, REASONING-MAP-LOG.md, and ROLEWISE_WORKING_CONTEXT.md
- No code changes needed. Zero lines added/modified/removed in product files.

### 2026-03-12 — Dead Sample Cleanup
- Removed `buildSampleGraph()` (355 lines, 0 callers since KG-02 replaced it with `buildGraphFromRole`)
- Removed `loadSampleData()` (25 lines, misleading name — was duplicate of `initGraph` that called `resolveGraphData`, never used sample data)
- Removed `#rm-btn-load-sample` button from empty-state HTML template (dead end — clicked button retried real data, not sample data)
- Removed event listener wiring for `#rm-btn-load-sample`
- Updated section comment "SECTION 2" to note removal
- File shrank from 3,132 to 2,745 lines (−387 lines)
- Zero behaviour changes. Real-data flow intact. Empty state still shows title + description. Error retry button still works.
- Resolves open question #6 from Working Context ("Should buildSampleGraph be removed?")

### 2026-03-12 — Controls / Filters Polish (RM-11)
- CSS-only patch to `reasoning-map.css` (11 changes across 11 CSS blocks, 1 line added)
- Sidebar labels: margin-bottom 8px (was 7) — cleaner label-to-content separation
- Focus pills: gap 5px (was 4), padding 4px 9px (was 3px 8px) — better tap targets and spacing
- Node toggles: list gap 3px (was 2), row padding 5px (was 4) — clearer row separation
- Strength buttons: gap 5px (was 4), padding 4px 10px (was 3px 9px), active font-weight 600 — bolder active state
- Signal toggles: list gap 3px (was 2), row padding 5px (was 4) — consistent with node toggles
- Graph actions: gap 5px (was 4) — consistent with other control groups
- File grew from 1,453 to 1,454 lines (+1 line from font-weight addition)
- Zero JS changes. Zero filter logic changes. Zero rendering changes.

### 2026-03-12 — Top Bar / Workspace Chrome Polish (RM-10)
- CSS-only patch to `reasoning-map.css` (7 changes across 7 CSS blocks, 1 line added)
- Top bar: padding balanced to 14px both sides (was 0 12px 0 8px — asymmetric)
- Right controls: gap 6px (was 4px) — buttons less cramped
- Dividers: height 24px (was 20px), color `--border` (was `--border-light`), margin 6px (was 4px) — taller, more visible separators
- Centre stats: gap 12px (was 10px) — less crowded
- Canvas: added `box-shadow: inset 0 1px 3px rgba(10,13,18,0.04)` — subtle depth at top edge
- Sidebar sections: bottom padding 8px (was 6px) — balanced vertical rhythm
- File grew from 1,452 to 1,453 lines (+1 line from box-shadow addition)
- Zero JS changes. Zero rendering logic changes. Zero layout changes.

### 2026-03-12 — Inspector Panel Upgrade (RM-09)
- CSS-only patch to `reasoning-map.css` (10 value changes across 10 CSS blocks)
- Header: padding 16px/12px (was 14/10), title margin 6px (was 4) — more breathing room for primary identification
- Sections: padding 12px (was 10), title margin-bottom 9px (was 7) — clearer separation between sections
- Evidence bar: track 6px (was 5), value 12px/#181d27 (was 11px/#535862) — percentage pops as critical info
- Metadata table: keys darkened to #535862 (was #697586), values darkened to #181d27 (was #535862) — proper key-value hierarchy
- Connected nodes: list gap 5px (was 3), row padding 6px (was 5) — distinct clickable rows
- File remains 1,452 lines (0 lines added, all edits are value swaps)
- Zero JS changes. Zero rendering logic changes. Zero layout changes.

### 2026-03-12 — Graph Legibility Improvements (RM-08)
- CSS-only patch to `reasoning-map.css` (7 edits across 5 CSS blocks)
- Node labels: added `font-size: 11px; font-weight: 500` to `.rm-node-label` (was inheriting 10.5px/400 from JS inline attrs — CSS overrides SVG presentation attributes)
- Dimmed state softened: body/icon opacity 0.12 → 0.18, label opacity 0.12 → 0.15 (keeps nodes receded but preserves spatial orientation)
- Connected label opacity 0.85 → 0.92 (neighbourhood more readable)
- Edge labels enlarged: 9.5px → 10.5px (readable when shown on hover/selection)
- Dimmed edge opacity 0.06 → 0.10 (edges remain visible enough to trace paths)
- Visual hierarchy preserved: selected (600/1.08/drop-shadow) > connected (500/0.92) > dimmed (0.15-0.18)
- File grew from 1,450 to 1,452 lines (+2 lines from font-size and font-weight additions)
- Zero JS changes. Zero layout changes. Zero rendering logic changes.

### 2026-03-12 — Reasoning Map Audit + Focus Polish (RM-02, RM-05)
- RM-02: Full code audit of Reasoning Map. KG-02 verified across 7 checks. Confirmed all callers handle null. Confirmed zero calls to buildSampleGraph. Initially reported edge type mismatch (CORRECTED: all emitted types exist in EDGE_DEFS — the mismatch was between the design spec and the implementation, not between the implementation and the constant). rm-btn-load-sample dead end deferred.
- RM-05: CSS-only polish to node focus neighbourhood. Connected node body opacity raised from implicit 1.0 to explicit 0.92 (vs dimmed at 0.12). Connected label made readable (opacity 0.85, darker fill). Connected ring added at 0.3 opacity. Active edges widened to 2.8px with brightness filter. Zero JS changes.
- buildSampleGraph cleanup deferred (354 lines dead code, but serves as reference and user has open question about it)

### 2026-03-12 — Project Governance Layer (GOV-01)
- Created `ROLEWISE_AI_OPERATING_MANUAL.md` defining AI operational rules
- Added Knowledge Graph Intelligence Layer to roadmap (Phase 3.5) with tasks KG-01 through KG-07
- KG-01 (Role Reasoning Graph) retroactively marked as done (covers RM-01, RM-03 foundation work)
- KG-02 (Real Data Integration) already completed
- KG-03 through KG-07 planned as the evolution toward graph-based career intelligence

### 2026-03-12 — Reasoning Map Real Data Integration (KG-02)
- Added `buildGraphFromRole(role)` function (~350 lines) that transforms `role.latest_match_output` (from `jd_matches.output_json`) into a full graph
- Node types generated: role, company, recruiter, trait, blocker, question, career_signal, jd_evidence, missing_evidence, cv, preference, outcome
- Edge types used: supports, conflicts_with, linked_to, mentions, recommends, weakens, missing_evidence_for (all match existing EDGE_DEFS — corrected from earlier incorrect list)
- Added `resolveGraphData(role)` wrapper: returns real graph or null (no sample data fallback)
- Updated all three callers (`initGraph`, `openReasoningMap`, `loadSampleData`) with null handling — shows "Reasoning Map unavailable for this role" via `showEmpty()`
- `openReasoningMap` null path still builds the overlay so the user sees a proper empty state with back button
- `reasoning-map.js` grew from 2,532 to 3,132 lines
- Data source: `role.latest_match_output` (set in `app.js` line 955 from `jdOutputMap[r.id]`)
- No changes to `app.js` — bridge already passes role object correctly

### 2026-03-12 — Architectural Decision: SYS-01 Module Extraction
- Current `app.js` at 22,433 lines is the primary technical debt risk
- Proposed modules: `role-analysis.js`, `role-renderers.js`, `workspace-chat.js`, `radar-engine.js`, `state-store.js`, `salary-utils.js`
- Decision: log the task, do not refactor yet. Prioritise feature work first.

---

## 7. Subtasks

### Reasoning Map Refinement (RM-02 through RM-15)
See `app/REASONING-MAP-LOG.md` for detailed task breakdown.

| Parent | Subtask | Status |
|--------|---------|--------|
| RM-03 | Add PROVENANCE constant | ✅ Done |
| RM-03 | Tag all sample nodes with provenance | ✅ Done |
| RM-03 | Tag all sample edges with provenance | ✅ Done |
| RM-03 | Build `_renderProvenance()` helper | ✅ Done |
| RM-03 | Integrate provenance into node inspector | ✅ Done |
| RM-03 | Integrate provenance into edge inspector | ✅ Done |
| RM-03 | Add `.rm-node--missing` CSS | ✅ Done |

### KG-02 Real Data Integration Subtasks
| Parent | Subtask | Status |
|--------|---------|--------|
| KG-02 | Identify real data sources (jd_matches.output_json, analyses, role columns) | ✅ Done |
| KG-02 | Build `buildGraphFromRole(role)` function | ✅ Done |
| KG-02 | Add `resolveGraphData(role)` wrapper | ✅ Done |
| KG-02 | Provenance tagging on all generated nodes | ✅ Done |
| KG-02 | Handle missing information with `.rm-node--missing` style | ✅ Done |
| KG-02 | Null handling in `initGraph` | ✅ Done |
| KG-02 | Null handling in `openReasoningMap` | ✅ Done |
| KG-02 | Null handling in `loadSampleData` | ✅ Done |

### SYS-01 Module Extraction (Planned Subtasks)
| Parent | Subtask | Status |
|--------|---------|--------|
| SYS-01 | Extract `role-analysis.js` — JD analysis pipeline + match logic | Planned |
| SYS-01 | Extract `role-renderers.js` — Role Doc + Inbox render functions | Planned |
| SYS-01 | Extract `workspace-chat.js` — Chat UI + workspace data functions | Planned |
| SYS-01 | Extract `radar-engine.js` — Radar view + pattern logic | Planned |
| SYS-01 | Extract `state-store.js` — Global state management + navigation | Planned |
| SYS-01 | Extract `salary-utils.js` — Compensation parsing + display | Planned |

---

## 8. Ongoing Rules

1. Every new feature must receive a task ID from the Master Task Index (section 0).
2. Completed tasks must move from Active Tasks (section 4) to Completed Tasks (section 5).
3. Architectural decisions must be logged in Build Notes (section 6).
4. New subtasks discovered during development must be logged in Subtasks (section 7).
5. The ledger must always reflect the real system state — verified against the codebase.
6. File line counts and database row counts should be re-verified periodically.
7. The `ROLEWISE_SYSTEM_STATE.md` file should be updated when significant data changes occur.
8. Update `ROLEWISE_WORKING_CONTEXT.md` whenever development begins on a new task.
