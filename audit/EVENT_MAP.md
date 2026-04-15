# EVENT_MAP — RoleWise

> Generated: 2026-04-14. Where listeners live and what they trigger.
>
> Counts from grep: `addEventListener` ≈ 204, `dispatchEvent` = 4, `setInterval` = 1, `setTimeout` ≈ 20+, `IntersectionObserver` = 1, `MutationObserver` = 0, `ResizeObserver` = 0.

---

## 1. Global / document / window listeners

| File:line | Target | Event | Handler |
|---|---|---|---|
| `app.js:1177` | `_appearanceMQ` (matchMedia) | `change` | Re-apply appearance vars on OS dark-mode toggle |
| `app.js:8755` | `document` | `keydown` | Ctrl+Enter submits workspace chat / decision form |
| `app.js:15815` | `document` | `click` | Theme/appearance settings popover delegate |
| `app.js:30818` | `document` | `keydown` | **Global Escape** — closes modals + exits inspect mode |
| `inspect-mode.js` | `document` | `mousemove`, `click`, `keydown` | Inspect overlay (localhost only) |

No `window.addEventListener('beforeunload')`, `'resize'`, `'popstate'`, `'message'`, or `'storage'`.

---

## 2. Custom events

Total `dispatchEvent`: 4. All on element handles, not a global bus.

| Dispatch site | Event | Listener |
|---|---|---|
| `app.js:2425` | `wsInput.dispatchEvent(new Event('input'))` | re-render preview synthetically |
| `app.js:5073` | `timelineEl.dispatchEvent(new CustomEvent('ws:chip-send', { detail }))` | listener at `app.js:9637` |
| `app.js:6014` | same `ws:chip-send` | same listener |
| `app.js:31518` | `_jdEl.dispatchEvent(new Event('input'))` | triggers JD textarea autofill flow |

There is **no internal pub-sub / EventEmitter**.

---

## 3. Observers

| File:line | Type | What it watches |
|---|---|---|
| `app.js:11340` | `IntersectionObserver` | Detail strip visibility — when the strip scrolls out of view, reveal `#role-sticky-header` |

No MutationObserver, ResizeObserver.

---

## 4. setInterval / setTimeout

### setInterval (1 instance)

| File:line | Variable | Purpose |
|---|---|---|
| `app.js:9362` | `_wsPhInterval` | Workspace phase polling during multi-step analysis. Cleared on phase complete (around `app.js:9400`). |

### Notable setTimeouts

| File:line | Duration | Purpose |
|---|---:|---|
| `app.js:82` | 12000 ms | Auto-remove transient `.ws-save-warning` element |
| `app.js:1674` | 6000 ms | Logo fetch fallback timeout |
| `app.js:2133, 2411` | 400/800 ms | Stagger analysis step animation |
| `app.js:4838` | (debounce id) | Workspace timeline scroll debounce |
| `app.js:5042–5220` | 120–170 ms | Decision confidence bar render stagger |
| `app.js:5922, 8427` | 5000 ms | Auto-dismiss error UI |
| `app.js:6740, 6960` | varies, 130 ms | Step-by-step analysis fade |
| `app.js:8726` | 1200 ms | Copy button feedback "Copied" timeout |
| `app.js:9002, 9012, 9032–9051` | 4000–5000 ms | Auto-fade status messages |
| `app.js:10164` | (debounce) | Notes save debounce → `_notesTimer` |
| `app.js:10493` | 600 ms | Show outcome reason form after decision animation |
| `app.js:11853` | 1500 ms | Clear "saving…" message |

There are no `requestAnimationFrame` calls — render-then-measure patterns happen in the same frame (see PERFORMANCE_HOTSPOTS #6).

---

## 5. Major event delegation hubs

These are the largest single-listener surfaces — useful to know because adding behaviour to one of these surfaces does NOT need a new listener.

| Hub element | Listener at | Children handled |
|---|---|---|
| `.overview-cards` | `app.js:8589, 8666, 8717, 8826` (4 different click delegates on the same container — see DUPLICATE_LOGIC §10 about consolidation) | mood update, recruiter link, engagement type, work model, add role, archive |
| `#ws-timeline` | `app.js:9637` | `ws:chip-send` custom event |
| `#rw-ingestion-overlay` (modal) | various inside `openIngestionOverlay` | submit, cancel, context Q&A |
| `#modal-add` etc. | overlay click + close button | each modal has a backdrop + close pair |
| `#col-filter` | `app.js:30746–30808` | search input + checkboxes |
| `#role-inbox` rows | `app.js:3372` per-row + `3378` per-checkbox | select role / toggle compare |

> Splitting four delegates on `.overview-cards` into one is a low-risk, high-clarity refactor.

---

## 6. Per-feature listener summary

### Setup card (`app.js:~970–1010`)
- chip click → toggle selection
- Cancel → close
- Save → persist boundaries

### Workspace chat (`app.js:2386–2431`, `9626–9627`)
- input event → preview render
- keydown → Ctrl+Enter to send
- click on send button → submit

### Decision bar (`app.js:5071–5142`)
- click on Apply / Save / Pass buttons
- click on pass-reason chips
- `app.js:5213` Reconsider revert

### Add JD modal & ingestion (`app.js:31019–31645`)
- blur on JD textarea → recruiter autofill
- input on URL → company autoextract
- paste on JD → handle paste
- click LinkedIn fetch
- multiple modal close / save buttons

### Notes
- input event (debounced) save to LS
- blur event save

### Inbox / role list
- row click → selectRole
- checkbox change → compare set toggle

### Filter panel
- input → live filter via renderInbox
- toggle button → show/hide
- checkbox change → state update

### Nav
- nav button click → switchNav
- profile click → switchNav('profile')
- "+ Add JD" → openIngestionOverlay
- modal close / save

### Admin panel
- row click → select
- archive / restore / delete / cancel buttons (`app.js:28184–28204`)
- search input
- prefs save / clear / save (`app.js:29097, 29116`)
- section tab clicks (`app.js:29164`)

### Monthly review
- button → open modal
- timeline-more button → expand
- close + backdrop + Escape

---

## 7. Things to be aware of

1. **Four delegates on `.overview-cards`** — consolidate into one to reduce listener count and clarify ownership.
2. **No event removal** — listeners are attached on every render. Because containers are typically replaced wholesale (`el.innerHTML = …`), listeners are GC'd, but listeners attached to long-lived elements (e.g. `document`) accumulate if a render path is bugged. There is no central registry. Recommend a small `registerHandler(el, type, fn)` helper if you ever need to clean up.
3. **No keyboard shortcuts beyond Ctrl+Enter and Escape** — easy place to add if you want power-user features.
4. **No `'storage'` event listener** — multi-tab usage will not synchronise theme / notes / unlock state.
5. **No `'beforeunload'`** — you can't warn the user if they close the tab mid-paste.
