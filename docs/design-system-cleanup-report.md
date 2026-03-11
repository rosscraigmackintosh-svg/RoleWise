# RoleWise Design System — Stabilisation & Cleanup Report

**Date:** 2026-03-11
**Scope:** Sections 1–7 of the design system cleanup pass
**Files modified:** `app.js`, `styles.css`, `design-system/tokens.css`

---

## Section 1 — Accent Colour Controls Removed

**What was removed:**
The entire accent colour picker UI block (5 colour swatches: Blue, Indigo, Teal, Forest, Plum) was removed from the Profile / Appearance section. The heading copy and `setAccentTheme(...)` initialiser call in the render function were also removed.

**What was kept:**
`ACCENT_THEMES`, `setAccentTheme()`, and the page-load IIFE that restores the saved accent from `localStorage` are all preserved. These still write `--accent`, `--accent-soft`, and `--accent-soft-2` into the `:root` — so all existing interactive highlights continue to render correctly. No breakage to existing styling.

**CSS removed from styles.css:**
`.accent-swatch-row`, `.accent-swatch`, `.accent-swatch-dot`, `.accent-swatch-label` (35 lines). Also removed `#profile-appearance-section .doc-section-heading { color: var(--accent); }`.

---

## Section 2 — Light / Dark / System Appearance Control

**New function:** `setAppearanceMode(mode)` added to `app.js` at the end of the accent/appearance block.

- Accepts `'light'`, `'dark'`, or `'system'`
- Writes or removes `data-theme="dark"` on `<html>` to engage the existing complete dark mode token block
- System mode reads `window.matchMedia('(prefers-color-scheme: dark)')` and reacts to OS changes via `addEventListener('change', …)`
- Persists choice to `localStorage('rw-appearance-mode')`
- Applies on page load via an IIFE (default: `'system'`)
- After profile page renders, buttons get their `.active` class synced to current mode

**New HTML in profile template:**
The Appearance section now shows three pill buttons — Light, Dark, System — using the `.appearance-mode-btn` class.

**New CSS in styles.css:**
`.appearance-mode-row`, `.appearance-mode-btn`, `.appearance-mode-btn:hover`, `.appearance-mode-btn.active` — uses `--accent`, `--accent-soft`, `--border`, `--bg-card` tokens so it themes correctly in both modes.

**Dark mode note:**
The existing `[data-theme="dark"]` block in tokens.css already overrides ~120 semantic tokens including all `--color-bg-*`, `--color-text-*`, `--color-border-*`, and `--color-fg-*`. No new dark overrides were needed for the mode toggle itself.

---

## Section 3 — Broken Status-Tag Token References Fixed

**Root cause:**
5 status tag rules were referencing `--color-brand-*`, `--color-warning-*`, `--color-error-*` tokens that do not exist in `tokens.css`. They had hardcoded fallbacks so they rendered correctly in light mode, but would not theme in dark mode.

An additional 3 role card decision indicators were using `--color-success-500`, `--color-warning-400`, `--color-error-400` — also non-existent.

**Fix:**
Replaced all broken references with utility palette tokens, which already have dark mode overrides defined in tokens.css:

| Old (broken) | New (correct) | Dark mode value |
|---|---|---|
| `--color-brand-50` | `--utility-brand-50` | `#2c1c5f` |
| `--color-brand-200` | `--utility-brand-200` | `#53389e` |
| `--color-brand-700` | `--utility-brand-700` | `#d6bbfb` |
| `--color-warning-50` | `--utility-warning-50` | `#4e1d09` |
| `--color-warning-200` | `--utility-warning-200` | `#93370d` |
| `--color-warning-700` | `--utility-warning-700` | `#fec84b` |
| `--color-error-50` | `--utility-error-50` | `#55160c` |
| `--color-error-200` | `--utility-error-200` | `#912018` |
| `--color-error-700` | `--utility-error-700` | `#fda29b` |
| `--color-success-500` | `--success-500` | `#17b26a` (primitive, unchanged) |
| `--color-warning-400` | `--utility-warning-400` | `#dc6803` |
| `--color-error-400` | `--utility-error-400` | `#d92d20` |

Because the utility tokens are already overridden in the `[data-theme="dark"]` block, no additional dark mode CSS rules were needed. Status tags and decision indicators now theme automatically.

---

## Section 4 — Missing Spacing Tokens Added

**File:** `design-system/tokens.css`

Added the full spacing scale to the SPACING section (which previously only defined `--spacing-md`):

```css
--spacing-xxs:  2px;
--spacing-sm:   6px;
--spacing-md:   8px;   /* already existed */
--spacing-lg:  12px;
--spacing-xl:  16px;
--spacing-2xl: 24px;
```

Values derived from comments already present in the file (e.g. `--rgi-gap-text: 2px; /* spacing-xxs */`, `--rgi-padding: 16px; /* spacing-xl */`). All values consistent with a 4px base unit grid.

---

## Section 5 — Focus Ring Hardcodes Replaced

**Token added to tokens.css:**
```css
/* In :root */
--focus-ring-shadow: 0 0 0 4px rgba(127,86,217,0.14), 0 1px 2px rgba(10,13,18,0.05);

/* In [data-theme="dark"] */
--focus-ring-shadow: 0 0 0 4px rgba(158,119,237,0.28), 0 1px 2px rgba(0,0,0,0.30);
```

Dark override uses `#9e77ed` (brand-500) at higher opacity (0.28) for better visibility against dark surfaces, plus a darker drop shadow.

**Replacements in styles.css:** 3 occurrences of the hardcoded value replaced with `var(--focus-ring-shadow)`:
- Line 3267 — `.intake-textarea:focus`
- Line 5275 — `.field-input:focus, .field-select:focus, .field-textarea:focus`
- Line 5941 — inbox search wrapper (focus state)

Zero hardcoded occurrences remain.

---

## Section 6 — Hardcoded White/Off-White Surfaces Replaced

**`.rail-step-dot.upcoming`** (`background: #ffffff`) — the only genuinely unguarded `#ffffff` background. Replaced with `var(--color-bg-primary, #ffffff)`.

**`var(--gray-50)` usages** (9 occurrences, all `background:` properties) — replaced with `var(--color-bg-secondary, #fafafa)`. Dark mode value: `#13161b`.

**`var(--gray-25)` usages** (1 occurrence) — replaced with `var(--color-bg-secondary-subtle, #fdfdfd)`. Dark mode value: `#13161b`.

**`var(--gray-25, #fafafa)` usages** (3 occurrences) — replaced with `var(--color-bg-secondary, #fafafa)`.

All primitive gray surface tokens eliminated from `styles.css`. Remaining `#fff3cd` (amber comparison pill) is a semantic colour, not a surface, and was left in place.

---

## Section 7 — Validation Pass

**Checks run:**

| Check | Result |
|---|---|
| `--color-brand-*` references in styles.css | 0 remaining |
| `--color-warning-*` references in styles.css | 0 remaining |
| `--color-error-*` references in styles.css | 0 remaining |
| `--color-success-*` references in styles.css | 0 remaining |
| Hardcoded `rgba(127,86,217,…)` focus rings | 0 remaining |
| `.accent-swatch*` CSS rules | 0 remaining |
| `var(--gray-50)` raw primitives as backgrounds | 0 remaining |
| `var(--gray-25)` raw primitives as backgrounds | 0 remaining |
| `setAccentTheme(…)` call in profile render | Removed |
| Spacing tokens (xxs/sm/lg/xl/2xl) | All 5 added |
| `--focus-ring-shadow` token | Defined in both light and dark |
| Appearance mode selector | Renders with 3 buttons, state synced |

**Dark mode usability assessment:**

With the accent colour removed from the `#profile-appearance-section .doc-section-heading` rule, the heading now inherits the standard `--text` token rather than `var(--accent)`. This is appropriate and consistent with all other section headings.

Status tags (Applied / In Progress / Rejected) will now correctly invert to dark tones in dark mode via the utility palette overrides. Previously they held light purple/amber/red tints even in dark mode.

Focus rings will appear at slightly higher contrast in dark mode (28% vs 14% opacity) using the lighter brand-500 value.

Surface backgrounds that were previously stuck at `#fafafa` will now darken to `#13161b` in dark mode — making panel fills, alternate row backgrounds, and modal hover states correctly dark-themed.

---

## Remaining Token Debt (Not in Scope)

The following items were identified in the audit but are explicitly out of scope for this pass:

- **Full `--gray-*` → `--color-bg-*` migration** — only surface backgrounds were tackled; other uses of `--gray-*` for borders, text, etc. remain
- **Removing `ACCENT_THEMES` / `setAccentTheme`** — kept alive to avoid breaking the CSS variable pipeline; can be removed in a future pass after confirming the accent token chain is stable without them
- **`color: var(--gray-700)` on modal close hover** — `--gray-700` is a primitive; would need a semantic text token; acceptable for now given fallback is correct
- **Full audit of inline `style=""` hardcodes** in app.js template strings — some inline margin/padding/border styles use px values directly; not a token concern but worth a future JS template pass
