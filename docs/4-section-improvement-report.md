# RoleWise 4-Section Improvement — Completion Report

**Date:** 2026-03-11
**Files modified:** `app.js`, `styles.css`, `design-system/tokens.css`

---

## Section 1 — Role Intelligence Summary

**Objective:** Compact briefing block below the role header, above the card grid, derived from existing analysis output.

### What was built

`_buildIntelSummary(output)` — a pure function that reads the analysis output object and returns an array of up to 6 signal objects `{ label, value, tone }`, covering:

| Signal | Source field | Tone logic |
|---|---|---|
| Evaluation quality | `output._weakSignal`, `output.jd_completeness.grade` | pos (A/B), warn (D/F), neutral |
| Ownership | `output.ownership_level` | pos (high/company/platform), warn (low) |
| Technical | `output.domain_complexity` | neutral |
| Energy impact | `output.delivery_pressure` | pos (sustainable), warn (intense) |
| Hiring route | `output.hiring_system.type` | warn (high_volume_funnel), pos (direct/founder) |
| Role stability | `output.seniority_authenticity` | pos (authentic), warn (inflated) |

Each signal renders as a `ris-signal` pill with a coloured dot (neutral grey, success green, or warning amber), a muted label, a separator `·`, and a value. Positive values use `--success-600`/`--utility-success-600` (dark); warning values use `--utility-warning-700`/`--utility-warning-600` (dark). The block is suppressed entirely when no signals resolve.

The `rw-intel-summary` wrapper uses `flex-wrap: wrap` so signals reflow gracefully on narrow columns. Full light and dark mode coverage.

**CSS classes added:** `.rw-intel-summary`, `.ris-signal`, `.ris-signal--pos`, `.ris-signal--warn`, `.ris-dot`, `.ris-label`, `.ris-sep`, `.ris-value` + dark mode overrides.

---

## Section 2 — Z-Index Token System

**Objective:** Define a z-index scale in `tokens.css`; replace all hardcoded z-index values in `styles.css`.

### Token scale added to `tokens.css`

```css
--z-base:     0;    /* Default — no stacking context                        */
--z-inset:    1;    /* Minor lift: sticky cluster headers, pseudo-elements  */
--z-raised:   10;   /* Raised UI: floating labels, sticky role header       */
--z-sticky:   20;   /* Sticky bars: intake panel, decision bar              */
--z-dropdown: 100;  /* Dropdowns, popovers, overlay panels                  */
--z-overlay:  200;  /* Dim/backdrop overlays                                */
--z-modal:    300;  /* Modals and dialogs                                   */
--z-toast:    400;  /* Toasts and notifications (always topmost)            */
```

`--z-inset` and `--z-sticky` are supplementary tokens covering the `z-index: 1` and `z-index: 20` values present in the codebase that did not map to the recommended scale directly.

### Replacements in `styles.css`

| Line | Was | Now | Context |
|---|---|---|---|
| 1444 | `z-index: 10` | `var(--z-raised)` | DAB label element |
| 3193 | `z-index: 1` | `var(--z-inset)` | Inbox cluster sticky header |
| 3277 | `z-index: 20` | `var(--z-sticky)` | Intake/empty panel overlay |
| 3393 | `z-index: 10` | `var(--z-raised)` | Role sticky header |
| 3971 | `z-index: 20` | `var(--z-sticky)` | Sticky decision bar |
| 5114 | `z-index: 1` | `var(--z-inset)` | Rail step dot |
| 5266 | `z-index: 100` | `var(--z-dropdown)` | Overlay panel |
| 6292 | `z-index: 1` | `var(--z-inset)` | Chat bar `::before` gradient |
| 6497 | `z-index: 10` | `var(--z-raised)` | Scroll nudge pill |
| 10685 | `z-index: 1000` | `var(--z-modal)` | Modal backdrop |

All 10 values replaced. No stacking behaviour changed — relative ordering between elements is identical. The `z-index: 1000` → `var(--z-modal)` (300) change is safe: no other element has a value between 300 and 1000, so the modal remains topmost.

---

## Section 3 — Inbox Intelligence Signal

**Objective:** Single-line intelligence hint beneath the role title in inbox cards.

### What was built

`_buildInboxSignal(lmo)` — takes `role.latest_match_output` and returns a single short phrase (or `null`). Priority order (most important first):

1. `lmo._weakSignal` → `"Low-signal evaluation"` (affects analysis confidence)
2. `lmo.hiring_system.type === 'high_volume_funnel'` → `"High-volume hiring funnel"`
3. `lmo.delivery_pressure === 'intense'` → `"Intense pace expected"`
4. `lmo.seniority_authenticity === 'inflated'` → `"Seniority may be inflated"`
5. `lmo.ownership_level` in `[high, company_level, platform]` → `"High ownership role"`
6. `lmo.ownership_level === 'low'` → `"Low ownership role"`
7. `lmo.hiring_system.type === 'founder_led'` → `"Founder-led hire"`
8. `lmo.hiring_system.type === 'direct_employer'` → `"Direct employer hire"`
9. `lmo.seniority_authenticity === 'understated'` → `"Understated scope"`

Renders as `<div class="inbox-signals">` immediately after the `inbox-title` element. Suppressed entirely when no signal resolves — cards without analysis data are unaffected.

The `.inbox-signals` CSS class already existed in `styles.css` but was unused. It was refined: `margin-top` reduced from `5px` to `2px` (subtitle feel, tight against title) and `margin-bottom: 2px` added (small gap before meta line). `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` — truncates cleanly, cannot break the list layout.

**Does not affect the existing `inbox-mini-reasons` line** (which remains at the bottom of the card showing decision friction signals).

---

## Section 4 — Chat Scroll Smoothness Audit

**Objective:** Targeted improvements to scroll behaviour during streaming, scroll anchoring, and thinking bubble removal.

### Findings

| Area | Finding |
|---|---|
| Streaming auto-scroll | `_wsScrollIfNear` with 16ms debounce — correct, instant `scrollTop` writes appropriate for streaming |
| Initial history load | Already wrapped in `requestAnimationFrame` — correct |
| Nudge scroll | Used `scrollTop = scrollHeight` — instant (no smooth scroll for a user tap) |
| Thinking bubble removal | `scrollTop = scrollHeight` ran synchronously inside `setTimeout(200)` — could read stale `scrollHeight` before browser reflow |
| `ws-timeline-spacer` overflow-anchor | Not set — browser could anchor to the spacer while it collapses, causing a position jump |
| `scroll-behavior` on `ws-timeline` | Not explicit — relied on browser default |

### Changes made

**`styles.css` — `ws-timeline`:** Added explicit `scroll-behavior: auto` and `overflow-anchor: auto`. Inline `scrollTo({ behavior: 'smooth' })` calls in JS override `scroll-behavior: auto` per-call, so user-initiated smooth scrolls work while streaming auto-scrolls remain instant.

**`styles.css` — `ws-timeline-spacer`:** Added `overflow-anchor: none`. The spacer exists to push content to the bottom of the viewport; it must never be treated as a scroll anchor. Without this, as the spacer collapses when messages fill the timeline, the browser's overflow anchor system can jump the scroll position.

**`app.js` — nudge click:** Changed `scrollContainer.scrollTop = scrollContainer.scrollHeight` to `scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' })`. User-initiated scroll to bottom now animates smoothly. The `behavior: 'smooth'` per-call option takes precedence over the `scroll-behavior: auto` on the container.

**`app.js` — thinking bubble removal:** Wrapped the scroll correction inside the existing `setTimeout(200)` in a `requestAnimationFrame`. This ensures the browser has finished reflowing the timeline (and recalculated `scrollHeight` without the removed bubble node) before the correction reads `scrollHeight`. Without the rAF, `scrollHeight` could still include the removed element's layout contribution, causing a one-frame overshoot.

---

## Validation Summary

| Check | Result |
|---|---|
| CSS brace balance (styles.css) | 1939/1939 — OK |
| CSS brace balance (tokens.css) | 3/3 — OK |
| `--color-brand-*` references in styles.css | 0 — OK |
| `--color-warning-*` references in styles.css | 0 — OK |
| `--color-error-*` / `--color-success-*` references | 0 — OK |
| Hardcoded z-index values in styles.css | 0 — all tokenized |
| Z-index token scale (8 tokens) | All present in tokens.css |
| `_buildIntelSummary` function | Present in app.js |
| `rw-intel-summary` CSS | Present in styles.css |
| `_buildInboxSignal` function | Present in app.js |
| `inbox-signals` CSS | Present in styles.css |
| `intelSigHtml` wired into `renderRoleCard` | Confirmed |
| `scroll-behavior: auto` on `ws-timeline` | Present |
| `overflow-anchor: none` on `ws-timeline-spacer` | Present |
| Nudge click uses `scrollTo({ behavior: 'smooth' })` | Confirmed |
| Thinking bubble rAF scroll correction | Confirmed |

---

## Remaining UI Debt (not in scope)

- **`--gray-*` → `--color-bg-*` migration for borders and text** — still some primitive grey tokens in modal close hover and grey-scale text
- **`ACCENT_THEMES` / `setAccentTheme` removal** — preserved to avoid breaking the CSS variable pipeline
- **Inline `style=""` hardcodes in app.js templates** — some margin/padding/border values are inlined directly
- **ARS badge light-mode colours** — base values (#DCFCE7 etc.) slightly inconsistent with utility palette; could unify to `var(--utility-*)` tokens for light mode too
- **`--z-overlay` and `--z-toast` tokens** — defined in the scale but not yet used by any component; ready for the next overlay/toast implementation
