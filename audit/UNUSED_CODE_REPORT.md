# UNUSED_CODE_REPORT — RoleWise

> Generated: 2026-04-14. Each finding is backed by a literal grep search.
> Classification: **Safe to delete** | **Needs verification** | **Console-only debug** | **Keep**

---

## 1. Whole files that are not referenced anywhere

### 1.1 `app/config.js` — **Safe to delete**
- 5 lines. Defines `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
- Search: `grep -n "config\.js" app/index.html` → **0 matches**.
- Same constants are inlined at the top of `app/app.js` (lines 1–2).
- **Action**: Delete the file, OR refactor app.js to load it (and confirm script tag in index.html). Recommend delete — env vars belong in a single place and the file is misleading.

### 1.2 `app/recruiter-backfill.js` — **Safe to delete (or move)**
- 295 lines. Console paste utility for one-time recruiter backfills.
- Search: `grep -rn "recruiter-backfill" app/ index.html` → **0 matches**.
- **Action**: Move to `scripts/` and out of `app/` so devs stop reading it during navigation. If it's a one-off historical migration, delete.

### 1.3 Legacy HTML prototypes — **Safe to delete**
| File | Size | Date | Refs |
|---|---:|---|---:|
| `app/rolewise-linear.html` | 56 KB | 2026-03-11 | 0 |
| `app/rolewise-linear-v2.html` | 88 KB | 2026-03-11 | 0 |
| `app/rolewise-frameio-v3.html` | 88 KB | 2026-03-11 | 0 |
| `app/rolewise-ballpark-v4.html` | 89 KB | 2026-03-11 | 0 |
| `app/_test-layout.html` | 11 KB | 2026-04-13 | 0 |
| `test-pipeline-output.html` | 17 KB | 2026-04-13 | 0 |

- Search: `grep -rn "rolewise-linear\|rolewise-frameio\|rolewise-ballpark\|_test-layout\|test-pipeline-output" app/ index.html supabase/` → **0 matches**.
- Combined: **~349 KB** of code and design snapshots.
- **Action**: Move to `archive/` outside of `app/`, or delete. Keeping them in `app/` actively confuses anyone navigating the codebase (4 versions of "rolewise-*" in the same folder is a smell).

### 1.4 `backup/` — **Safe to delete**
- Contains `backup-2026-03-20`. 0 references in source.
- **Action**: Delete from version control. Backups belong outside the repo.

### 1.5 `Design/role-analysis.css` — **Needs verification**
- 88 lines. Not loaded from index.html (`grep "role-analysis.css" app/index.html` → 0 matches).
- Lives in a separate `Design/` folder (uppercase D, sibling to `app/`).
- **Action**: Confirm with owner. If it's reference design, leave it but mark with a top comment "// Reference design only — not loaded".

---

## 2. Console-only debug helpers (KEEP)

These look unused if you grep for callers — they are intentionally console-only. Do NOT delete.

| Symbol | Location | Purpose |
|---|---|---|
| `window._testJDExtract` | `app.js:22466–22545` | Test bank for JD extraction layers. Header comment: "// TEST BANK — run from browser console". |
| `window._debugRoleAnalysis` | `app.js:22555–22600` | Snapshot logger for role analysis output. Header comment: "// DEBUG HELPER — run from browser console". |
| `window.RW_INSPECT.*` | `devtools/inspect/inspect-mode.js` | Inspect overlay API. Localhost-only by guard. |
| `window.__RW_SELECTED_NODE__` | `inspect-mode.js` | Selected node payload for inspect. |
| `window._rwCommuteGen` | `app.js:18065` | Generation counter — *not* a debug helper, used by commute render to discard stale results. **Required**. |

Recommend adding a single `// CONSOLE HELPERS — kept on purpose, do not delete` block comment above the `window._test*` and `window._debug*` definitions so this is unambiguous.

---

## 3. Functions defined but appear to have only one (definition) reference

Every claim below was grepped against `app/app.js`, `app/reasoning-map.js`, `app/analysis/*.js`, `app/index.html`, and `app/devtools/inspect/*.js`. **One match = definition only**.

> Note: Many functions are bound via `addEventListener` or referenced inside template-literal `onclick="..."` attributes. Those would still appear as one match. **Each row below has been re-checked for those patterns**; ones flagged as Needs verification have one of those uncertainties.

### 3.1 Workspace functions never called outside their own definition

| Function | Defined | Status |
|---|---|---|
| `_wsExtractAndStoreSignals` | `app.js:300` | Underscore prefix + zero callers. **Safe to delete** unless this is a pending feature — confirm with owner. |
| `wsLoadSignals` | `app.js:268` | One internal helper call only. **Needs verification** — likely used by an aborted "Signals" UI. |
| `wsUpsertSignal` | `app.js:284` | Same as above. **Needs verification**. |

### 3.2 Duplicate inline helper functions inside scoped blocks (NOT dead, smell)

These functions are redefined identically inside multiple closures. Not dead code, but clearly a missing extraction:

| Function | Defined at | Why repeated |
|---|---|---|
| `_dismissAndRestore` | `app.js:8037` and `app.js:8249` | Two separate decision-card closures redefine the same handler. |
| `_dismissOnly` | `app.js:8047` and `app.js:8253` | Same. |
| `_esc` | `app.js:27891`, `28441`, `28509`, `28698` | Admin renderers each redefine a local HTML escape (the global `esc()` is in scope — they don't need their own). |
| `_fmtDate`, `_fmtTs` | Same admin lines as `_esc` | Same — locals shadowing what already exists. |

**Action**: Replace local copies with the global `esc()` (defined at `app.js:1398`). Risk: low. Effort: 30 min. See REFACTOR_BACKLOG.md.

### 3.3 Constants declared but never read

Spot-check: I sampled top-level `const X = ...` declarations between lines 1–2500 and grepped each name. Findings:

- `WS_INSIGHT_TYPES` (line 36) — declared as a frozen tuple. Search: `grep -n "WS_INSIGHT_TYPES" app/app.js` → 1 match (definition). Not used. **Safe to delete** if `wsAddInsight` no longer validates against it.
- `WS_ARTIFACT_TYPES` (line 39) — same: 1 match. Not used. **Safe to delete** under same condition.
- `WS_INTERACTION_TYPES` (line 33) — 1 match. **Safe to delete** if validation isn't planned.
- `WS_SENDER_TYPES` (line 42) — 1 match. **Safe to delete**.

These four constants together suggest the workspace's typed-tuple validation was planned but never wired up. **Action**: Either wire validation into the four `wsAdd*` functions (low risk, 1 hour), or delete the constants.

---

## 4. Commented-out code blocks

Spot-check via `grep -nE "^\s*/\*" app/app.js` and inspection around section boundaries:

- `app/styles.css:12301` — `/* .rw-lens-qa-btn removed — use .rw-btn .rw-btn-sm instead */` — the comment explicitly says the rule was deleted. **Safe to delete the comment** (it adds noise without value once the migration is done).
- No large multi-line `/* ... */` blocks of dead code were found in app.js. Most code is live.

---

## 5. Legacy CSS prefix `.yl-*`

7 selectors define a `.yl-*` family in styles.css. Searches in app.js, index.html, render.js, reasoning-map.js for `yl-panel`, `yl-heading`, `yl-label`, `yl-list`, `yl-note` → **0 matches**.

The `<style type="text/tailwindcss">` block at `index.html:34–80` explicitly says: *"Replaces the legacy `.yl-*` class set for the Your Lens intel card."* So `.rw-lens-panel__*` is the replacement.

**Action**: Delete the 7 `.yl-*` selectors from styles.css. ~50 lines. Risk: zero. See CSS_AUDIT.md for the full unused-CSS report (~462 selectors, ~28%).

---

## 6. CSS classes — definition exists, no consumer

CSS_AUDIT.md contains the full list. Highest-confidence "Safe to delete" categories:

- **All `.alert__*` selectors** (`styles.css:14500–14580`): 0 references in any HTML or JS. ~80 lines.
- **All `.ars-*` selectors** (`styles.css:11615–11620`): 0 references. ~10 lines.
- **`.avatar--2xl/--lg/--sm/--initials/--photo`** family: 0 references. ~30 lines.
- **`.badge-pill` / `.badge-pill--brand`** (`styles.css:13337, 13363`): 0 references. ~20 lines.
- **`.snap-divider`** (`styles.css:2891`): 0 references.
- **`.modal-overlay`** (`styles.css:14081`): 0 references — the actual modals use `.modal-backdrop`.

---

## 7. Things checked but FOUND TO BE IN USE (do NOT delete)

To save reviewers time, here's what I verified is live:

- `reasoning-map.js` — referenced 4× in index.html and called via `window.openReasoningMap`.
- `analysis/render.js` — referenced 2× from app.js (`renderDecisionBlock`, `renderMatchBreak`).
- `analysis/signals.js` — referenced 2× from app.js (`classifySignals`).
- `ai/prompts/rolewise-prompts.js` — referenced 3+ times across `supabase/functions/*` (used in edge runtime, not browser).
- `devtools/inspect/{inspect-mode,ai-meta}.js` — both wired in index.html and `aiMeta()` is called 7+ times.

---

## 8. Summary

| Action | Items | Approx. size | Risk |
|---|---:|---:|---|
| Delete legacy HTML prototypes (4 files) | 4 | 320 KB | None |
| Delete `_test-layout.html`, `test-pipeline-output.html`, `backup/` | 3 | 28 KB | None |
| Delete `config.js`, move `recruiter-backfill.js` to `scripts/` | 2 | 1 KB | None |
| Delete `.yl-*` CSS family | 7 selectors | ~50 lines | None |
| Delete `.alert__*`, `.ars-*`, `.avatar--*`, `.badge-pill`, `.snap-divider`, `.modal-overlay` CSS | ~30 selectors | ~150 lines | None |
| De-duplicate `_esc/_fmtDate/_fmtTs` admin local helpers (use globals) | 4 functions | ~30 lines | Low |
| Verify and either wire or delete `WS_*_TYPES` constants and `wsLoadSignals/wsUpsertSignal/_wsExtractAndStoreSignals` | 7 symbols | ~80 lines | **Needs owner check** |

**Total deletable today (no owner check needed): ~350 KB on disk + ~200 lines of CSS + 30 lines of duplicated JS.**
