# CODEBASE_INDEX — RoleWise

> Generated: 2026-04-14. Evidence-based file inventory of the active RoleWise codebase. Legacy/experimental files are listed in `UNUSED_CODE_REPORT.md` and excluded here.

---

## 1. Source files at a glance

| File | LOC | Bytes | Role |
|---|---:|---:|---|
| `app/app.js` | 31,999 | 1.68 MB | The monolith. Renders the entire app, owns global state, talks to Supabase. |
| `app/styles.css` | 15,995 | 498 KB | All styles for the app (one file). |
| `app/reasoning-map.js` | 2,763 | 124 KB | Stand-alone SVG "reasoning map" overlay (`#rm-overlay`). |
| `app/index.html` | 1,085 | 60 KB | Shell, modal markup, `<script>` mounts; also contains a `<style type="text/tailwindcss">` block. |
| `app/ai/prompts/rolewise-prompts.js` | 907 | — | Centralised system prompts shared by edge functions. |
| `app/devtools/inspect/inspect-mode.js` | 650 | — | `window.RW_INSPECT` dev overlay (localhost-only). |
| `app/analysis/render.js` | 305 | — | Renders match/decision blocks. Consumed inside `renderMatchOutput`. |
| `app/recruiter-backfill.js` | 295 | — | Console-only maintenance script. **Not loaded by index.html**. |
| `app/analysis/signals.js` | 269 | — | Pure signal classification (POSITIVE/BREAK). |
| `app/devtools/inspect/ai-meta.js` | 86 | — | `aiMeta()` helper used by inspect-mode. |
| `app/config.js` | 5 | 421 B | **Not loaded by index.html**. Constants live inline in app.js. |
| `app/design-system/tokens.css` | — | — | CSS custom properties (584 vars). Sole token source. |
| `app/reasoning-map.css` | — | — | Styles for the reasoning map overlay. |
| `app/devtools/inspect/inspect-mode.css` | — | — | Styles for the inspect overlay. |
| `Design/role-analysis.css` | 88 | — | Static design exploration; not loaded by app. |
| `supabase/functions/commute-estimate/index.ts` | 82 | — | Edge function: commute time estimate (proxy). |
| `supabase/functions/fetch-linkedin-jd/index.ts` | 389 | — | Edge function: fetch LinkedIn JD via session cookie. |
| `supabase/functions/generate-narrative/index.ts` | 515 | — | Edge function: post-analysis narrative generation. |
| `supabase/migrations/*.sql` | — | — | 7 SQL migrations (candidate_learning, linkedin_session, source fields, brand_assets…). |

---

## 2. `app/app.js` — major sections

The monolith is one big IIFE. Section markers (rows of `─` or `═` comments) mark coarse modules. Structure as observed:

| Lines | Section |
|---:|---|
| 1–46 | Supabase client init + `WS_*_TYPES` constants |
| 48–340 | **Workspace primitives** — `wsAddMessage`, `wsAppendDecision`, `wsLoadDecisions`, `wsLoadMemory`, `wsLoadSignals`, `wsAddDocument`, `wsLoadDocuments` |
| 354–805 | **Candidate learning + decision capture** — `_loadOrCreateCandidateProfile`, `_loadOrCreateCandidateLearning`, `_saveCandidateDecisionExt`, `_saveCandidateOutcomeExt`, `_updateCandidateLearningCounters`, `_rebuildCandidateLearningPatterns` |
| 806–910 | `_buildAndSetLiveCandidateContext`, onboarding setup card |
| 1098–1135 | User boundary persistence |
| 1137–1185 | Theme + appearance mode (light/dark/system) |
| 1261–1325 | `_parseLocationString` (geo + work model + office days) |
| 1398–1410 | `esc()` HTML escape + `_sanitizeUiText` (used everywhere) |
| 1462–1483 | Status labels + `STATUS_LABELS` |
| 1484–1825 | **Brand Asset System** — logo cache, Clearbit/Google fallback |
| 1865–1880 | Recruiter + comparison + panel-visibility state |
| 1942–2200 | `_renderStickyHeader`, `_renderRoleHeader`, `_renderDecisionBanner` |
| 2440–2470 | `ARCHIVE_OUTCOME_STATES`, `NEEDS_ATTENTION_STAGES` |
| 3046–3450 | `renderInbox`, `renderRoleCard`, comparison toggling |
| 3449–3580 | `renderCompareView` |
| 3915–4310 | Role snapshots, learnings, updates ledger |
| 4426–6700 | **Role Workspace v1** — workspace mount + chat + artifacts + interactions |
| 6701–9170 | Main paste handler (`doIntakeSubmit`), JD ingestion path |
| 9170–9999 | `renderWorkspaceView` + Applied state |
| 10000–10500 | Role page tabs (Analysis / Applied) |
| 10504–11800 | `renderRoleDoc` (full role detail), notes, scroll/sticky behaviour |
| 11872–12200 | `renderRail` (right column stage tracker) |
| 12200–13400 | Outcome reason form, decision rail, archive/restore handlers |
| 13407–14210 | **Unified JD Ingestion Overlay** (`#rw-ingestion-overlay`) |
| 14064–14500 | `showAddJdModal`, `hideAddJdModal`, edit details modal |
| 14492–14862 | Edit role / share / CV version mgmt |
| 14862–15390 | `renderProfileView` |
| 15392–15865 | **Section Context** subsystem (per-section notes/corrections) |
| 15865–17800 | Stats aggregation, lens cache, similar-roles insight |
| 17925–18860 | `renderMatchOutput` and signal rendering pipeline |
| 18852–21010 | Hybrid decision + match/break structure |
| 21013–22460 | **JD Extraction Engine v2** — Layer 1/2/3 extractors, normalisers, validators, assembly, AI-merge |
| 22462–22550 | `window._testJDExtract` (console test bank) |
| 22550–22600 | `window._debugRoleAnalysis` (console debug helper) |
| 24673–25400 | `callAnalysisAPI`, `callWorkspaceChatAPI`, generate-narrative invocation |
| 25855–26100 | Recruiter detection + auto-link from JD |
| 26371–27050 | Recruiter list/detail/edit/add views |
| 27029–27400 | `renderNextAction` (preparation panel) |
| 27458–27900 | Radar view |
| 27887–29200 | **Admin panel** — `_renderAdminOverview/Roles/Rules/Prompts/Radar/Stats/Audit/Intelligence/Preferences/LinkedIn` |
| 29220–29500 | Admin tabs: USAGE, ABUSE & RATE LIMITS, USER TRUST, EFFICIENCY |
| 29931–30200 | `renderReviewView` |
| 30195–30591 | Monthly review modal |
| 30463–30810 | Filter panel handlers |
| 30818 | Global Escape keydown (closes modals + exits inspect) |
| 30860–30900 | Top-level nav button wiring |
| 31000–31700 | Add JD / paste handlers, LinkedIn fetch, ingestion modal mounts |
| 31700–31999 | `refresh()` boot sequence + admin orphan cleanup |

> **Use this table as the primary reference when navigating app.js.** Line numbers will drift as edits land — re-grep section markers before editing.

---

## 3. What each top-level file is responsible for

### `app/index.html` (1085 lines)
- Document shell, `<head>` (Inter + JetBrains Mono fonts, Tailwind Play CDN, `<style type="text/tailwindcss">` block defining `.rw-lens-panel__*` and similar component classes).
- Static markup for: `.col-left`, `.col-filter`, `#col-list`, `#col-center`, `.col-chat`, `#col-rail-section`.
- Modal markup: `#modal-add`, `#modal-edit-details`, `#modal-share`, `#rw-ingestion-overlay`.
- `<script>` mounts (in this order): `analysis/signals.js`, `analysis/render.js`, `app.js`, `reasoning-map.js`, `devtools/inspect/ai-meta.js`, `devtools/inspect/inspect-mode.js`.

### `app/app.js`
- All app behaviour. Owns global state (see `STATE_AND_STORAGE_MAP.md`).
- Calls Supabase tables directly (~30 distinct tables).
- Invokes 6 edge functions: `analyse-jd`, `generate-narrative`, `workspace-chat`, `enrich-role`, `commute-estimate`, `fetch-linkedin-jd`, `memory-extract`.

### `app/reasoning-map.js`
- Renders `#rm-overlay` SVG full-screen overlay when user opens the reasoning map for a role.
- Self-contained: ~2.7k lines, builds nodes/edges from analysis output + decision history.
- Export: `window.openReasoningMap(role)`.
- Consumed by app.js at the role header "Reasoning map" button.

### `app/analysis/signals.js` (269 lines)
- Pure module. Exports `window.RW_classifySignals(role, profile, learning)`.
- Returns array of signals classified as POSITIVE / BREAK / WATCH with confidence + reasoning.
- Called from `analysis/render.js` and `app.js renderMatchOutput`.

### `app/analysis/render.js` (305 lines)
- Pure rendering helpers: `renderDecisionBlock`, `renderMatchBreak`.
- Depends on global `esc()` and `_sanitizeUiText()` from app.js (loaded earlier in HTML).
- Consumed inside `renderMatchOutput` and decision banners.

### `app/ai/prompts/rolewise-prompts.js` (907 lines)
- Centralised system prompts for: analyse-jd, generate-narrative, workspace-chat.
- **Bundled with edge functions, not the browser app** (referenced 3+ times across `supabase/functions/*`).

### `app/devtools/inspect/inspect-mode.js` (650 lines)
- Localhost-only DOM inspect overlay. Hover → highlight, click → pin + show panel with `data-node-id`, slot, selector.
- Exit immediately (`return`) on non-localhost.
- Exports: `window.RW_INSPECT.{enable,disable,toggle,isActive}`.

### `app/devtools/inspect/ai-meta.js` (86 lines)
- Tiny helper: `aiMeta(node, label, slot, props)` writes `data-ai-*` attributes.
- Used 7+ times by app.js inside dev-only render paths.

### `app/recruiter-backfill.js` (295 lines)
- **Not loaded by index.html.** Console-paste maintenance utility for backfilling recruiter rows.
- → flagged in `UNUSED_CODE_REPORT.md` as Safe to delete (or move to `scripts/`).

### `app/config.js` (5 lines)
- **Not loaded by index.html.** Same SUPABASE_URL / ANON_KEY are inlined in app.js (lines 1–2).
- → flagged in `UNUSED_CODE_REPORT.md` as Safe to delete (or wire it up properly).

### `app/design-system/tokens.css`
- Sole source of CSS custom properties: `--color-*`, `--text-*`, `--surface-*`, `--accent-*`, etc. (584 vars).
- Loaded ahead of `styles.css`.

### `app/styles.css`
- All component styles. ~1,646 selectors. Major prefix families:
  - `.rw-*` (512) — core RoleWise
  - `.ws-*` (289) — workspace/chat
  - `.ar-*` (104) — admin/audit/recruiters
  - `.rc-*` (98) — comparison
  - `.role-*` (94) — inbox cards
  - `.doc-*` (89) — JD/document rendering
  - Plus legacy `.yl-*` (7, unused — see CSS_AUDIT.md)

### Supabase
- **Tables read/written by browser**: 30 (see `STATE_AND_STORAGE_MAP.md`).
- **Edge functions** (`supabase/functions/`):
  - `commute-estimate/index.ts` — proxy to a routing API.
  - `fetch-linkedin-jd/index.ts` — uses stored LinkedIn session cookie to fetch+parse JD.
  - `generate-narrative/index.ts` — Claude API call to produce post-analysis narrative.
- 7 SQL migrations under `supabase/migrations/`, dated Mar 2026 onwards. Schema is therefore version-controlled.

---

## 4. Files that should NOT be considered active

These are listed explicitly so they stop drawing attention during navigation:

| Path | Status | See |
|---|---|---|
| `app/rolewise-linear.html` | Legacy prototype (Mar 2026). 0 references. | UNUSED_CODE_REPORT |
| `app/rolewise-linear-v2.html` | Legacy prototype. 0 references. | UNUSED_CODE_REPORT |
| `app/rolewise-frameio-v3.html` | Legacy prototype. 0 references. | UNUSED_CODE_REPORT |
| `app/rolewise-ballpark-v4.html` | Legacy prototype. 0 references. | UNUSED_CODE_REPORT |
| `app/_test-layout.html` | Layout sandbox. 0 references. | UNUSED_CODE_REPORT |
| `test-pipeline-output.html` | One-shot pipeline output. 0 references. | UNUSED_CODE_REPORT |
| `backup/` | Dated archive. 0 references. | UNUSED_CODE_REPORT |
| `app/config.js` | Defined but never loaded. | UNUSED_CODE_REPORT |
| `app/recruiter-backfill.js` | Console-only utility. | UNUSED_CODE_REPORT |
| `Design/role-analysis.css` | Design exploration; not loaded. | UNUSED_CODE_REPORT |

Combined size of items above: ~344 KB.
