# RoleWise Design System Audit
**Date:** 11 March 2026
**Scope:** Read-only inspection of `design-system/tokens.css` and `styles.css`
**Source files:** `tokens.css` (1,268 lines), `styles.css` (11,276 lines), `app.js` (22,032 lines)

---

## Section 1 — Token System Overview

The token system lives entirely in `design-system/tokens.css` and is imported at the top of `styles.css`. There are approximately **553 custom properties** defined across the following categories.

### 1.1 Color Primitives

Raw palette values with no semantic meaning. These are the foundation referenced by semantic tokens above them.

| Group | Tokens | Example values |
|---|---|---|
| `--gray-modern-*` | 25 | `--gray-modern-25: #FCFCFD`, `--gray-modern-500: #667085`, `--gray-modern-900: #101828` |
| `--gray-*` | 13 | `--gray-50: #F9FAFB`, `--gray-500: #6B7280`, `--gray-900: #111827` |
| `--brand-*` | 11 | `--brand-50: #F9F5FF`, `--brand-500: #7F56D9`, `--brand-700: #6941C6` |
| `--success-*` | 7 | `--success-50: #ECFDF3`, `--success-500: #12B76A`, `--success-700: #027A48` |
| `--error-*` | 7 | `--error-50: #FEF3F2`, `--error-500: #F04438`, `--error-700: #B42318` |
| `--warning-*` | 7 | `--warning-50: #FFFAEB`, `--warning-500: #F79009`, `--warning-700: #B54708` |
| `--blue-*` | 11 | `--blue-50: #EFF8FF`, `--blue-500: #2E90FA`, `--blue-700: #175CD3` |
| `--indigo-*` | 11 | `--indigo-50: #EEF4FF`, `--indigo-500: #6172F3`, `--indigo-700: #3538CD` |

Other utility palettes (teal, forest, plum, orange, pink, rose, cyan, violet) are defined at the bottom of tokens.css as reference values for the design system page; they follow the same `--[name]-50` through `--[name]-900` pattern.

### 1.2 Legacy Semantic Tokens

The original semantic layer, defined early in tokens.css. These are the tokens that `styles.css` relies on most heavily.

| Token | Default value | Purpose |
|---|---|---|
| `--bg` | `#FAFAFA` | App background |
| `--surface` | `#FFFFFF` | Card/panel surfaces |
| `--bg-card` | `#FFFFFF` | Alternative card background |
| `--border` | `#E5E7EB` | Default border color |
| `--border-light` | `#F3F4F6` | Subtle dividers |
| `--text` | `#111827` | Primary text |
| `--text-muted` | `#6B7280` | Secondary text |
| `--text-light` | `#9CA3AF` | Tertiary / placeholder text |
| `--accent` | `#7F56D9` | Brand accent (overridable via JS) |
| `--accent-soft` | `#F9F5FF` | Soft accent background |
| `--accent-soft-2` | `#EDE9FE` | Medium-soft accent background |
| `--focus-ring` | `rgba(127,86,217,0.14)` | Focus ring shadow |

### 1.3 New Semantic Layer (Untitled UI)

A second semantic layer added later, using the `--color-*` namespace. Designed to match Untitled UI PRO v7.0.

**Text tokens:**

| Token | Light value |
|---|---|
| `--color-text-primary` | `var(--gray-modern-900)` |
| `--color-text-secondary` | `var(--gray-modern-700)` |
| `--color-text-tertiary` | `var(--gray-modern-600)` |
| `--color-text-quaternary` | `var(--gray-modern-500)` |
| `--color-text-placeholder` | `var(--gray-modern-400)` |
| `--color-text-on-brand` | `#FFFFFF` |
| `--color-text-brand-primary` | `var(--brand-700)` |
| `--color-text-brand-secondary` | `var(--brand-600)` |
| `--color-text-error-primary` | `var(--error-700)` |
| `--color-text-warning-primary` | `var(--warning-700)` |
| `--color-text-success-primary` | `var(--success-700)` |
| `--color-text-disabled` | `var(--gray-modern-400)` |

**Background tokens:**

| Token | Light value |
|---|---|
| `--color-bg-primary` | `#FFFFFF` |
| `--color-bg-primary-alt` | `var(--gray-modern-25)` |
| `--color-bg-secondary` | `var(--gray-modern-50)` |
| `--color-bg-tertiary` | `var(--gray-modern-100)` |
| `--color-bg-quaternary` | `var(--gray-modern-200)` |
| `--color-bg-brand-primary` | `var(--brand-50)` |
| `--color-bg-brand-solid` | `var(--brand-600)` |
| `--color-bg-error-primary` | `var(--error-50)` |
| `--color-bg-error-solid` | `var(--error-600)` |
| `--color-bg-warning-primary` | `var(--warning-50)` |
| `--color-bg-warning-solid` | `var(--warning-500)` |
| `--color-bg-success-primary` | `var(--success-50)` |
| `--color-bg-success-solid` | `var(--success-600)` |

**Border tokens:**

| Token | Light value |
|---|---|
| `--color-border-primary` | `var(--gray-modern-300)` |
| `--color-border-secondary` | `var(--gray-modern-200)` |
| `--color-border-brand` | `var(--brand-600)` |
| `--color-border-error` | `var(--error-300)` |
| `--color-border-disabled` | `var(--gray-modern-300)` |

**Foreground tokens (icons, decorative):**

| Token | Light value |
|---|---|
| `--color-fg-primary` | `var(--gray-modern-900)` |
| `--color-fg-secondary` | `var(--gray-modern-700)` |
| `--color-fg-tertiary` | `var(--gray-modern-600)` |
| `--color-fg-quaternary` | `var(--gray-modern-500)` |
| `--color-fg-brand-primary` | `var(--brand-600)` |
| `--color-fg-brand-secondary` | `var(--brand-500)` |
| `--color-fg-error-primary` | `var(--error-600)` |
| `--color-fg-warning-primary` | `var(--warning-600)` |
| `--color-fg-success-primary` | `var(--success-600)` |
| `--color-fg-disabled` | `var(--gray-modern-400)` |
| `--color-fg-white` | `#FFFFFF` |
| `--color-fg-on-brand` | `#FFFFFF` |

### 1.4 Typography Tokens

| Category | Token | Value |
|---|---|---|
| Font families | `--font` | `'Inter', system-ui, sans-serif` |
| | `--font-head` | `'Inter', system-ui, sans-serif` |
| | `--font-mono` | `'JetBrains Mono', monospace` |
| Font sizes | `--text-xs` | `10.5px` |
| | `--text-sm` | `12px` |
| | `--text-base` | `13.5px` |
| | `--text-md` | `14px` |
| | `--text-lg` | `15px` |
| | `--text-xl` | `17px` |
| | `--text-2xl` | `20px` |
| | `--text-3xl` | `26px` |
| Line heights | `--leading-tight` | `1.2` |
| | `--leading-snug` | `1.35` |
| | `--leading-normal` | `1.5` |
| | `--leading-relaxed` | `1.65` |
| Letter spacing | `--label-tracking-sm` | `0.02em` |
| | `--label-tracking-md` | `0.04em` |

### 1.5 Spacing Tokens

This category is **substantially underdeveloped**. Only one spacing token is formally defined:

| Token | Value |
|---|---|
| `--spacing-md` | `8px` |

Despite this, `styles.css` references `--spacing-sm`, `--spacing-lg`, and `--spacing-xl` widely throughout, relying on fallback chains to resolve to hardcoded values. These three tokens are missing from tokens.css.

Component-level padding presets are defined as a partial workaround:

| Token | Value |
|---|---|
| `--pad-tag` | `2px 8px` |
| `--pad-input` | `8px 12px` |
| `--pad-cell` | `6px 12px` |
| `--pad-card` | `16px` |
| `--pad-card-lg` | `24px` |

### 1.6 Border Radius Tokens

| Token | Value | Notes |
|---|---|---|
| `--radius` | `6px` | Legacy token |
| `--radius-sm` | `6px` | |
| `--radius-md` | `8px` | |
| `--radius-lg` | `10px` | |
| `--radius-xl` | `12px` | |
| `--radius-2xl` | `16px` | |
| `--radius-full` | `9999px` | |
| `--radius-pill` | `9999px` | Legacy alias for `--radius-full` |

`--radius` and `--radius-sm` resolve to the same value. `--radius-pill` and `--radius-full` also duplicate.

### 1.7 Shadow Tokens

| Token | Value |
|---|---|
| `--shadow-xs` | `0 1px 2px rgba(16,24,40,0.05)` |
| `--shadow-sm` | `0 1px 3px rgba(16,24,40,0.1), 0 1px 2px rgba(16,24,40,0.06)` |
| `--shadow-md` | `0 4px 8px -2px rgba(16,24,40,0.1), 0 2px 4px -2px rgba(16,24,40,0.06)` |

A full `--color-effects-shadows-*` token set is also defined (xs, sm, md, lg, xl, 2xl, 3xl), with matching dark variants that resolve to `transparent`.

### 1.8 Component Tokens

**Buttons:**

| Token | Value |
|---|---|
| `--btn-bg-primary` | `var(--accent)` |
| `--btn-bg-secondary` | `var(--surface)` |
| `--btn-bg-disabled` | `var(--gray-modern-100)` |
| `--btn-text-primary` | `#FFFFFF` |
| `--btn-text-secondary` | `var(--text)` |
| `--btn-text-disabled` | `var(--gray-modern-400)` |
| `--btn-pad-sm` | `6px 12px` |
| `--btn-pad-md` | `8px 14px` |
| `--btn-pad-lg` | `10px 18px` |
| `--btn-pad-xl` | `12px 20px` |
| `--btn-shadow` | `var(--shadow-xs)` |
| `--btn-radius` | `var(--radius-md)` |
| `--btn-destructive-bg` | `var(--error-600)` |
| `--btn-destructive-bg-hover` | `var(--error-700)` |
| `--btn-close-bg-hover` | `var(--gray-modern-100)` |
| `--btn-close-color` | `var(--gray-modern-500)` |
| `--btn-close-color-hover` | `var(--gray-modern-700)` |

**Badges and Tags:**

| Token | Value |
|---|---|
| `--badge-radius` | `var(--radius-full)` |
| `--badge-pad` | `2px 8px` |
| `--badge-text` | `var(--text-sm)` |
| `--badge-font-weight` | `500` |
| `--tag-radius` | `var(--radius-sm)` |
| `--tag-pad` | `var(--pad-tag)` |
| `--tag-text` | `var(--text-xs)` |
| `--tag-font-weight` | `500` |
| `--tag-letter-spacing` | `var(--label-tracking-sm)` |

**Form inputs:**

| Token | Value |
|---|---|
| `--input-bg` | `var(--color-bg-primary)` |
| `--input-border` | `var(--color-border-primary)` |
| `--input-text` | `var(--color-text-primary)` |
| `--input-radius` | `var(--radius-md)` |
| `--input-pad` | `var(--pad-input)` |
| `--input-shadow` | `var(--shadow-xs)` |
| `--textarea-min-height` | `80px` |

**Toggles, checkboxes, radios, avatars:** Fully tokened with size, color, border, and state variants.

### 1.9 Alpha Tokens

Two complete alpha ramps:

- `--alpha-black-10` through `--alpha-black-100`: `rgba(0,0,0,0.10)` to `rgba(0,0,0,1.00)`
- `--alpha-white-10` through `--alpha-white-100`: `rgba(255,255,255,0.10)` to `rgba(255,255,255,1.00)`

In dark mode these are inverted: `--alpha-black-*` → white-based rgba, `--alpha-white-*` → black-based rgba.

### 1.10 Missing Token Categories

The following categories are **not defined** in tokens.css:

- **Z-index** — all z-index values are hardcoded in styles.css (10, 20, 100, 1000)
- **Animation / transition** — no duration, easing, or delay tokens; all transitions hardcoded
- **Layout / grid** — no column widths, breakpoints, or grid gap tokens
- **Spacing scale** — `--spacing-sm`, `--spacing-lg`, `--spacing-xl` referenced in styles.css but not defined in tokens.css

---

## Section 2 — Theme Architecture

### 2.1 How theming currently works

Theming is a combination of CSS custom property overrides and a JavaScript accent system. There are two independent theme axes:

**Axis 1: Light / Dark** — CSS-driven. A `[data-theme="dark"]` attribute on the `<html>` element triggers ~120 override declarations in the dark mode block of tokens.css (starting at line 946). All semantic and component tokens are re-declared with dark-appropriate values. The primitives are not re-declared.

**Axis 2: Accent colour** — JavaScript-driven. Five presets are available. Selecting a preset overwrites exactly three properties on `document.documentElement`:

```
--accent        → brand primary action color
--accent-soft   → very light tint of accent
--accent-soft-2 → medium tint of accent
```

The selection is persisted to `localStorage` under the key `rw-accent-theme` and restored on every page load.

### 2.2 Accent theme presets

| Key | `--accent` | `--accent-soft` | `--accent-soft-2` |
|---|---|---|---|
| `blue` | `#3B7DD8` | `#EAF2FF` | `#D7E7FF` |
| `indigo` | `#5B6CF0` | `#EEF0FF` | `#DDE2FF` |
| `teal` | `#0F8B8D` | `#E7F7F7` | `#D2EFEF` |
| `forest` | `#2F7A4A` | `#EAF5ED` | `#D8ECDC` |
| `plum` | `#7C4D8B` | `#F4ECF7` | `#E7D8ED` |

The default (no stored preference) is the base tokens.css value: `--accent: #7F56D9` (Untitled UI brand purple).

### 2.3 Dark mode token overrides

The `[data-theme="dark"]` block overrides tokens across all categories. Key mappings:

| Category | Light | Dark |
|---|---|---|
| App background | `#FAFAFA` | `#0C0C0E` |
| Surface / card | `#FFFFFF` | `#18181B` |
| Border | `#E5E7EB` | `#27272A` |
| Border light | `#F3F4F6` | `#1F1F22` |
| Primary text | `#111827` | `#F4F4F5` |
| Muted text | `#6B7280` | `#A1A1AA` |
| Light text | `#9CA3AF` | `#71717A` |
| `--color-bg-primary` | `#FFFFFF` | `#0C0C0E` |
| `--color-bg-secondary` | gray-modern-50 | dark gray |
| `--color-text-primary` | gray-modern-900 | near white |
| `--color-border-primary` | gray-modern-300 | dark border |
| Alpha tokens | black-based | white-based (inverted) |
| Shadow tokens | visible | `transparent` |

### 2.4 Theme toggle implementation gap

The dark mode token architecture is complete and functional in CSS. However, **there is no dark mode toggle in the application UI**. No button, menu item, or keyboard shortcut exists in `app.js` or `index.html` to set `data-theme="dark"` on the html element. The feature is implemented at the CSS level but inaccessible to the user.

### 2.5 Token cascade summary

```
Primitive (--gray-modern-500)
    ↓
New semantic (--color-text-tertiary → var(--gray-modern-600))
    ↓  [or via legacy path]
Legacy semantic (--text-muted → #6B7280)
    ↓
Component (nav-item color → var(--color-text-tertiary, var(--text-muted)))
    ↓
Dark mode override ([data-theme="dark"] --color-text-tertiary → lighter value)
    ↓
Accent override (JS setProperty for --accent/--accent-soft/--accent-soft-2)
```

---

## Section 3 — Component Token Usage

This section documents how major UI components consume the token system.

### 3.1 Navigation items (`.nav-item`)

| Property | Token used |
|---|---|
| Border radius | `var(--radius-sm)` |
| Color | `var(--color-text-tertiary, var(--text-muted))` |
| Font size | `var(--text-sm)` |
| Hover background | `var(--color-bg-secondary, var(--border-light))` |
| Active background | `var(--accent-soft)` |
| Active color | `var(--accent)` |

Uses fallback chaining: new token with legacy fallback. Well-structured.

### 3.2 Modals (`.modal-card`)

| Property | Token used |
|---|---|
| Background | `var(--color-bg-primary-alt, var(--surface))` |
| Border | `1px solid var(--color-border-secondary, var(--border))` |
| Border radius | `var(--radius-xl)` |
| Box shadow | `var(--shadow-md)` |

### 3.3 Form inputs (`.field-input`, `.field-select`, `.field-textarea`)

| Property | Token used |
|---|---|
| Background | `var(--color-bg-primary, var(--surface))` |
| Border | `1px solid var(--color-border-primary, var(--border))` |
| Border radius | `var(--radius-md)` |
| Font | `var(--font)` |
| Color | `var(--color-text-primary, var(--text))` |
| Focus border | `var(--color-border-brand, var(--accent))` |
| Focus ring | `0 0 0 4px rgba(127,86,217,0.14)` ← **hardcoded** |

The focus ring value is hardcoded and will not respond to accent theme changes. Switching to `teal` or `forest` accent will produce a purple focus ring on form elements.

### 3.4 Inbox role cards (`.inbox-role`)

| Property | Token used |
|---|---|
| Border | `var(--border)` (legacy) |
| Background | `var(--bg)` (legacy) |
| Hover border | `var(--color-border-secondary)` |
| Hover background | `var(--color-bg-primary)` |
| Active icon color | `var(--color-fg-brand-primary, var(--accent))` |

Mixes legacy tokens for base state with new tokens for hover state. Inconsistent.

### 3.5 Status tags (`.status-tag`)

The status tag component references tokens that **do not exist** in tokens.css:

| Used in styles.css | Defined in tokens.css? |
|---|---|
| `var(--color-brand-50)` | ❌ — should be `var(--brand-50)` |
| `var(--color-brand-700)` | ❌ — should be `var(--brand-700)` |
| `var(--color-brand-200)` | ❌ — should be `var(--brand-200)` |
| `var(--color-warning-50)` | ❌ — should be `var(--warning-50)` |
| `var(--color-warning-700)` | ❌ — should be `var(--warning-700)` |
| `var(--color-warning-200)` | ❌ — should be `var(--warning-200)` |
| `var(--color-error-50)` | ❌ — should be `var(--error-50)` |
| `var(--color-error-700)` | ❌ — should be `var(--error-700)` |
| `var(--color-error-200)` | ❌ — should be `var(--error-200)` |
| `var(--color-success-50)` | ❌ — should be `var(--success-50)` |
| `var(--color-success-700)` | ❌ — should be `var(--success-700)` |
| `var(--color-success-200)` | ❌ — should be `var(--success-200)` |

Because these tokens are undefined, the browser silently falls back to the hardcoded hex values that follow in the same declaration. The component renders correctly today but is disconnected from the token system and will not respond to dark mode or theme changes.

### 3.6 Primary action button (`.btn-add-jd`)

| Property | Token used |
|---|---|
| Background | `var(--color-bg-primary-solid, var(--text))` |
| Border radius | `var(--radius-md)` |
| Padding | `var(--spacing-md) var(--spacing-xl)` |
| Font size | `var(--text-sm)` |

Uses `--spacing-xl` which is not defined in tokens.css. Relies on fallback to resolve.

### 3.7 Token adoption summary by component area

| Component area | Primarily uses | Notes |
|---|---|---|
| Navigation | New + legacy (fallback chains) | Good pattern |
| Modals | New + legacy (fallback chains) | Good pattern |
| Form inputs | New + legacy (fallback chains) | Focus ring hardcoded |
| Inbox cards | Legacy + new (inconsistent) | Mixed layer usage |
| Status tags | Undefined `--color-*-*` tokens | Silent token failures |
| Buttons | Component tokens → legacy | Well-structured |
| Badges / tags | Component tokens | Self-contained |
| Chat panel | Largely legacy tokens | Direct `--text`, `--border` etc. |

---

## Section 4 — Current Appearance Controls

### 4.1 What users can control today

The application currently exposes exactly one appearance control: the accent colour theme selector.

**Accent theme selector:**
- Location: settings panel within the app
- Options: blue, indigo, teal, forest, plum (+ default purple)
- Effect: overwrites `--accent`, `--accent-soft`, `--accent-soft-2` on `:root`
- Persistence: `localStorage('rw-accent-theme')`, restored on page load
- Scope: affects all elements that consume `--accent` or its soft variants

### 4.2 What users cannot control today

| Feature | Status |
|---|---|
| Dark mode | Token architecture complete; no UI toggle exists |
| Font size / density | No tokens or controls defined |
| Font family | No controls defined; Inter is hardcoded |
| Border radius scale | `--radius-*` defined but no controls |
| Layout density | No controls defined |

### 4.3 What the accent theme does and does not affect

The 3-token accent override propagates through the token cascade to affect:

- Primary buttons (`--btn-bg-primary → var(--accent)`)
- Active nav items (background and color)
- Active role card indicators
- Focus borders on form fields (`--color-border-brand → var(--accent)`)
- Tag/badge brand variants
- Toggle checked state
- Checkbox checked state

It does **not** affect:

- Form focus rings (hardcoded `rgba(127,86,217,0.14)` — always purple)
- Status tag colours (broken token references, hardcoded fallbacks)
- Heading colours
- Link colours
- Any element using `--color-bg-brand-*` tokens directly (these reference `--brand-*` primitives, not `--accent`)

---

## Section 5 — Token Governance

### 5.1 Naming conventions in use

Three distinct naming patterns coexist, reflecting the evolution of the system:

**Pattern A — Legacy single-word tokens**
`--bg`, `--surface`, `--text`, `--border`, `--accent`
Simple, short, no namespace. Used in ~80% of styles.css.

**Pattern B — New namespaced tokens (Untitled UI)**
`--color-{category}-{role}[-{variant}]`
Examples: `--color-text-primary`, `--color-bg-brand-solid`, `--color-border-secondary`
Hierarchical and predictable. Used in ~20% of styles.css.

**Pattern C — Component tokens**
`--{component}-{property}[-{variant}]`
Examples: `--btn-bg-primary`, `--input-radius`, `--badge-pad`
Self-contained per component. Used correctly in component-level CSS.

**Pattern D — Incorrect hybrids (bugs)**
`--color-brand-50`, `--color-warning-200`, `--color-error-700`
These do not follow either convention — they combine the `--color-` namespace with the raw primitive suffix. They exist only in styles.css, not in tokens.css, and resolve to nothing.

### 5.2 Fallback chain patterns

Two fallback patterns appear throughout styles.css:

```css
/* Pattern 1: New token with legacy fallback */
color: var(--color-text-primary, var(--text));

/* Pattern 2: New token with hex fallback */
color: var(--color-text-secondary, #374151);
```

Pattern 1 is preferable as it respects the token system at both levels. Pattern 2 creates a silent bypass — if the new token is ever removed or renamed, the hardcoded hex takes over silently.

### 5.3 Undeclared token references

Tokens referenced in styles.css but absent from tokens.css:

| Token | Used for | Impact |
|---|---|---|
| `--spacing-sm` | Padding, margins throughout | Resolves via CSS fallback |
| `--spacing-lg` | Larger padding areas | Resolves via CSS fallback |
| `--spacing-xl` | Large padding areas | Resolves via CSS fallback |
| `--color-brand-50/200/700` | Status tag brand variant | Silent failure; hardcoded fallback used |
| `--color-warning-50/200/700` | Status tag warning variant | Silent failure; hardcoded fallback used |
| `--color-error-50/200/700` | Status tag error variant | Silent failure; hardcoded fallback used |
| `--color-success-50/200/700` | Status tag success variant | Silent failure; hardcoded fallback used |

### 5.4 Token duplication

| Duplicated set | Tokens | Comment |
|---|---|---|
| Radius aliases | `--radius` = `--radius-sm` = `6px` | Legacy `--radius` not needed |
| Pill aliases | `--radius-pill` = `--radius-full` = `9999px` | Legacy `--radius-pill` not needed |
| Background aliases | `--surface` ≈ `--bg-card` ≈ `--color-bg-primary` | Three tokens for white/near-white card bg |
| Text color aliases | `--text` ≈ `--color-text-primary` | Two tokens for dark primary text |
| Border aliases | `--border` ≈ `--color-border-primary` | Two tokens for default border |

---

## Section 6 — Redundancies

### 6.1 Duplicate radius tokens

```css
--radius:     6px   /* legacy */
--radius-sm:  6px   /* same value */
--radius-pill: 9999px  /* legacy */
--radius-full: 9999px  /* same value */
```

`--radius` and `--radius-pill` are legacy aliases that add maintenance overhead without adding meaning.

### 6.2 Parallel color semantics

The most significant redundancy: every major semantic role has both a legacy and a new token.

| Role | Legacy token | New token |
|---|---|---|
| App background | `--bg` | `--color-bg-primary` |
| Card surface | `--surface` / `--bg-card` | `--color-bg-primary-alt` |
| Primary text | `--text` | `--color-text-primary` |
| Muted text | `--text-muted` | `--color-text-tertiary` |
| Light text | `--text-light` | `--color-text-quaternary` |
| Default border | `--border` | `--color-border-primary` |
| Subtle border | `--border-light` | `--color-border-secondary` |
| Brand accent | `--accent` | `--color-bg-brand-solid` / `--color-fg-brand-primary` |

Both layers are live and used in production. The legacy layer carries ~1,500 usages in styles.css; the new layer carries ~80. This creates two diverging sources of truth for the same visual concepts.

### 6.3 Hardcoded values

Raw hex and rgba values still appear in styles.css despite having token equivalents:

| Value | Approximate instances | Token equivalent |
|---|---|---|
| `#fff` / `#ffffff` | 29 | `var(--color-bg-primary)` |
| `#fafafa` | 9 | `var(--bg)` |
| `#92400E` | 14 | `var(--warning-800)` |
| `#FEF3C7` | 9 | close to `var(--warning-100)` |
| `#2563EB` | 9 | `var(--blue-600)` |
| `rgba(127,86,217,0.14)` | ~6 | should be a focus-ring token |
| `10`, `20`, `100`, `1000` | many | should be z-index tokens |

### 6.4 Spacing token gap

Only `--spacing-md: 8px` is defined. A full scale would be:

```
--spacing-xs:  4px
--spacing-sm:  6px     ← referenced but missing
--spacing-md:  8px     ← defined
--spacing-lg:  12px    ← referenced but missing
--spacing-xl:  16px    ← referenced but missing
--spacing-2xl: 24px
```

Without the full scale in tokens.css, the padding/margin values in styles.css cannot be traced back to a single source of truth.

---

## Section 7 — Light/Dark Mode Readiness

### 7.1 Token layer readiness

The token system is structurally ready for dark mode. The `[data-theme="dark"]` block in tokens.css provides complete overrides for all semantic tokens in both the legacy and new layers.

| Layer | Dark mode coverage |
|---|---|
| Legacy semantic (`--bg`, `--text`, etc.) | ✅ Fully overridden |
| New semantic (`--color-text-*`, `--color-bg-*`, etc.) | ✅ Fully overridden |
| Component tokens (`--btn-*`, `--input-*`, etc.) | ✅ Fully overridden |
| Alpha tokens | ✅ Inverted (black↔white) |
| Shadow tokens | ✅ Set to transparent in dark mode |
| Primitives (`--gray-modern-*`, `--brand-*`) | — Not overridden (by design) |

### 7.2 Areas that will break in dark mode

Despite the token layer being complete, a number of styles bypass it:

| Issue | Location | Effect in dark mode |
|---|---|---|
| Hardcoded `#fff` / `#fafafa` | 38 instances in styles.css | White surfaces will not darken |
| Focus ring `rgba(127,86,217,0.14)` | Form inputs | Remains light; may be invisible |
| Status tag hardcoded hex | `.status-tag` variants | Colours unchanged in dark mode |
| `--color-brand-*` / `--color-warning-*` etc. | Status tags | Undefined tokens, uses hardcoded fallback |
| Z-index hardcodes | Various | No functional dark mode impact (non-colour) |

**Estimated proportion of styles.css that will respond correctly to dark mode:** roughly 85–90%. The majority of the app will theme correctly. The broken areas are concentrated in status indicators and a small number of surface overrides.

### 7.3 What is needed to ship dark mode

1. **Add a UI toggle** — set/remove `data-theme="dark"` on `<html>`. One event listener, ~5 lines of JS. Persist preference to `localStorage`.

2. **Fix status tag tokens** — replace `var(--color-brand-50)` with `var(--brand-50)` (and equivalent for warning, error, success). Or add the missing `--color-brand-*` aliases to tokens.css.

3. **Replace hardcoded white/off-white hex** — 38 instances of `#fff`/`#fafafa` need to be replaced with `var(--color-bg-primary)` or `var(--surface)`.

4. **Replace focus ring hardcode** — add a `--focus-ring-shadow` token to tokens.css with a dark mode override, then reference it in form input styles.

5. **Optional — audit component tokens in dark mode** — visually test each component against the dark mode block to catch any rendering issues not covered by the token audit.

### 7.4 Accent theme in dark mode

The accent theme system only overrides `--accent`, `--accent-soft`, and `--accent-soft-2`. In dark mode, the soft tints (`--accent-soft`, `--accent-soft-2`) are light backgrounds and will remain light unless the accent theme is extended with dark variants per preset. This will make active states and soft-accent backgrounds feel bright and unnatural in dark mode.

---

## Section 8 — Design System Summary

### 8.1 Current state assessment

The RoleWise design system is in a **mid-migration state**. A well-structured new token architecture (Untitled UI PRO v7.0 conventions) has been built and is present in tokens.css, but the application's stylesheet has only partially adopted it. The legacy layer from the original implementation continues to carry the majority of production usage.

The system is functional and internally consistent enough to render correctly. The primary risks are technical debt and maintainability rather than visual correctness today.

### 8.2 Strengths

- **Solid token foundation** — 553 tokens cover all major visual dimensions including text, background, border, foreground, shadows, and component-level properties.
- **Dark mode is architecturally complete** — the `[data-theme="dark"]` override block is thorough and well-constructed. Dark mode is one UI toggle away.
- **Component tokens are coherent** — buttons, badges, tags, and form inputs each have self-contained token sets that correctly cascade from primitives.
- **Fallback chains are safe** — new tokens fall back to legacy tokens rather than hard-failing. This means the migration from legacy to new tokens can proceed incrementally without breakage.
- **Accent theming works correctly** — the JS-driven accent system is clean, persisted, and affects all components that use `--accent`.

### 8.3 Risks and technical debt

| Issue | Severity | Affected scope |
|---|---|---|
| Two parallel semantic layers in production | High | All of styles.css |
| `--color-brand/warning/error/success-*` tokens missing | High | `.status-tag` component |
| `--spacing-sm/lg/xl` missing from tokens.css | Medium | Padding/margin throughout |
| 38+ hardcoded hex values | Medium | Mostly surface/background overrides |
| Z-index values not tokenised | Low | Layering management |
| Form focus ring hardcoded | Medium | Accent theme inconsistency |
| Dark mode toggle not implemented | — | Not a debt item; planned feature |
| Accent soft tints unspecified for dark mode | Medium | Dark mode + accent combination |
| `--radius` / `--radius-pill` legacy aliases | Low | Naming overhead |

### 8.4 Migration path (observation only)

When the team is ready to address the two-layer problem, the natural sequence would be:

1. Add missing spacing tokens (`--spacing-sm/lg/xl`) to tokens.css to close the reference gap.
2. Fix status tag token names — either correct the references in styles.css or add aliases in tokens.css.
3. Migrate hardcoded hex values to semantic tokens, prioritising surfaces and backgrounds.
4. Implement dark mode toggle and validate visually.
5. Progressively replace legacy `--text`/`--bg`/`--border` usages with `--color-text-*`/`--color-bg-*`/`--color-border-*` equivalents, using fallback chains during transition.
6. Once all usages are migrated, retire the legacy layer.
7. Add z-index tokens and transition/animation tokens to complete the system.

### 8.5 Token counts by category

| Category | Token count |
|---|---|
| Color primitives (all palettes) | ~180 |
| Legacy semantic tokens | ~15 |
| New semantic tokens (`--color-*`) | ~75 |
| Typography | ~20 |
| Spacing (defined) | 1 |
| Border radius | 8 |
| Shadow | ~20 |
| Component tokens (buttons, inputs, badges, etc.) | ~60 |
| Alpha tokens | ~20 |
| Utility / reference palettes | ~150 |
| **Total** | **~553** |

---

*End of report. No files were modified during this audit.*
