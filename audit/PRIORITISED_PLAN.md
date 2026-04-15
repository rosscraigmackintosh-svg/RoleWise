# PRIORITISED_PLAN — RoleWise

> Generated: 2026-04-14. The wrap-up. What to do, what to skip, in what order.
>
> Read SYSTEM_INDEX, WHERE_THINGS_LIVE, and HOW_THE_APP_WORKS first if you haven't.

---

## TL;DR

You have a **healthy but heavy** codebase: 32k-line vanilla-JS monolith, no dead end-user features, no architectural rot — just **scale fatigue**. The 10 wins below get you 80% of the value with 0% of the rebuild risk.

| Bucket | Win | Effort | Risk |
|---|---|---|---|
| Quick wins | Delete dead files + duplicate CSS | 1 hr | Zero |
| Quick wins | Debounce inbox search | 15 min | Low |
| Quick wins | Lazy-load reasoning map | 30 min | Low |
| Quick wins | Make `.catch()` non-silent | 1 hr | Zero |
| Quick wins | Add app.js master map comment | 30 min | Zero |
| Consolidations | Promote 5 helpers to module scope | 4 hr | Low |
| Consolidations | `updateRole()` wrapper | 1 hr | Low |
| Module split | Lazy + extract reasoning + JD engine | 3 hr | Low |
| Performance | Reorder layout reads/writes | 1 hr | Low |
| Storage | Move notes to DB | 2 hr | Low |

**Total: ~14 hours of focused work, no behaviour change, observably faster app, much smaller cognitive load.**

---

## 1. Quick wins (one focused afternoon)

These ship the same day. No owner sign-off needed.

### 1.1 Delete dead weight (1 hr)
- 4 legacy HTML prototypes (~320 KB)
- `_test-layout.html`, `test-pipeline-output.html`, `backup/` (~28 KB)
- `app/config.js` (5 lines)
- Move `app/recruiter-backfill.js` → `scripts/`
- `.yl-*` CSS family (~120 lines)
- Duplicate `.hidden`, duplicate `.rw-doc-bullets`, `.modal-overlay`, `.snap-divider`, `.avatar--*` variants (~170 lines)

**Total**: ~350 KB + 290 lines deleted. Source: UNUSED_CODE_REPORT, CSS_AUDIT.

### 1.2 Add app.js map comment (30 min)
Single block comment at top of `app.js` listing the major section line ranges. Source: DEV_SPEED_PLAN #11.

### 1.3 Debounce inbox search input (15 min)
One-liner change at `app.js:30746` + 5-line `_debounce` helper. Source: PERFORMANCE_HOTSPOTS #3.

### 1.4 Lazy-load reasoning-map.js (30 min)
Convert eager `<script>` to dynamic `import()` inside `window.openReasoningMap`. Source: MODULE_SPLIT Phase A.

### 1.5 Drop logo timeout 6000 → 2000 ms + add preconnect (15 min)
`app.js:1674`. Add `<link rel="preconnect">` for logo CDN in `index.html`. Source: PERFORMANCE_HOTSPOTS #10.

### 1.6 Replace silent `.catch(() => {})` with `swallow(label)` (1 hr)
3-line helper, search-and-replace 94 sites. Source: PERFORMANCE_HOTSPOTS #11.

**Afternoon delivers**: faster boot, faster typing, observable errors, 350 KB lighter repo, top-of-file map for new readers.

---

## 2. Best refactors (one solid week, optional)

### 2.1 Promote helpers to module scope (4 hr)

Five cluster consolidations from DUPLICATE_LOGIC_REPORT:
- `_fmtDate / _fmtTs` (consolidate 2 redefinitions + 9 inline calls)
- Delete local `_esc` lambdas; rely on global `esc()`
- Add `WORK_MODEL_LABELS` + `normaliseWorkModel`
- Add `SALARY_MISSING_RE` + `isSalaryMissing` predicate
- Add `updateRole(id, patch)` wrapper (replaces 17 sites)

These are mechanical. ~200 lines saved, zero behaviour change, one clear "where it lives" answer for each helper.

### 2.2 Module split Phase A–C (3.5 hr)

- Lazy reasoning + inspect (already in §1.4)
- Extract JD Extraction Engine v2 to `app/jd-extraction/`
- Move `esc()` to `app/util/text.js`

After this, `app.js` is ~30,000 lines (still a monolith, but with two clearly extracted feature folders). Source: MODULE_SPLIT_PROPOSAL.

### 2.3 Reorder layout reads/writes (1 hr)

Specific sites: `app.js:3395–3399, 4840–4842, 4955–4956`. Batch reads first. Source: PERFORMANCE_HOTSPOTS #6.

### 2.4 Migrate notes from localStorage to DB (2 hr)

Add a `roles.notes` text column. Migrate existing LS values on next app load. Use `updateRole` from §2.1. Source: STATE_AND_STORAGE §7.1, REFACTOR_BACKLOG R35.

### 2.5 Consolidate four `.overview-cards` click delegates (1 hr)

Merge `app.js:8589, 8666, 8717, 8826` into one delegate switching on `data-action`. Source: EVENT_MAP §7.

---

## 3. Performance improvements (only the worthwhile ones)

| # | Hotspot | Effort | When to do |
|---:|---|---|---|
| 3 | renderInbox debounce | 15 min | **Now** (§1.3) |
| 12 | reasoning-map lazy load | 30 min | **Now** (§1.4) |
| 6 | layout thrash reorder | 1 hr | **Now** (§2.3) |
| 10 | logo timeout / preconnect | 15 min | **Now** (§1.5) |
| 9 | `_panels.forEach` consolidation | 30 min | when next touching `selectRole` |
| 7 | cached element registry | 2 hr | bundled with §2.1 |
| 4 | fix top-5 `innerHTML` paths | 3 hr | after §2 |
| 1 | replace Tailwind Play CDN | 2 hr | after §2 |
| 5 | guard `selectRole` from same-role re-render | 15 min | **Now** if you touch it |
| 2 | bundle splitting | 4–8 hr | after MODULE_SPLIT Phases A–E |
| 8 | rAF coordination | 1 hr | bundled with §2.3 |
| 11 | non-silent `.catch` | 1 hr | **Now** (§1.6) |

**Skip for now**: virtual DOM, full re-render diffing, service worker, WebWorkers. The cost dwarfs the benefit at the current scale.

---

## 4. Things NOT worth doing yet

These appeared during analysis. **Resist them.**

- **Don't introduce React/Vue/Svelte.** Existing renderers work. The migration cost is weeks; the user-visible win is zero.
- **Don't add TypeScript** in the same change as a refactor. Plan it as a follow-on, after Phases A–E.
- **Don't add a bundler.** Native ES modules handle ~20–50 modules fine. Reach for a bundler only when you exceed that.
- **Don't refactor the renderer monolith** (Phase J of MODULE_SPLIT). It's high risk and the audit-tier gains are smaller than Phases A–I.
- **Don't migrate every localStorage key.** Only `rw_role_notes_*` is worth it. The intel-unlock flags are ergonomic where they are.
- **Don't restructure `analysis/`.** It's already the right size.
- **Don't rebuild the reasoning map** because it's "big". It's cohesive, well-bounded, and lazy-loadable. Treat as a black box.
- **Don't extract small helpers in isolation** — wait until they group naturally with their callers, otherwise you fragment the codebase further.
- **Don't add unit-test infrastructure across the whole app** — start with the JD extraction engine after extracting it (§2.2), where unit tests have outsized value.

---

## 5. Suggested next 3 steps (in order)

### Step 1 — The deletion afternoon (today, ~3 hr)

Do everything in §1. One commit per group. End-of-day state:
- 350 KB lighter repo
- Inbox search debounced
- Reasoning map lazy
- Errors visible in console
- New devs have a top-of-file map

### Step 2 — The consolidation week (~10 hr over 5 days)

Do §2.1 + §2.3 + §2.5. Optionally §2.4. End-of-week state:
- ~250 lines deduplicated
- All updates go through one helper
- Layout interactions feel smoother
- Notes survive storage clears

### Step 3 — The first split (~3.5 hr)

Do §2.2. End state:
- `app/jd-extraction/` exists as a unit-testable module
- `app/util/text.js` shared by app.js and analysis/
- Reasoning map only loads when used

After Step 3, decide whether to continue with MODULE_SPLIT Phases D–I (~13 hr more) or pause. The codebase is in a strictly better place either way.

---

## 6. Final summary

| Category | Lines / KB | Notes |
|---|---|---|
| Deletable today (no risk) | ~350 KB + 290 CSS lines + 30 JS lines | UNUSED_CODE_REPORT, CSS_AUDIT |
| Consolidatable (low risk) | ~200 JS lines | DUPLICATE_LOGIC_REPORT |
| Extractable to feature folders | ~6,000 JS lines | MODULE_SPLIT_PROPOSAL Phases A–I |
| Performance hotspots worth fixing | 12 | PERFORMANCE_HOTSPOTS — see §3 above |
| Quick wins under 1 hr each | 15 | REFACTOR_BACKLOG Tier 1 |
| Mid-tier consolidations | 11 | REFACTOR_BACKLOG Tier 2 |
| Module extractions | 8 | REFACTOR_BACKLOG Tier 3 |
| Larger plays (>4 hr) | 6 | REFACTOR_BACKLOG Tier 4 |

**The product is in good shape.** The audit found no rotted features, no insecure patterns, no abandoned subsystems with users on them. Everything in this plan is about *taking weight off the developer*, not fixing what's broken for the user.

Start with the deletion afternoon. The rest follows naturally.
