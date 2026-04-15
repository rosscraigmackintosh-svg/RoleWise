# REFACTOR_BACKLOG — RoleWise

> Generated: 2026-04-14. Every concrete refactor surfaced by the audit, sized and risk-classed, ready to drop into a tracker.
>
> Format: **ID — Title — Effort — Risk — Source — Description / DoD**

---

## Tier 1 — Quick wins (zero or low risk, < 1 hr each)

### R1 — Delete legacy HTML prototypes
- **Effort**: 15 min · **Risk**: zero · **Source**: UNUSED_CODE §1.3
- Delete `app/rolewise-linear.html`, `rolewise-linear-v2.html`, `rolewise-frameio-v3.html`, `rolewise-ballpark-v4.html`, `_test-layout.html`, `test-pipeline-output.html`, `backup/`. ~349 KB.
- **DoD**: files removed, `git status` clean, app boots unchanged.

### R2 — Delete `app/config.js`
- **Effort**: 5 min · **Risk**: zero · **Source**: UNUSED_CODE §1.1
- 5 lines, zero references; constants duplicated inline at `app.js:1–2`.
- **DoD**: file removed.

### R3 — Move `app/recruiter-backfill.js` to `scripts/`
- **Effort**: 5 min · **Risk**: zero · **Source**: UNUSED_CODE §1.2
- 295-line one-off console utility. Not loaded.

### R4 — Delete duplicate `.hidden` rule
- **Effort**: 2 min · **Risk**: zero · **Source**: CSS_AUDIT §1
- Delete `styles.css:10498`.

### R5 — Delete duplicate `.rw-doc-bullets` block
- **Effort**: 2 min · **Risk**: zero · **Source**: CSS_AUDIT §2
- Delete `styles.css:5706–5708`.

### R6 — Delete `.modal-overlay` and `.snap-divider`
- **Effort**: 5 min · **Risk**: zero · **Source**: CSS_AUDIT §3.1, §3.2
- ~15 lines.

### R7 — Delete `.yl-*` CSS family
- **Effort**: 10 min · **Risk**: zero · **Source**: CSS_AUDIT §3.3 (legacy noted in index.html:32)
- ~120 lines, 8 selectors.

### R8 — Delete `.avatar--*` variants
- **Effort**: 5 min · **Risk**: zero · **Source**: CSS_AUDIT §3.6
- ~30 lines.

### R9 — Add app.js master map comment
- **Effort**: 30 min · **Risk**: zero · **Source**: DEV_SPEED_PLAN #11
- Top-of-file index of major section line ranges.

### R10 — Debounce inbox search input
- **Effort**: 15 min · **Risk**: low · **Source**: PERFORMANCE_HOTSPOTS #3
- Wrap `_filterSearch` listener at `app.js:30746` in 200 ms debounce. Add 5-line debounce helper next to `esc`.

### R11 — Lazy-load `reasoning-map.js`
- **Effort**: 30 min · **Risk**: low · **Source**: PERFORMANCE_HOTSPOTS #12, MODULE_SPLIT Phase A
- Convert eager `<script>` to `await import()` inside `window.openReasoningMap`.

### R12 — Lazy-load `inspect-mode.js` on localhost
- **Effort**: 15 min · **Risk**: zero · **Source**: MODULE_SPLIT Phase A
- Wrap import in hostname check.

### R13 — Add `<link rel="preconnect">` for logo CDN
- **Effort**: 5 min · **Risk**: zero · **Source**: PERFORMANCE_HOTSPOTS #10
- Add to `index.html` for Clearbit / Google favicon hosts.

### R14 — Drop logo timeout 6000 → 2000 ms
- **Effort**: 2 min · **Risk**: low · **Source**: PERFORMANCE_HOTSPOTS #10
- `app.js:1674`.

### R15 — Replace silent `.catch(() => {})` with `swallow(label)`
- **Effort**: 1 hr · **Risk**: zero · **Source**: PERFORMANCE_HOTSPOTS #11
- Add 3-line helper, search-and-replace 94 sites.

---

## Tier 2 — Consolidations (low risk, 1–2 hr each)

### R16 — Promote `_fmtDate` / `_fmtTs` to module scope
- **Effort**: 1 hr · **Risk**: low · **Source**: DUPLICATE_LOGIC §3
- Delete two redefinitions at `app.js:27901, 28512`. Audit 9 inline `toLocaleDateString` calls. Use single canonical helper.

### R17 — Delete local `_esc` lambdas, use global `esc()`
- **Effort**: 30 min · **Risk**: low · **Source**: DUPLICATE_LOGIC §5
- Sites: `app.js:27891, 28441, 28509, 28698, 29203, 31863`.

### R18 — Add `updateRole(id, patch)` helper, replace 17 sites
- **Effort**: 1 hr · **Risk**: low · **Source**: DUPLICATE_LOGIC §10
- Sites: `app.js:4238, 5245, 8405, 11835, 12076, 12440, 12498, 12964, 12980, 13157, 13289, 13331, 13809, 14520, 27070, 27083, 28138`.

### R19 — Add `WORK_MODEL_LABELS` + `normaliseWorkModel` helper
- **Effort**: 30 min · **Risk**: low · **Source**: DUPLICATE_LOGIC §1
- Replaces 7 sites of inline mapping.

### R20 — Add `SALARY_MISSING_RE` + `isSalaryMissing` predicate
- **Effort**: 1 hr · **Risk**: low · **Source**: DUPLICATE_LOGIC §8
- Replaces 6 detection sites.

### R21 — Cached element registry (`$('role-inbox')`)
- **Effort**: 30 min for helper + 2 hr to migrate hottest 20 functions · **Risk**: low · **Source**: DEV_SPEED_PLAN #3, PERF #7
- Delete redundant `document.getElementById` calls.

### R22 — Consolidate four `.overview-cards` click delegates
- **Effort**: 1 hr · **Risk**: medium · **Source**: EVENT_MAP §7.1
- Merge `app.js:8589, 8666, 8717, 8826` into one delegate switching on `data-action`.

### R23 — Reorder layout reads-after-writes
- **Effort**: 1 hr · **Risk**: low · **Source**: PERFORMANCE_HOTSPOTS #6
- Specific sites: `app.js:3395–3399, 4840–4842, 4955–4956`. Batch reads first.

### R24 — Consolidate repeated `_panels.forEach` loops
- **Effort**: 30 min · **Risk**: low · **Source**: PERFORMANCE_HOTSPOTS #9
- `app.js:3649, 3663, 3669, 3695, 3701`.

### R25 — Wire or delete `WS_*_TYPES` validation tuples
- **Effort**: 30 min (delete) · **Risk**: low · **Source**: UNUSED_CODE §3.3
- 4 frozen tuples at `app.js:33–42` declared but never read.

### R26 — Wire or delete `wsLoadSignals` / `wsUpsertSignal` / `_wsExtractAndStoreSignals`
- **Effort**: 30 min (delete) · **Risk**: medium · **Source**: UNUSED_CODE §3.1
- Confirm with owner first — may be aborted feature.

---

## Tier 3 — Module extractions (low–medium risk, 1–4 hr each)

### R27 — Extract JD Extraction Engine v2
- **Effort**: 2 hr · **Risk**: low · **Source**: MODULE_SPLIT Phase B
- Move `app.js:21013–22461` to `app/jd-extraction/`. Pure functions, no DOM.

### R28 — Move `esc()` + text helpers to `app/util/text.js`
- **Effort**: 30 min · **Risk**: zero · **Source**: MODULE_SPLIT Phase C
- Eliminates implicit globals shared with `analysis/render.js`.

### R29 — Extract Brand Asset / Logo system
- **Effort**: 2 hr · **Risk**: low · **Source**: MODULE_SPLIT Phase D
- Move `app.js:1484–1825` to `app/brand/assets.js`.

### R30 — Extract Section Context CRUD
- **Effort**: 1 hr · **Risk**: low · **Source**: MODULE_SPLIT Phase E, FUNCTION_REGISTRY §8
- Move `app.js:15392–15565` to `app/workspace/section-context.js`.

### R31 — Extract Workspace data layer (`ws*` family + `updateRole`)
- **Effort**: 3 hr · **Risk**: medium · **Source**: MODULE_SPLIT Phase F
- Move `app.js:48–340` minus the candidate-learning callbacks.

### R32 — Extract Candidate Learning module
- **Effort**: 3 hr · **Risk**: medium · **Source**: MODULE_SPLIT Phase G
- Move `app.js:354–805`. Convert globals to module-private + getter.

### R33 — Lazy-load + extract Admin panel
- **Effort**: 4 hr · **Risk**: low · **Source**: MODULE_SPLIT Phase H
- Move `app.js:27887–29500` to `app/admin/`.

### R34 — Extract Recruiter views
- **Effort**: 3 hr · **Risk**: low · **Source**: MODULE_SPLIT Phase I
- Move `app.js:25855–27050` to `app/recruiters/`.

---

## Tier 4 — Larger plays (medium–high risk, 4+ hr)

### R35 — Migrate `rw_role_notes_*` to DB
- **Effort**: 2 hr · **Risk**: low · **Source**: STATE_AND_STORAGE §7.1
- Add `roles.notes` column or `role_notes` table. Reuse `updateRole`. Migrate existing local data on next app load.

### R36 — Replace Tailwind Play CDN with build step
- **Effort**: 2 hr · **Risk**: medium · **Source**: PERFORMANCE_HOTSPOTS #1
- PostCSS + Tailwind CLI → static `tailwind.css`. Or inline used utilities into `styles.css`.

### R37 — Standardise typography to 8 size tokens
- **Effort**: 4–6 hr · **Risk**: medium · **Source**: CSS_AUDIT §8
- 40+ unique font sizes across ~500 sites → 8 tokens. Visual diff each surface.

### R38 — Tokenise hardcoded colours
- **Effort**: 2 hr · **Risk**: low · **Source**: CSS_AUDIT §4
- Replace ~30 hex literals with existing `var(--*)` tokens. Add `--indigo-500` for `#6366f1`.

### R39 — Guard against full re-render in `selectRole`
- **Effort**: 30 min for the guard · **Risk**: low · **Source**: PERFORMANCE_HOTSPOTS #5
- Add `if (newRoleId === currentRoleId) return;` early in `selectRole`.

### R40 — Split the rendering monolith (Phase J)
- **Effort**: 1+ day · **Risk**: high · **Source**: MODULE_SPLIT Phase J
- Defer until R27–R34 stable.

---

## Tier 5 — Needs decision (don't action without owner)

### R41 — Decide fate of `Design/role-analysis.css`
- **Effort**: 5 min discussion · **Risk**: needs verification · **Source**: UNUSED_CODE §1.5
- Not loaded; possibly reference design.

### R42 — Move `.alert__*` and `.badge-pill*` to design-system stylesheet
- **Effort**: 1 hr · **Risk**: low · **Source**: CSS_AUDIT §3.4, §3.5
- Decide whether they will ever be used in production.

---

## Tally

| Tier | Items | Total effort | Cumulative impact |
|---|---:|---|---|
| 1 — Quick wins | 15 | ~5 hr | ~350 KB deleted, ~1 s perceived perf, debug visibility |
| 2 — Consolidations | 11 | ~10 hr | ~250 lines saved, error visibility, consistent helpers |
| 3 — Module extractions | 8 | ~18 hr | app.js shrinks ~6,000 lines, lazy-loadable features |
| 4 — Larger plays | 6 | ~15 hr | Theme/build/render improvements |
| 5 — Decisions | 2 | discussion | — |

**Tier 1 alone is one focused afternoon. Tiers 1+2 = one solid week.**
