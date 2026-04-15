# STATE_AND_STORAGE_MAP — RoleWise

> Generated: 2026-04-14. Where state lives, where it is read, where it is written.

---

## 1. Global state (top-level IIFE in `app.js`)

| Variable | Where assigned | Where read | Notes |
|---|---|---|---|
| `allRoles` (Array) | `refresh()` `app.js:~31700` from `db.from('roles').select(...)` | renderInbox, selectRole, every render | Single source of truth for the role collection |
| `selectedRoleId` (string\|null) | `selectRole(id)` `app.js:~3370` | every per-role render path | Drives centre + workspace + rail |
| `currentNav` (string) | `switchNav(name)` `app.js:~30860` | layout, panel visibility | Values: overview, inbox, radar, recruiters, profile, settings, admin, review |
| `inboxTab` (string) | `app.js:1473` | renderInbox filter | 'active' \| 'archive' |
| `compareRoleIds` (Set<string>) | row checkbox handlers `app.js:3378` | renderInbox, renderCompareView | Cap at 3 |
| `filterPanelOpen` (bool) | filter toggle `app.js:30787` | layout | |
| `listPanelVisible`, `rightPanelVisible` (bool) | `switchNav` | layout grid | |
| `userProfile` (object\|null) | boot from `profiles` table | analysis context, signal classification | |
| `_profileId` (UUID) | boot | every personal-data write | Scopes per-user data |
| `_candidateProfile` (object\|null) | `_loadOrCreateCandidateProfile()` `app.js:437` | live context builder | |
| `_candidateLearning` (object\|null) | `_loadOrCreateCandidateLearning()` `app.js:482` | counters, similar-roles insight | Updated after every terminal decision |
| `_cachedCvVersions` (Array\|null) | `_loadCvVersions()` | computeFitAssessment | Loaded once, reused |
| `_boundaryKeyCache` (Set\|null) | `_loadUserBoundaries()` | blocker detection | Invalidated on boundary save |
| `_rwAiOutputCache` (object\|null) | `renderMatchOutput` post-processing | "Ask AI" inline interaction | |
| `_liSourceMeta` (object\|null) | `_fetchLinkedInJD` | saveRole | Cleared after save |
| `_lensCache` / `_lensCacheCount` | `_buildSimilarRolesInsight` | "Your Lens" panel | Invalidated when decided count changes |
| `_snapDedupCache` (Map) | `app.js:3915` | snapshot inserts | Prevent dupes |
| `_brandAssetCache`, `_brandAssetCacheId`, `_logoFetchInFlight` | `app.js:1498`, `1663` | logo resolution | |
| `allRecruiters`, `selectedRecruiterId` | `_loadRecruiters` | recruiter views | |

Configuration constants (top of file):
- `WS_INTERACTION_TYPES`, `WS_INSIGHT_TYPES`, `WS_ARTIFACT_TYPES`, `WS_SENDER_TYPES` `app.js:33–42` — frozen tuples; **none currently read** (see UNUSED_CODE_REPORT §3.3).
- `ACCENT_THEMES` `app.js:1137` — theme colour map.
- `STATUS_LABELS` `app.js:1462` — stage → label.
- `ARCHIVE_OUTCOME_STATES`, `NEEDS_ATTENTION_STAGES`, `_ANALYSIS_STAGES`, `_ANALYSIS_TIMINGS`, `_PLATFORM_DOMAINS` — various.

---

## 2. `window.*` exports

| Symbol | Defined in | Purpose |
|---|---|---|
| `window._rwCommuteGen` | `app.js:18065` | Generation counter for commute renders — required for race-condition discard |
| `window._testJDExtract` | `app.js:22466` | Console-only test bank for JD extraction |
| `window._debugRoleAnalysis` | `app.js:22555` | Console-only snapshot logger |
| `window.openReasoningMap(role)` | `reasoning-map.js` | Entry point for reasoning-map overlay |
| `window.RW_INSPECT` | `inspect-mode.js` | Inspect overlay API (localhost only) |
| `window.__RW_SELECTED_NODE__` | `inspect-mode.js` | Selected node payload (dev only) |
| `window.RW_classifySignals` | `analysis/signals.js` | Signal classifier |
| `window.RW_render` | `analysis/render.js` | `{ renderDecisionBlock, renderMatchBreak }` |

---

## 3. localStorage usage

| Key (or pattern) | Owner | Read at | Written at | Migration path |
|---|---|---|---|---|
| `rw-accent-theme` | Theme system | `app.js:1157` | `app.js:1150` | None — preferences |
| `rw-appearance-mode` | Theme system | `app.js:1178`, `1183` | `app.js:1171` | None — preferences |
| `rw_last_active` | Away summary | `app.js:2822` | `app.js:2824` | None — session marker |
| `rw_role_notes_${role.id}` | Per-role notes | `app.js:10053` | `app.js:10165` (debounced) | Should migrate to `roles.notes` JSON column or `role_notes` table |
| `rw_intel_ps_unlocked` | Personality signals unlock | `app.js:19387`, `19503` | `app.js:19387+` | Feature flag — can move to `roles.intel_unlocks` JSON |
| `rw_*` (intel feature flags `_hsGet/_oarmGet/_drGet/_rsGet/_epGet/_psGet/_dsGet`) | Various intel sections | lines 19355–19581 | same | Many — likely candidates for DB migration |
| (Section context legacy) | Section context migration | `app.js:15515` (`localStorage.getItem(lsKey)`) | `app.js:15553` (removed after migrate) | **Already migrated — DB wins on conflict** |

**Total LS keys**: ~12 distinct namespaces. All access is wrapped in `try { … } catch (_) {}` for quota/blocked safety. **No PII or secrets** stored.

`sessionStorage`: **no usage detected**.

---

## 4. Supabase tables

Touched directly by `app.js` (counts approximate from grep).

| Table | Reads | Writes | What it stores |
|---|---|---|---|
| `roles` | very many | many `update`, several `insert`, several `delete` | core role records (JD, stage, outcome, source, metadata, section_context JSON, source_meta JSON) |
| `role_conversations` | wsLoadMessages | wsAddMessage | chat messages |
| `role_decisions` | wsLoadDecisions, wsDecisionStats, candidate_learning rebuild | wsAppendDecision | primary decision ledger |
| `role_decisions_ext` | learning rebuild | _saveCandidateDecisionExt | extended learning data |
| `role_outcomes_ext` | learning rebuild | _saveCandidateOutcomeExt | outcome tracking |
| `role_decision_snapshots` | (TBD) | _saveDecisionSnapshot | full role snapshot at decision time |
| `role_snapshots` | rail | snapshot inserts | event-driven role snapshots |
| `role_updates` | timeline, history | many inserts | audit log per role |
| `role_interactions` | wsLoadMemory | wsAddInteraction | recruiter/HM interactions |
| `role_insights` | wsLoadMemory | wsAddInsight | structured insights |
| `role_artifacts` | wsLoadMemory, wsLoadDocuments | wsAddArtifact, wsUpdateArtifact, wsAddDocument | docs + notes |
| `role_learnings` | (per-role) | _insertRoleLearnings | per-role learning patterns |
| `role_enrichments` | (per-role) | _updateRoleEnrichment | enrichment layer |
| `role_recruiters` | per-role join, recruiter view | _insertRoleRecruiter | many-to-many roles↔recruiters |
| `role_events` | rail | _insertRoleEvent | event stream |
| `role_blockers` | per-role | _upsertRoleBlocker | role-level blocker confirmations |
| `candidate_profile` | boot | (admin / setup) | user profile |
| `candidate_learning` | boot | _saveCandidateLearning, counters, rebuild | aggregated learning |
| `profiles` | boot | profile editor + admin LinkedIn | user prefs JSON |
| `user_boundaries` | boundary cache | upsert in setup | hard/soft blockers |
| `cv_versions` | computeFit | CV uploader | CV variants |
| `jd_matches` | per-role | _insertJdMatch (after analyse-jd) | analysis output JSON |
| `analyses` | per-role | (after analyse-jd) | denormalised analysis |
| `status_events` | (health) | on phase errors | error stream |
| `usage_events` | admin | _logUsageEvent | usage tracking |
| `usage_daily_rollups` | admin | (server-side aggregation) | daily aggregates |
| `brand_assets` | logo cache | (uploader) | brand assets |
| `abuse_signals`, `user_trust_state` | admin | (server-side) | safety signals |
| `recruiters` | recruiter view | _insertRecruiter | recruiter directory |

**~30 tables.**

---

## 5. Supabase Edge Functions invoked

| Function | Invoked from | Purpose |
|---|---|---|
| `analyse-jd` | `callAnalysisAPI` `app.js:~24710` | Main JD analysis (Claude API) |
| `generate-narrative` | inline in `doIntakeSubmit` `app.js:~25185` | Post-analysis narrative generation |
| `workspace-chat` | `callWorkspaceChatAPI` `app.js:25303` | Multi-turn workspace chat |
| `enrich-role` | inline `app.js:~25349` | Inferred enrichments (hard_no, frictions, viability) |
| `commute-estimate` | commute panel `app.js:~18000+` | Commute estimate via routing API |
| `fetch-linkedin-jd` | `_fetchLinkedInJD` `app.js:~31568` | Pull JD from LinkedIn using stored session cookie |
| `memory-extract` | wsLoadInsights flow | Memory extraction for chat context |

Source for the three checked-in edge functions:
- `supabase/functions/commute-estimate/index.ts` (82 LOC)
- `supabase/functions/fetch-linkedin-jd/index.ts` (389 LOC)
- `supabase/functions/generate-narrative/index.ts` (515 LOC)

(Other edge functions are deployed but not in this repo.)

---

## 6. State-flow notes

- **No reactive framework**. Render functions read from globals + arguments and write directly to DOM. No diff layer.
- **No history / undo**. Decisions are append-only; reverting goes through `_saveDecisionSnapshot` again.
- **Caches are explicit and named**. Each cache (`_brandAssetCache`, `_lensCache`, `_boundaryKeyCache`, `_cachedCvVersions`) has its own invalidation rule encoded inline. None use TTL.
- **Race conditions**: `_rwCommuteGen` is the only generation counter — used to discard stale async commute responses. Most other async DB writes are fire-and-forget with a `.catch(() => {})`.

---

## 7. Recommended improvements

1. **Move `rw_role_notes_*` from localStorage to a `role_notes` table or a JSON column**. Currently lost when user clears storage; not synced across devices. Low risk.
2. **Document the `rw_intel_*` LS feature-flag set** in one place, or better, fold them into `roles.intel_unlocks` JSON. They are scattered across `app.js:19355–19581`.
3. **Wire or delete the `WS_*_TYPES` validation tuples**. They imply intent that is not realised.
4. **Decide on a single cache invalidation pattern** — currently each cache has bespoke logic. A 30-line `Cache` mini-utility would reduce the cost of future caches.
