# HOW_THE_APP_WORKS — RoleWise

> Generated: 2026-04-14. Plain-prose narrative of every important flow, end to end. Read once; refer back when something surprises you.

---

## 0. Boot

When `index.html` loads, the browser fetches the Tailwind CDN, `styles.css`, and the JS files. `app.js` runs as a single IIFE — no module system, no entry function called from the outside. It assigns Supabase client constants, sets up theme + appearance from localStorage, and at the bottom of the file calls `refresh()`.

`refresh()` does the following in sequence:
1. Loads the user's profile from `profiles`.
2. Loads `candidate_profile` and `candidate_learning` (creates blank rows if missing).
3. Loads roles from `roles` into the `allRoles` global array.
4. Pre-loads brand assets into the in-memory cache.
5. Calls `renderInbox(allRoles)`.
6. After the boundary cache settles, calls `renderInbox(allRoles)` **again** to reflect blocker badges.

(Step 6 is the source of PERFORMANCE_HOTSPOTS #5's "renderInbox called twice at boot" — easy to fix with a flag.)

By this point the inbox is on screen, no role is selected, and the centre column shows the Overview view (or the candidate setup card if profile is empty).

---

## 1. Add a JD

The user clicks `+ Add JD` (top-left). `switchNav` routes nothing; the button calls `openIngestionOverlay()` directly (`app.js:13450`), which sets `#rw-ingestion-overlay` to visible and starts the ingestion timer.

The overlay accepts:
- raw paste,
- a URL,
- a LinkedIn URL (special-cased),
- a file upload (PDF/DOCX go through extractor edge functions; not all paths are local).

When the user submits, `doIntakeSubmit(text, opts)` (`app.js:~6701`) orchestrates the multi-step pipeline:

### 1a. Local extraction

`runJDExtractionV2(text)` (`app.js:21696`) runs the pure JD extractor — the layered Engine v2 that detects salary, work model, location, IR35, etc. This is fast (sub-100 ms) and gives a partial structured object even before the network request.

### 1b. Network analysis

`callAnalysisAPI(role, jdText, opts)` (`app.js:24710`) invokes the `analyse-jd` Supabase edge function, which calls Claude with the user's profile + learning context. The function streams progress via callbacks that update the overlay's phase pill.

### 1c. Merge

`_mergeJDExtractionWithAI(extracted, aiPracticalDetails)` (`app.js:21740`) reconciles local extraction with AI output, preferring the more confident source.

### 1d. Persist

The role row is inserted into `roles` (or updated if the URL collides), the analysis JSON into `jd_matches` and `analyses`, and a denormalised row into `role_decision_snapshots` for snapshotting purposes. An audit row goes into `role_updates`.

### 1e. Enrich

`enrich-role` (`app.js:~25349` inline) returns inferred enrichments — hard-no signals, frictions, viability — and saves to `role_enrichments`.

### 1f. Narrate

`generate-narrative` produces a short narrative paragraph — saved as part of the role record.

### 1g. Render

The overlay closes, `allRoles` is updated locally (no full refetch), `renderInbox` is called, and `selectRole(newId)` opens the new role's detail view.

Failure modes: the overlay surfaces the failing phase via `.ws-save-warning` (`app.js:80`) which auto-removes after 12 seconds. Most sub-saves are fire-and-forget; if `_saveCandidateDecisionExt` fails, the user never sees it (PERFORMANCE_HOTSPOTS #11).

---

## 2. Browse / select a role

The inbox is rendered by `renderInbox(allRoles)` — a single function that filters by `inboxTab` (active/archive) and the filter panel checkboxes, sorts (recency/match), and writes the entire HTML string to `#role-inbox`.

When the user clicks a card, the change handler calls `selectRole(roleId)`:
1. Sets `selectedRoleId` global.
2. Triggers panel transition (5 separate `_panels.forEach` loops — PERFORMANCE_HOTSPOTS #9).
3. Calls `renderRoleDoc(role)` for the centre column and `renderRail(role)` for the right.
4. Calls `renderWorkspaceView(role)` for the chat panel, which mounts `_renderDocumentsPanel`, the timeline, the chat bar.
5. Loads workspace memory in parallel via `wsLoadMemory(roleId)` (single Promise.all of conversations + interactions + insights + artifacts).

The IntersectionObserver at `app.js:11340` watches the detail strip; when it scrolls out of view, `#role-sticky-header` is revealed.

---

## 3. The match output

`renderMatchOutput(role, output)` (`app.js:17925`) is the big centre card. It iterates through the analysis output's named sections (salary, practical, culture, friction, decision lens, deep context, next steps) and renders each. Section renderers live partly in app.js and partly in `analysis/render.js` (`renderDecisionBlock`, `renderMatchBreak`).

Each section has an inline "Add note" / "Correct this" affordance that goes through the section-context CRUD (`_scSet`) — values are stored in the `roles.section_context` JSON column and re-applied on every render of the role.

Signal classification is delegated to `analysis/signals.js`, which exposes `window.RW_classifySignals(role, profile, learning)` — a pure function returning labelled `{type, label, severity, reasoning}` items.

---

## 4. Make a decision

The decision banner (`app.js:2153`) shows the current state and the action buttons. When the user clicks Apply / Skip / Pass / Withdraw:

1. `wsAppendDecision(roleId, decisionType, reason, notes)` (`app.js:61`) inserts a row in `role_decisions`.
2. **Within that function**, three fire-and-forget side-effects fire in parallel:
   - `_saveDecisionSnapshot(role, decision)` snapshots the role's DNA + confirmed blockers into `role_decision_snapshots`.
   - `_saveCandidateDecisionExt(role, decisionType, opts)` writes extended learning data to `role_decisions_ext`.
   - `_updateCandidateLearningCounters(decisionType, role, reason)` increments aggregate counters in `candidate_learning`.
3. Every 5th terminal decision, `_rebuildCandidateLearningPatterns()` pulls the last 100 decisions+outcomes and recomputes the `learned_patterns_json` column. This is the heaviest async operation in the app.
4. The decision banner re-renders. The rail history list re-renders via `wsRefreshDecisionHistory(roleId)`. The inbox re-renders to reflect the new state.

Reverting a decision goes through the same `_saveDecisionSnapshot` path — decisions are append-only; "revert" creates a new compensating decision.

---

## 5. Outcomes

If the user moves a role to a terminal stage (Offer / Rejected / Withdrew), the rail's outcome chip click triggers `showOutcomeReasonForm(roleId, state)` (`app.js:13022`). The user picks a reason and notes. On submit:
1. `_saveCandidateOutcomeExt(role, state, reason, opts)` upserts to `role_outcomes_ext`.
2. `_updateCandidateLearningOutcome(state)` updates aggregate counters.
3. `roles.outcome_state` is updated via `db.from('roles').update(...).eq('id', ...)`.
4. The rail re-renders.

---

## 6. Workspace chat

Inside the workspace column, the user can type into `#ws-chat-input` and either click send or press Ctrl+Enter (handled by the global keydown at `app.js:8755`). The send path:

1. `wsAddMessage(roleId, 'user', message)` writes to `role_conversations`.
2. The timeline appends the user message via `_wsAppend`.
3. A "thinking" placeholder is appended.
4. `callWorkspaceChatAPI(roleId, message, context)` invokes the `workspace-chat` edge function with the live candidate context.
5. The streamed response replaces the thinking placeholder.
6. `wsAddMessage(roleId, 'assistant', response)` persists the reply.
7. If the response contains structured insights or interactions, `wsAddInsight` / `wsAddInteraction` writes them to their tables.

Custom event `ws:chip-send` (`app.js:9637`) lets timeline chips dispatch synthetic sends — used by the "Suggested next message" chips and decision-bar prompts.

---

## 7. Notes

The notes textarea (`#role-notes`) is rendered inline by `renderRoleDoc` (`app.js:10053`). On `input`, a 600 ms debounce (`_notesTimer`, `app.js:10165`) saves to `localStorage['rw_role_notes_<roleId>']`. On `blur`, the same value is force-saved.

This is one of the two persistence smells in the app — notes are not in Supabase, so they're lost if the user clears storage or switches device. See REFACTOR_BACKLOG R35.

---

## 8. Per-section context

When the user clicks "Add note" / "Correct this" on a section in the match output, an inline form lets them write either a note or a correction. On save:
1. `_scSet(roleId, sectionKey, value)` updates the in-memory section-context object for the role.
2. `_scPersistToDb(roleId, ctx)` writes the entire JSON to `roles.section_context`.
3. Subsequent renders of `renderMatchOutput` read via `_scGet` and surface the user's text alongside the AI's.

There is a legacy localStorage migration (`app.js:15515–15553`) that runs once per role on first read and removes the LS key. **DB wins on conflict** — already migrated, don't reintroduce.

---

## 9. Recruiters

The recruiter view is a separate top-level surface (`renderRecruitersView`, `app.js:26952`). It mounts a list+detail layout into `#col-list-panel-wrapper`. CRUD is via `recruiters` table; many-to-many with roles via `role_recruiters`.

When a JD is ingested, `_tryAutoFillRecruiter()` (`app.js:31019`) inspects the text and URL for known recruiter patterns and offers to auto-link.

---

## 10. Reasoning map

`window.openReasoningMap(role)` (in `reasoning-map.js`) opens an SVG-based graph showing how the analysis sections, signals, and decision history connect. Rendered into `#rm-overlay`. Layout is deterministic radial arcs (no force simulation), so it's efficient at draw time — the cost is the eager loading of the 124 KB module.

Once Phase A of MODULE_SPLIT_PROPOSAL is done, this loads on first invocation only.

---

## 11. Admin panel

`switchNav('admin')` calls `renderAdminView()` (`app.js:27887`) which writes a tab shell into `#col-center`. Each of 10 sub-tabs is its own renderer (`_renderAdminOverview`, `_renderAdminRoles`, etc., `app.js:27933–29499`). Most read aggregate views (`usage_daily_rollups`, `abuse_signals`, `user_trust_state`); some write (e.g. archive a role, edit a prompt template).

Each renderer redefines local `_esc / _fmtDate / _fmtTs` helpers — see DUPLICATE_LOGIC §3, §5.

---

## 12. Theme / appearance

The accent colour (`rw-accent-theme`) and appearance mode (`rw-appearance-mode`) are read from localStorage at boot and applied to CSS variables on `:root`. A `matchMedia('prefers-color-scheme')` listener at `app.js:1177` re-applies on OS dark-mode toggle.

`ACCENT_THEMES` (`app.js:1137`) is the colour map.

---

## 13. Inspect mode (dev only)

Loading `inspect-mode.js` checks `location.hostname === 'localhost'` and bails immediately on production. On dev, it exposes `window.RW_INSPECT.{enable,disable,toggle,isActive}`. When enabled:
- `mousemove` over the document outlines the hovered element with `data-node-id`.
- `click` locks the selection and shows a panel with selector + AI metadata (via `aiMeta()` in `devtools/inspect/ai-meta.js`).
- Escape exits.

Used during AI-assisted UI work — the locked selection's metadata is dumped to `window.__RW_SELECTED_NODE__` for an external tool to read.

---

## 14. Edge functions (server side)

Three are checked into `supabase/functions/`:

- **commute-estimate** (82 LOC) — proxy to a routing API; returns `{ duration, distance, mode }`.
- **fetch-linkedin-jd** (389 LOC) — uses a per-user stored LinkedIn session cookie to fetch the JD page, parse, return structured fields. Cookie storage is in `profiles` JSON; safeguards UI lets the user clear it.
- **generate-narrative** (515 LOC) — calls Claude with a structured prompt, returns the narrative paragraph for the role page.

The rest (`analyse-jd`, `workspace-chat`, `enrich-role`, `memory-extract`) are deployed but not in this repo.

---

## 15. The cache architecture

There are five named caches, each with its own invalidation rule:

| Cache | Invalidation |
|---|---|
| `_brandAssetCache` | invalidated by user-initiated brand asset upload |
| `_lensCache` | invalidated when `decided count` changes |
| `_boundaryKeyCache` | invalidated on boundary save |
| `_cachedCvVersions` | loaded once, never invalidated within a session |
| `_snapDedupCache` | a Map used to suppress duplicate snapshot inserts |

There is no central cache manager. Each cache has bespoke invalidation. A 30-line `Cache` mini-utility would tidy this up, but the current code is correct.

---

## 16. The race-condition tracker

`window._rwCommuteGen` (`app.js:18065`) is a generation counter incremented on every commute fetch. The async response checks `if (gen !== window._rwCommuteGen) return;` before applying — this discards responses for the previously-selected role. It is the **only** generation counter in the app. Most other async writes have no such guard, which is mostly fine because they don't interact with the DOM, but if you ever add a per-role async render, copy this pattern.

---

## 17. What the app explicitly does NOT do

- No service worker. No offline mode.
- No `beforeunload` warning when leaving with unsaved edits.
- No `storage` event listener — multi-tab usage will not synchronise theme / notes / unlock state.
- No virtual DOM. No diffing. No reactive framework.
- No keyboard shortcuts beyond Ctrl+Enter and Escape.
- No analytics / telemetry beyond the `usage_events` table and admin radar.
- No internationalisation.
- No undo. Decisions are append-only; reverts are compensating writes.
- No optimistic UI on saves — most renders wait for the DB write to settle, then re-read.

If you need any of these, expect to do meaningful work — they were intentionally not built.
