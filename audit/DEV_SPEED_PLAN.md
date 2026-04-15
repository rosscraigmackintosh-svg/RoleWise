# DEV_SPEED_PLAN — RoleWise

> Generated: 2026-04-14. The 12 changes that will make you faster at building this product, in order of return-on-time.

The yardstick: **how many minutes does the average task lose to "where does this live?", "is this dead code?", "why is this duplicated?", "did my change break something I can't see?"**

---

## 1. Adopt the audit folder as the source of truth (15 min)

Pin `WHERE_THINGS_LIVE.md`, `SYSTEM_INDEX.md`, and `HOW_THE_APP_WORKS.md` in your editor sidebar. Anyone joining the codebase reads those three first.

**Saves**: 30–60 min per onboarding ramp; ~5 min per "where is X?" question.

---

## 2. Delete the dead weight (1 hr)

From UNUSED_CODE_REPORT.md:
- 4 legacy HTML prototypes (`rolewise-linear*.html`, `rolewise-frameio-v3.html`, `rolewise-ballpark-v4.html`) — 320 KB
- `_test-layout.html`, `test-pipeline-output.html`, `backup/` — 28 KB
- `app/config.js` (5 lines, never loaded)
- `.yl-*` CSS (~120 lines), `.modal-overlay`, `.snap-divider`, duplicate `.hidden`, duplicate `.rw-doc-bullets` (~150 more)

**Saves**: every grep and every file-tree scroll, forever.

---

## 3. Add a 30-line cached element registry (30 min)

The 660 `document.getElementById` calls (PERFORMANCE_HOTSPOTS #7) hide a more important problem: every render function relearns the DOM. Add at the top of app.js:

```js
const $ = (() => {
  const cache = new Map();
  return id => cache.get(id) || (cache.set(id, document.getElementById(id)), cache.get(id));
})();
```

Then `$('role-inbox')` everywhere. **Saves**: small per-call perf, big readability win — calls become greppable as "DOM access" vs "compute".

---

## 4. Promote `esc`, `_fmtDate`, `_fmtTs`, `updateRole` to module scope (1 hr)

DUPLICATE_LOGIC_REPORT clusters #3, #5, #10. Five small extractions:

| Helper | Lines saved | Lives at |
|---|---:|---|
| `esc()` (already global, just delete locals) | ~30 | `app.js:1398` |
| `_fmtDate / _fmtTs` consolidated | ~15 | top of file |
| `updateRole(id, patch)` wrapper | replaces 17 sites | top of file |
| `WORK_MODEL_LABELS` + `normaliseWorkModel` | ~30 | top of file |
| `SALARY_MISSING_RE` + `isSalaryMissing` | ~15 | top of file |

**Saves**: every future reader stops asking "is this the same as that other one?".

---

## 5. Debounce the search input (15 min)

Single-line fix at `app.js:30746`:
```js
const _debouncedRender = _debounce(() => renderInbox(allRoles), 200);
_filterSearch.addEventListener('input', _debouncedRender);
```

Add a 5-line `_debounce` helper next to `esc`. **Saves**: 1–2 s of perceived lag per search session.

---

## 6. Lazy-load reasoning-map.js + inspect-mode.js (30 min)

MODULE_SPLIT_PROPOSAL Phase A. Convert these eager scripts to dynamic `import()` on first use.

**Saves**: ~500 ms first paint for every session.

---

## 7. Make logging non-silent (1 hr)

PERFORMANCE_HOTSPOTS #11. Replace `.catch(() => {})` with `.catch(err => console.warn('[fnName]', err))` at the 94 call sites. Even better: a `swallow(label)` helper that you can flip to surface errors during dev.

```js
const swallow = label => err => console.warn(`[${label}]`, err);
// usage:
fetch(...).catch(swallow('wsAddMessage'));
```

**Saves**: hours of "why didn't my change work?" debugging.

---

## 8. Consolidate the four `.overview-cards` click delegates (1 hr)

EVENT_MAP §5. There are four separate `addEventListener('click', …)` on the same container at `app.js:8589, 8666, 8717, 8826`. Each handles a different child action. Merge into one delegate with a switch on `event.target.dataset.action`.

**Saves**: half the time when adding a new overview-card action — you stop having to pick which delegate to extend.

---

## 9. Migrate `rw_role_notes_*` from localStorage to DB (2 hr)

STATE_AND_STORAGE_MAP §7.1. Notes lost on storage clear, not synced across devices, hidden from any audit query. Add a `roles.notes` text column or a `role_notes` table. Reuse `updateRole` helper.

**Saves**: real bug surface area; user trust.

---

## 10. Add a single Escape handler convention (already exists — document it) (15 min)

`app.js:30818` is the global Escape handler. Every modal should register itself with it rather than adding its own keydown listener. Currently consistent — write a 5-line comment block at the handler explaining the contract so future modals follow it.

**Saves**: prevents the "two Escape handlers fight" bug.

---

## 11. Add a top-of-file map comment to app.js (30 min)

`app.js` has section dividers (rows of `─` and `═`) but no master index. Insert at the top:

```js
/* APP.JS MAP — see audit/CODEBASE_INDEX.md for full detail
 *  ~1     supabase init + global state
 *  ~48    workspace primitives
 *  ~354   candidate learning
 *  ~1484  brand assets
 *  ~3046  inbox + role list
 *  ~9170  workspace render
 *  ~10504 role doc render
 *  ~13407 ingestion overlay
 *  ~17925 match output render
 *  ~21013 JD extraction v2
 *  ~24673 AI / network
 *  ~27887 admin panel
 *  ~31700 boot
 */
```

**Saves**: 30 sec per new dev navigation. Multiplies fast.

---

## 12. Stop adding to app.js (policy) (ongoing)

Once Phases A–E of MODULE_SPLIT are done, set a soft cap: any new feature larger than ~200 lines goes in its own file under a feature folder. Treat app.js the way you'd treat a `main.go` — only orchestration belongs there.

**Saves**: prevents this audit being needed again in 12 months.

---

## What I am explicitly NOT recommending

- ❌ **Don't introduce a framework** (React/Vue/Svelte) — the rebuild cost dwarfs the win, and the existing renderers are already working.
- ❌ **Don't add TypeScript right now** — incremental .ts adoption in a 32k-line file is painful; revisit after Phases A–E.
- ❌ **Don't add a bundler** until you have ~30+ ES modules. Native modules are fine until then.
- ❌ **Don't refactor renderInbox to use virtual DOM** — debounce + cache hits 80% of the value at 5% of the cost.
- ❌ **Don't migrate every localStorage key to DB** — only `rw_role_notes_*` is worth the effort. The intel-unlock flags are fine where they are.
- ❌ **Don't restructure `analysis/`** — already extracted, already small, leave it.

---

## Suggested first session (90 min)

1. (15 min) Pin audit docs.
2. (30 min) Delete legacy HTML, `config.js`, `.yl-*` CSS, duplicate `.hidden`/`.rw-doc-bullets`. One commit.
3. (15 min) Add the app.js map comment.
4. (15 min) Debounce the search input.
5. (15 min) Lazy-load reasoning-map.

That's a tangible, measurable, low-risk first day.
