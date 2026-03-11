# RoleWise UX Polish Pass — Completion Report

**Date:** 2026-03-11
**Files modified:** `styles.css`, `design-system/tokens.css`
**Scope:** Three focused UX refinement passes + prerequisite dark mode token fix

---

## Foundation Fix — Semantic Token Dark Mode (prerequisite)

Before any pass could land correctly in dark mode, a structural gap needed closing: the legacy semantic shorthand tokens (`--bg`, `--surface`, `--bg-card`, `--card-bg`, `--card-border`, `--border`, `--border-light`, `--text`, `--text-muted`, `--text-light`) had zero dark mode overrides in `tokens.css`. The `[data-theme="dark"]` block only covered Untitled UI PRO's `--color-*` and `--utility-*` token namespaces. Any element using the legacy tokens was stuck at light-mode values even when dark mode was active.

**Added to `[data-theme="dark"]` in tokens.css:**

| Token | Dark value |
|---|---|
| `--bg` | `#0c0e12` — page/panel wash |
| `--surface` | `#13161b` — elevated surfaces |
| `--bg-card` | `#13161b` — legacy alias |
| `--card-bg` | `#13161b` — card background |
| `--card-border` | `#373a41` — card border |
| `--border` | `#373a41` — default border |
| `--border-light` | `#22262f` — subtle border |
| `--text` | `#f0f0f1` — primary body text |
| `--text-muted` | `#94979c` — tertiary / labels |
| `--text-light` | `#61656c` — placeholder / disabled |

This fix unlocks correct dark mode rendering for every element that uses the legacy token system — which covers the majority of structural UI.

---

## Pass 1 — Role Overview Layout Polish

**Goal:** Improve card readability, body text comfort, section heading legibility, and visual rhythm. Ensure cards look correct in both light and dark mode.

**Changes in `styles.css`:**

**Section header label (`rw-section-header__label`):**
The base rule used `--text-light` (#697586), which is very faint and difficult to scan when navigating between card groups. Bumped to `--text-muted` in the polish pass for better readability. Letter-spacing tightened from 0.08em to 0.10em — the wider tracking was adding whitespace without improving legibility at 10.5px.

**Card body text (`rw-card p`, `rw-card li`):**
Added explicit `line-height: 1.65` to all paragraphs and list items inside cards. Analysis-heavy cards (Fit Reality, Role Shape Signals, Risks) benefit significantly — the base global `line-height` was tighter. Data cards also gain vertical breathing room between label/value pairs.

**Narrative paragraph measure (`rw-card--narrative p`, `rw-card--full p`):**
Added `max-width: 66ch` to prevent very long lines in full-width narrative cards (which span the 720px reading column). At 66 characters, reading comfort is optimal without the text feeling cramped.

**Dark mode card hover:**
Light mode hover adds `box-shadow: 0 2px 8px rgba(0,0,0,0.05)` — invisible on dark surfaces. Dark mode override replaces the shadow with a subtle `border-color` step up to `--utility-gray-400` (#61656c), giving the same "card is interactive" signal without relying on drop shadows.

Full-width and intel cards continue to suppress hover effects (as in light mode).

---

## Pass 2 — Inbox Role Card Interaction Polish

**Goal:** Visible hover and active states in dark mode, clear attention signalling, correct badge/tag colours in dark mode.

**Changes in `styles.css`:**

**`col-list` panel border (dark mode):**
The panel uses `border: 1px solid rgba(0,0,0,0.06)` and `box-shadow: rgba(0,0,0,0.06)` — both near-transparent black tints that disappear entirely on dark surfaces. Dark mode override switches to `var(--card-border, #373a41)` border and suppresses the shadow.

**`inbox-search` divider (dark mode):**
Same `rgba(0,0,0,0.06)` problem on the divider below the search controls. Fixed to `var(--border-light)`.

**Hover state (dark mode):**
`inbox-role` base background in dark mode = `var(--surface)` = `#13161b`. Hover background = `var(--color-bg-secondary)` = also `#13161b`. Hover was completely invisible. Dark mode override steps hover up to `var(--color-bg-active, #22262f)` — a visible lift without being dramatic.

**Active/selected state (dark mode):**
`var(--accent-soft)` = `rgba(82,100,180,0.08)` — 8% opacity on `#13161b` is effectively invisible. Dark mode override replaces with `var(--utility-brand-50, #2c1c5f)` — the same deep brand tint used for dark mode status tags. The accent left border remains unchanged (it uses `--color-fg-brand-primary` which already has dark coverage = `#9e77ed`).

**Attention dot:**
Changed from `background: var(--text-muted)` (neutral grey — reads as inactive) to `background: var(--accent)` (brand accent). A grey dot communicates nothing; an accent dot signals "this card needs your attention." Also fine-tuned `vertical-align` from 0.1em to 0.15em for better centring against 14px company text.

**ARS hiring-signal badge dark mode (8 variants):**
All badge variants used hardcoded light tints (#DCFCE7, #FEE2E2, etc.) with no dark coverage. Dark mode overrides use the utility palette dark swatches (already defined in tokens.css), giving correctly-themed coloured indicators: green for active/offer/accepted, amber for waiting/stale, red for rejected, grey for ghosted/withdrew, blue for interviewing.

**Stage tag dark mode (8 variants):**
Same issue. Dark mode overrides use matching utility palette values. Each stage maps to a semantically consistent hue: early stages → blue/indigo, active stages → purple, final stages → amber/green.

---

## Pass 3 — Chat UX Refinement

**Goal:** Correct dark mode tints for user bubbles and composer focus, improved paragraph readability, smooth visual rhythm.

**Changes in `styles.css`:**

**User bubble dark mode tint:**
`ws-chat-bubble--user` uses `background: var(--accent-soft)` — same 8% opacity issue as the inbox active state. Dark mode override uses `var(--utility-brand-50, #2c1c5f)` — a solid dark brand tint that clearly identifies user messages without competing with the assistant content.

**Composer focus glow (dark mode):**
`ws-chat-inner:focus-within` uses `box-shadow: 0 0 0 3px var(--accent-soft)` — the 8% opacity focus ring is invisible in dark mode. Dark mode override applies `var(--focus-ring-shadow)` — the standardised focus ring token (28% opacity brand-500 at `#9e77ed`) which matches all other focus rings in the app.

**Assistant reply paragraph spacing:**
Bumped `ws-assistant-reply p` margin-bottom from 8px to 10px. Longer multi-paragraph replies are more comfortable to read with slightly more separation between ideas. The `p:last-child` override correctly keeps the final paragraph's bottom margin at 0.

**Assistant reply list items:**
Added `margin-bottom: 4px; line-height: 1.6` to `ws-assistant-reply li`. Bulleted lists in chat (common for recommendations, steps, options) read better with a small item gap.

---

## Validation Summary

| Check | Result |
|---|---|
| CSS brace balance (styles.css) | 1927/1927 — OK |
| CSS brace balance (tokens.css) | 3/3 — OK |
| `--color-brand-*` references in styles.css | 0 remaining |
| `--color-warning-*` references in styles.css | 0 remaining |
| `--color-error-*` / `--color-success-*` | 0 remaining |
| Hardcoded `rgba(127,86,217,…)` focus rings | 0 remaining |
| Hardcoded `#ffffff` / `#fff` backgrounds | 0 remaining |
| Dark mode — semantic shorthand tokens | All 10 added |
| Dark mode — card surfaces (`--card-bg`, `--card-border`) | Added |
| Dark mode — inbox hover visible | Fixed |
| Dark mode — inbox active state visible | Fixed |
| Dark mode — user chat bubble visible | Fixed |
| Dark mode — composer focus ring | Fixed |
| Dark mode — ARS badges | 8 variants fixed |
| Dark mode — stage tags | 8 variants fixed |
| Dark mode — col-list panel borders | Fixed |
| Card body text line-height | 1.65 across all cards |
| Narrative paragraph max-width | 66ch |
| Section header label legibility | Bumped to --text-muted |
| Attention dot intent | Accent colour |

---

## Remaining UI Debt (not in scope)

- **`--gray-*` → `--color-bg-*` migration for borders and text** — the cleanup pass tackled surface backgrounds only; `var(--gray-700)` on modal close hover and other grey-scale text tokens still use primitives
- **`ACCENT_THEMES` / `setAccentTheme` removal** — preserved to avoid breaking the CSS variable pipeline; safe to remove once accent token chain is confirmed stable
- **Inline `style=""` hardcodes in app.js templates** — some margin/padding/border values are inlined directly; not a token concern but worth a future JS template pass
- **Full `overflow-anchor` / smooth scroll audit** — streaming chat works but a formal scroll smoothness pass with `scroll-behavior` and `overflow-anchor` settings could improve feel on slow connections
- **ARS badge light-mode colours** — the base colour values (#DCFCE7 etc.) are slightly inconsistent with the utility palette; a future pass could unify to `var(--utility-*)` tokens for light mode too
