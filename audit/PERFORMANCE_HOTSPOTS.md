# PERFORMANCE_HOTSPOTS — RoleWise

> Generated: 2026-04-14. The 12 hotspots below are the only ones worth your time.
> Numbered by severity. Each has evidence, fix, effort, risk.

---

## #1 — Tailwind Play CDN at runtime — **High**

**Evidence**: `app/index.html:16` — `<script src="https://cdn.tailwindcss.com"></script>`.

**Why it costs**: Tailwind Play scans every class in the rendered HTML and compiles utilities in the browser on every page load. Blocks first paint by ~300–500 ms on a mid-range device. Also re-scans on dynamic DOM insertions.

**Fix**: Move Tailwind to a build step (PostCSS + Tailwind CLI), output a single static `tailwind.css`, drop the CDN script. OR — given that styles.css already covers most of the design — inline the small set of Tailwind utilities you actually use into styles.css and remove Tailwind entirely.

**Effort**: Medium (1–2 hr).
**Risk**: Medium — visual regressions if class scan misses a dynamic class.

---

## #2 — Single 1.68 MB monolith bundle, no splitting — **Critical**

**Evidence**:
- `wc -c app/app.js` → 1,682,364 bytes
- `wc -l app/app.js` → 31,999 lines
- No `import` / `import()` in app.js (vanilla IIFE)

**Why it costs**: 1.7 MB unminified, parsed and executed synchronously on first paint. Mid-range mobile parse time: 3–5 s. Reasoning map (`reasoning-map.js`, 124 KB) is loaded eagerly even though most users never open it.

**Fix**: See MODULE_SPLIT_PROPOSAL. Even a quick win (move `reasoning-map.js` and `inspect-mode.js` to `<script defer>` or dynamic `import()`) shaves ~200 ms with zero refactoring.

**Effort**: Low for the easy wins (1 hr). High for full splitting (4–8 hr).
**Risk**: Low for defer/lazy. Medium for splitting.

---

## #3 — `renderInbox()` called on every keystroke — **Critical**

**Evidence**:
- `grep -nc 'renderInbox(' app/app.js` → **26 call sites**
- `app.js:30746` — `_filterSearch.addEventListener('input', () => renderInbox(allRoles));`
- No debounce, no throttle.

**Why it costs**: Each call rebuilds the entire inbox HTML string and assigns to `el.innerHTML`. With 50 roles, that's 500+ DOM nodes regenerated per keystroke. Listeners on each row are reattached. Layout reflow follows.

**Fix**:
1. Debounce the search input at 200–300 ms (10-line change).
2. Cache `_filteredRoles` and only re-render when filter set actually changes.
3. Long-term: targeted DOM updates (add/remove rows) instead of full rebuild.

**Effort**: Low for debounce (15 min). Medium for incremental rendering (3 hr).
**Risk**: Low.

---

## #4 — 253 `innerHTML =` assignments, no diffing — **High**

**Evidence**: `grep -c '\.innerHTML\s*=' app/app.js` → **253**. Hot examples:
- `app.js:3369` — full inbox list rebuild
- `app.js:1903` — chat empty state reset
- `app.js:1924–1932` — six clears in sequence (causes multiple reflows)

**Why it costs**: `innerHTML` triggers full parse, layout, paint. Sequential clears thrash layout. No diffing means a single-character change re-renders the whole subtree.

**Fix**:
1. For lists: build a `DocumentFragment` with `appendChild`, swap once.
2. For empty states: `textContent = ''` is faster than `innerHTML = ''`.
3. For partial updates: cache element references and toggle classes.

**Effort**: Medium (3 hr — focus on the 5 hottest paths).
**Risk**: Low — mechanical replacement.

---

## #5 — No diff layer; centre column rebuilds wholesale on every state change — **High**

**Evidence**: `selectRole()` (`app.js:~3370`) and the surrounding panel transition (`app.js:3607–3710`) call `renderRoleDoc(role)` and `renderRail(role)` unconditionally — these are full re-renders even when the state delta is "user clicked the same role".

**Why it costs**: Selecting a role re-renders ~1,500 DOM nodes, reattaches all event listeners on workspace timeline, and resets scroll position.

**Fix**:
1. Guard: `if (newRoleId === currentRoleId) return;` before calling render.
2. Memoise sub-renders by role version.
3. Long-term: split `renderRoleDoc` into header / body / next-action and only re-render the dirty section.

**Effort**: Low for the guard (15 min). High for split rendering (1+ day).
**Risk**: Medium — state synchronisation needs care.

---

## #6 — Layout thrash: read-after-write within the same function — **High**

**Evidence**:
- `app.js:3395–3399` — write `el.scrollTop`, then read `getBoundingClientRect()` on a child
- `app.js:4840–4842` — write `scrollEl.scrollTop`, read `scrollHeight/scrollTop/clientHeight` immediately
- `app.js:4955–4956` — same pattern in `_wsRemoveThinking`

**Why it costs**: Each read after a write forces synchronous layout. 50–200 ms of jank per interaction stacks up.

**Fix**: Reorder — batch reads first, then writes. Where genuinely needed, defer the read with `requestAnimationFrame()`.

**Effort**: Low (1 hr). 
**Risk**: Low — pure timing reorder.

---

## #7 — 660 `document.querySelector / getElementById` calls; many redundant — **High**

**Evidence**: `grep -c 'document\.\(querySelector\|getElementById\)' app/app.js` → ~660.
Within `renderInbox()` alone: 4 separate `document.getElementById` calls for the same surface (`role-inbox`, `filter-search`, `btn-search-clear`, `inbox-results-count`) at `app.js:3047, 3052, 3116, 3121`.

**Why it costs**: Aggregate ~50–100 ms of avoidable lookup time on a typical session. Worse on mobile.

**Fix**:
1. Cache long-lived elements at boot: `const _inboxEl = document.getElementById('role-inbox')`.
2. For repeated lookups inside a function, hoist to a single const.
3. Use `const` element registry pattern at the top of app.js (~30 lines).

**Effort**: Medium (2 hr — focus on the 20 hottest functions).
**Risk**: Low — IDs don't change at runtime.

---

## #8 — `requestAnimationFrame` underused — **Medium**

**Evidence**: `grep -c 'requestAnimationFrame' app/app.js` → 13 calls.
Many layout-sensitive operations use `setTimeout(fn, 0)` or no scheduling at all.

**Why it costs**: Without rAF, the browser may execute layout work mid-frame, missing paint deadlines. Visible jank during transitions.

**Fix**: Wrap the small set of (write → read) pairs in rAF. Replace `setTimeout(fn, 0)` with `requestAnimationFrame(fn)` where the work is layout-related.

**Effort**: Low (1 hr).
**Risk**: Low.

---

## #9 — Repeated `_panels.forEach(...)` in selectRole transition — **Medium**

**Evidence**: `app.js:3649, 3663, 3669, 3695, 3701` — five separate iterations over the same 2-element panel array, applying CSS properties one phase at a time.

**Why it costs**: Each iteration re-enters the loop context and forces a style recalc. ~5–10 ms per role change. Multiplied by frequent role switching, noticeable.

**Fix**: Consolidate into one loop, OR replace inline style writes with a single CSS class toggle.

**Effort**: Low (30 min).
**Risk**: Low.

---

## #10 — Logo fetch fallback timeout 6000 ms blocks logo render — **Medium**

**Evidence**: `app.js:1674` — `setTimeout(() => resolve(false), 6000)` in `_validateImageUrl`.

**Why it costs**: When the brand asset CDN is slow or down, individual logos hang for up to 6 s. Cards render with placeholder until the timer fires.

**Fix**:
1. Drop timeout to 2000 ms.
2. Add `<link rel="preconnect" href="https://logo.clearbit.com">` in `index.html`.
3. Defer logo validation off the critical render path.

**Effort**: Low (30 min).
**Risk**: Low.

---

## #11 — Silent fire-and-forget DB writes — **Medium** (observability, not perf)

**Evidence**: `grep -c '\.catch' app/app.js` → 94, most `.catch(() => {})`. Examples: `app.js:94, 97, 100`.

**Why it costs**: Failed writes (network drop, auth expiry, RLS reject) are invisible. Lost decision counters / learning data leave no trace. Debugging is impossible.

**Fix**:
1. Replace `.catch(() => {})` with `.catch(err => console.warn('[fnName]', err))`.
2. Surface critical errors via the existing `.ws-save-warning` UI (`app.js:80`).
3. Add structured logging via `_logUsageEvent`.

**Effort**: Medium (1–2 hr).
**Risk**: Low — observability only.

---

## #12 — `reasoning-map.js` (124 KB / 2,763 lines) loaded eagerly — **Medium**

**Evidence**: `app/index.html` references `reasoning-map.js` in a top `<script>` tag. Most users never open the reasoning map — it's a "View reasoning" power feature.

**Why it costs**: Adds ~300–500 ms parse time on every page load.

**Fix**: Convert to dynamic import inside `window.openReasoningMap` — load only on first invocation.

```js
window.openReasoningMap = async (role) => {
  const mod = await import('./reasoning-map.js');
  mod.open(role);
};
```

**Effort**: Low (30 min).
**Risk**: Low — first open is ~200 ms slower; subsequent are free.

---

## Summary

| # | Hotspot | Severity | Effort | Est. impact |
|---:|---|---|---|---|
| 1 | Tailwind Play CDN | High | Medium | −400 ms first paint |
| 2 | 1.68 MB monolith | **Critical** | High | −3–5 s startup (mobile) |
| 3 | renderInbox per keystroke | **Critical** | Low | −1–2 s per filter |
| 4 | 253 innerHTML writes | High | Medium | −500–800 ms re-renders |
| 5 | No diffing | High | High | −800 ms per role select |
| 6 | Layout thrash | High | Low | −50–200 ms per interaction |
| 7 | 660 DOM queries | High | Medium | −50–100 ms aggregate |
| 8 | rAF underuse | Medium | Low | −20–50 ms jank |
| 9 | Repeated `_panels.forEach` | Medium | Low | −5–10 ms |
| 10 | Logo timeout 6 s | Medium | Low | −6 s worst case |
| 11 | Silent `.catch()` | Medium | Medium | observability |
| 12 | reasoning-map eager load | Medium | Low | −500 ms startup |

**Highest-leverage trio**: #3 (debounce, 15 min), #6 (reorder reads/writes, 1 hr), #12 (lazy reasoning map, 30 min). All low-risk, ~2 hr total, big perceptible win.
