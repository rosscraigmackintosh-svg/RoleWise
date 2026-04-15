# MODULE_SPLIT_PROPOSAL — RoleWise

> Generated: 2026-04-14. How to break up `app.js` (1.68 MB / 31,999 lines / 568 functions) **incrementally** without rewriting.
>
> The whole point: every step delivers value alone, leaves the app working, and is independently revertable. No big-bang refactor.

---

## Why split

1. **Cognitive load**: 32k lines in one file means scrolling, grep-driven navigation, and constant context switching.
2. **Boot time**: All 1.7 MB is parsed before first paint. Reasoning map, JD extractor, admin tabs are loaded eagerly even though most users never touch them.
3. **Independent ownership**: Sections like JD extraction, brand assets, and section-context have zero overlap with each other and could be maintained separately.
4. **Testability**: Pure helpers (JD extractors, salary parsers) are untestable while trapped in an IIFE.

## What NOT to do

- Don't introduce a bundler in step 1. Keep using `<script>` tags with ES modules (`<script type="module">` — supported in every modern browser). Bundling becomes the *next* problem after splitting.
- Don't add a framework. The current architecture works; do not pile on React/Vue/Solid for refactoring's sake.
- Don't move files that share state without first promoting that state to an explicit export. The DOM-globals pattern is fine for now.

---

## The split, in priority order

### Phase A — Lazy-load the big leaf modules (1 hr, zero risk)

These are already isolated. Convert their `<script>` tags to `defer` or dynamic imports.

| Module | Current size | Action |
|---|---:|---|
| `app/reasoning-map.js` | 124 KB / 2,763 lines | Convert from eager `<script>` to `await import('./reasoning-map.js')` inside `window.openReasoningMap`. **Saves ~500 ms parse on boot for 80%+ of sessions.** |
| `app/devtools/inspect/inspect-mode.js` | small | Already localhost-guarded, but loaded eagerly. Wrap in `if (location.hostname === 'localhost') { import(...) }`. |

**Risk**: zero. **Effort**: 30 min combined. **No code moves**.

---

### Phase B — Extract JD Extraction Engine v2 (2 hr, low risk)

`app.js:21013–22461` is already a self-contained module-within-the-file with documented layered architecture. Already separated from anything DOM-related.

**New file**: `app/jd-extraction/index.js` (export `runJDExtractionV2`, `_mergeJDExtractionWithAI`).

**Sub-modules** (optional split inside `jd-extraction/`):
- `extractors.js` (Layer 1+2: `_extractSalary`, `_extractWorkModel`, `_extractLocation`, `_extractEmploymentType`, `_extractIR35`, `_extractDayRate`, `_extractContractLength`, `_extractStartDate`, `_extractCompany`)
- `validators.js` (Layer 3)
- `merge.js` (`_mergeJDExtractionWithAI`)
- `test-bank.js` (`window._testJDExtract`)

In `app.js`, replace the section with:
```js
import { runJDExtractionV2, mergeJDExtractionWithAI } from './jd-extraction/index.js';
```

**Risk**: low — pure functions, no globals touched. **Effort**: 2 hr.

---

### Phase C — Extract analysis modules already on disk (1 hr, zero risk)

`app/analysis/render.js` and `app/analysis/signals.js` already exist and are loaded as separate scripts. Their dependency on the global `esc()` and `_sanitizeUiText()` from app.js is the only friction.

**Action**: Move `esc()` (`app.js:1398`) and `_sanitizeUiText` to `app/util/text.js`. Import from there in app.js, render.js, signals.js. **Eliminates implicit globals**.

**Risk**: zero — `esc` is already global. **Effort**: 30 min.

---

### Phase D — Extract Brand Asset / Logo system (2 hr, low risk)

`app.js:1484–1825` is cohesive: cache state, fetch logic, DOM factory.

**New file**: `app/brand/assets.js`. Exports:
- `loadBrandAssets()`
- `resolveBrandAsset(company, domain)`
- `renderLogoEl(asset, size)`

State (`_brandAssetCache`, `_brandAssetCacheId`, `_logoFetchInFlight`) becomes module-private.

**Risk**: low — only touches its own state. **Effort**: 2 hr.

---

### Phase E — Extract Section Context (1 hr, low risk)

`app.js:15392–15565`. Six functions, one JSON column, no DOM.

**New file**: `app/workspace/section-context.js`. Exports `scLoadAll`, `scGet`, `scGetRoleOnly`, `scSet`, `scDelete`.

**Risk**: low. **Effort**: 1 hr.

---

### Phase F — Extract Workspace primitives + supabase wrappers (3 hr, medium risk)

`app.js:48–340` is the workspace data layer (`wsAddMessage`, `wsAppendDecision`, etc.).

**New file**: `app/workspace/data.js`. Exports the `ws*` family plus the (proposed) `updateRole` helper from DUPLICATE_LOGIC_REPORT §10.

**Tricky bit**: `wsAppendDecision` calls `_saveCandidateDecisionExt`, `_updateCandidateLearningCounters`, `_rebuildCandidateLearningPatterns` — all of which depend on candidate-learning state. Either:
- (a) accept circular import via late binding (`import('./candidate-learning.js').then(...)`),
- (b) extract candidate-learning at the same time (Phase G),
- (c) leave the call sites in app.js and only move the pure write functions.

Recommend (c) for first pass.

**Risk**: medium. **Effort**: 3 hr.

---

### Phase G — Extract Candidate Learning (3 hr, medium risk)

`app.js:354–805`.

**New file**: `app/learning/candidate.js`. Exports the `_loadOrCreateCandidate*`, `_saveCandidate*`, `_updateCandidateLearning*`, `_rebuildCandidateLearningPatterns`, `_buildAndSetLiveCandidateContext`.

State (`_candidateProfile`, `_candidateLearning`) becomes module-private with explicit getter exports.

**Risk**: medium — globals become exports; every consumer needs updating. **Effort**: 3 hr.

---

### Phase H — Extract Admin panel (4 hr, low risk)

`app.js:27887–29500` is its own world. Each tab has its own renderer. Lazy-load the whole admin module.

**New file**: `app/admin/index.js` with one renderer per tab in `app/admin/tabs/*.js`.

In `app.js`:
```js
async function renderAdminView() {
  const mod = await import('./admin/index.js');
  mod.render();
}
```

**Risk**: low — admin is opt-in. **Effort**: 4 hr.

---

### Phase I — Extract Recruiter views (3 hr, low risk)

`app.js:25855–27050`. Self-contained CRUD + render.

**New file**: `app/recruiters/index.js`.

**Risk**: low. **Effort**: 3 hr.

---

### Phase J — Optional final pass: split the renderer-monolith

What's left in `app.js` is the centre column (renderRoleDoc, renderMatchOutput, renderRail, renderInbox), the boot sequence, and a handful of cross-cutting helpers. This is the high-coupling region — split last, only if needed.

Possible structure:
- `app/inbox/render.js`
- `app/role/render.js` (header, sticky, banner, JD section)
- `app/role/match.js` (renderMatchOutput + dependencies)
- `app/role/rail.js`
- `app/boot.js` (refresh + initial render orchestration)

**Risk**: high — these touch many globals. Defer until A–I are stable.

---

## Order of operations

```
A. Lazy-load reasoning-map + inspect-mode  → 30 min
B. Extract JD Extraction Engine            → 2 hr
C. Move esc() to util/text.js              → 30 min
D. Extract Brand Asset system              → 2 hr
E. Extract Section Context                 → 1 hr
F. Extract Workspace data layer            → 3 hr
G. Extract Candidate Learning              → 3 hr
H. Lazy-load + extract Admin               → 4 hr
I. Extract Recruiter views                 → 3 hr
J. Split the rendering monolith            → defer
```

**Phases A–E (the easy half): ~6 hours, ~1,700 lines extracted. App still works exactly the same way. Boot time ~700 ms faster.**

---

## Loading model

Stay on native ES modules with no bundler:

```html
<!-- index.html -->
<script type="module" src="./app.js"></script>
```

In `app.js`:
```js
import { esc } from './util/text.js';
import { runJDExtractionV2 } from './jd-extraction/index.js';
import { loadBrandAssets, resolveBrandAsset } from './brand/assets.js';
// …
```

Modern browsers cache modules; with HTTP/2 the request waterfall is fine for ~20 modules. If module count grows past ~50, add a bundler — not before.

---

## What to avoid

- Don't extract anything tightly coupled to `allRoles` / `selectedRoleId` until the renderers are split (Phase J).
- Don't extract small helpers in isolation — wait until they group naturally with their callers.
- Don't introduce TypeScript in the same PR as a split. One change at a time.

---

## Success criteria

After Phases A–E:
- `app.js` is ~30,000 lines (down from ~32,000).
- Boot parse cost is measurably lower (Lighthouse / dev tools).
- Reasoning map only loads when opened.
- JD extraction is unit-testable in isolation.

After Phases A–I:
- `app.js` is ~22,000 lines.
- Each extracted module has a single owner concept.
- New developers can navigate by feature folder, not by line number.
