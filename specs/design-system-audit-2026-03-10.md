# RoleWise Design System — Audit & Trim Plan
_Read-only analysis · March 2026_

No code was modified to produce this document. All findings are drawn directly from cross-referencing `design-system/tokens.css` against actual `var()` usage in `styles.css`.

---

## The Headline Numbers

| Metric | Count |
|---|---|
| Tokens defined in `tokens.css` | 669 |
| Tokens actually used in `styles.css` | 233 |
| **Tokens defined but never used** | **437 (65%)** |
| Lines in `tokens.css` | 1,232 |
| Estimated lines after trim | ~400–450 |

The file is carrying nearly two thirds dead weight. Almost all of it is from the Untitled UI PRO v7.0 base — utility color palettes, semantic color aliases, alert components, blur scales, portfolio shadows, and component meta-tokens that RoleWise never adopted.

---

## Section 1 — What RoleWise Actually Uses (Keep Everything Below)

These 233 tokens are live. Touch nothing.

### Core surface & text
```
--bg, --surface, --bg-card
--border, --border-light
--text, --text-muted, --text-light
--accent, --accent-soft, --accent-soft-2
--color-white
--focus-ring
```

### Semantic status
```
--error, --error-bg, --error-border, --error-50, --error-600
--success, --success-bg, --success-border
```
_(no warning tokens used in CSS — still hardcoded JS inline styles)_

### Gray primitives (subset only)
```
--gray-25, --gray-50, --gray-100, --gray-200, --gray-300
--gray-500, --gray-600, --gray-700, --gray-900
```
Gray-modern and all other gray variants: not used.

### Brand colors (subset only)
```
--brand-50, --brand-500, --brand-600, --brand-700
```
Plus fallback references to `--brand-25` and `--brand-300` in two inline `var()` expressions.
Everything else in the brand ramp: not used.

### Typography
```
--font, --font-head, --font-mono
--text-xs (10.5px), --text-sm (12px), --text-base (13px),
--text-md (14px), --text-lg (15px), --text-xl (18px),
--text-2xl (22px), --text-3xl (26px)
--leading-tight, --leading-snug, --leading-normal, --leading-relaxed
--label-tracking-sm, --label-tracking-md
```

### Radius (7 of 12 defined tiers used)
```
--radius (6px), --radius-sm (6px), --radius-md (8px),
--radius-lg (10px), --radius-xl (12px), --radius-2xl (16px),
--radius-pill (9999px)
```
Not used: `--radius-none`, `--radius-xxs`, `--radius-xs`, `--radius-3xl`, `--radius-4xl`, `--radius-full`

### Shadows (3 of 7 used)
```
--shadow-xs (10×), --shadow-sm (2×), --shadow-md (1×)
```
Not used: `--shadow-lg`, `--shadow-xl`, `--shadow-2xl`, `--shadow-3xl`

### Spacing
```
--pad-card, --pad-card-lg, --pad-cell, --pad-input, --pad-tag
--spacing-md
```

### Component tokens (all live)
All `--btn-*`, `--badge-*`, `--input-*`, `--label-*`, `--hint-*`, `--check-*`, `--toggle-*`, `--tag-*`, `--rgi-*`, `--rg-gap`, `--avatar-*`, `--textarea-*`, `--step-v-pad`, `--card-bg`, `--card-border` tokens are in active use.

---

## Section 2 — What to Remove (Clusters of Dead Weight)

These can be deleted in their entirety with zero risk to `styles.css`.

### 2.1 Alpha transparency primitives — 20 tokens
```
--alpha-alpha-black-10 through --alpha-alpha-black-90
--alpha-alpha-white-10 through --alpha-alpha-white-90
```
Never referenced anywhere. Pure Untitled UI PRO carry-over.

### 2.2 Alert component — 14 tokens
```
--alert-bg-brand/error/success/warning
--alert-border, --alert-gap, --alert-pad, --alert-radius
--alert-title-color, --alert-title-weight, --alert-desc-color
--alert-icon-brand/error/success/warning
```
No alert component exists in RoleWise. Remove the entire block.

### 2.3 Blur scale — 4 tokens
```
--blur-sm, --blur-md, --blur-lg, --blur-xl
```
No blur/backdrop-filter usage in the app.

### 2.4 Unused brand color tiers — 8 tokens
```
--brand-25, --brand-100, --brand-200, --brand-300,
--brand-400, --brand-800, --brand-900, --brand-950
```
Only `--brand-50`, `--brand-500`, `--brand-600`, `--brand-700` are used.
**Caveat:** `--brand-25` and `--brand-300` appear as fallback values in two `var()` expressions (`var(--brand-25, #f9f5ff)`, `var(--brand-300, #d6bbfb)`). Keep `--brand-25` and `--brand-300` if you want those fallbacks to resolve via token rather than literal; remove them if you replace the fallback literals directly.

### 2.5 Untitled UI semantic color system — ~65 tokens
```
--color-bg-primary, --color-bg-primary-alt, --color-bg-primary-hover ...
--color-bg-secondary-*, --color-bg-tertiary, --color-bg-quaternary
--color-bg-brand-*, --color-bg-error-*, --color-bg-warning-*, --color-bg-success-*
--color-bg-disabled, --color-bg-disabled-subtle, --color-bg-overlay, --color-bg-active
--color-border-*, --color-fg-*, --color-text-*
--color-focus-rings-*
```
RoleWise uses its own semantic layer (`--bg`, `--surface`, `--text`, `--accent`, `--error`, `--success`, etc.). The Untitled UI semantic system was never adopted. Remove all `--color-bg-*`, `--color-border-*`, `--color-fg-*`, `--color-text-*` blocks.

### 2.6 Portfolio mockup shadows — 4 tokens
```
--color-portfolio-mockups-shadow-grid-md
--color-portfolio-mockups-shadow-main-centre-lg / md
--color-portfolio-mockups-shadow-overlay-lg
```
Untitled UI PRO design showcase tokens. Remove.

### 2.7 Multi-layer shadow system — 17 tokens
```
--color-shadows-shadow-2xl-01/02, --color-shadows-shadow-3xl-01/02
--color-shadows-shadow-lg-01/02/03, --color-shadows-shadow-md-01/02
--color-shadows-shadow-skeumorphic-inner, --color-shadows-shadow-skeumorphic-inner-border
--color-shadows-shadow-sm-01/02, --color-shadows-shadow-xl-01/02/03
--color-shadows-shadow-xs
```
RoleWise uses the simpler `--shadow-xs/sm/md` set. Also remove the unused tiers `--shadow-lg`, `--shadow-xl`, `--shadow-2xl`, `--shadow-3xl`.

### 2.8 Utility color palettes — ~88 tokens
```
--utility-blue-50 through --utility-blue-700 (8 tokens)
--utility-orange-50 through --utility-orange-700 (8 tokens)
--utility-purple-* (8), --utility-pink-* (8), --utility-indigo-* (8)
--utility-green-* (8), --utility-fuchsia-* (8), --utility-yellow-* (8)
--utility-gray-blue-* (8)
```
Full utility palettes from Untitled UI PRO for badge color variants. None are used in the RoleWise badge system. Remove all `--utility-*` blocks.

### 2.9 Gray Modern primitives — 12 tokens
```
--gray-modern-25 through --gray-modern-950
```
RoleWise uses the `--gray-*` scale, not `--gray-modern-*`. These were the source palette, not the working tokens.

### 2.10 Unused component meta-tokens — ~28 tokens
```
--comp-buttons-*, --comp-icons-*, --comp-toggles-*,
--comp-sliders-*, --comp-footers-*, --comp-text-*
--modal-icon-brand/error/success/warning
--loading-size-sm/md/lg/xl
--msg-bubble-bg, --msg-bubble-border
--page-btn-size/radius/color/color-active/bg-active
--tab-badge-bg-active, --tab-badge-border-active, --tab-badge-color-active
--container-padding-*, --width-xxs
```
None referenced in `styles.css`. These are Untitled UI PRO showcase meta-tokens for the design-system `index.html` demo only.

### 2.11 Miscellaneous unused — ~5 tokens
```
--card-radius, --card-shadow   (aliases with no usage)
--avatar-online-border          (only --avatar-online-bg is used)
--badge-inner-pad-lg/md         (only badge-pad-* is used)
--bg-subtle                     (--bg and --bg-card are used instead)
--color-black                   (--color-white is used; black is not)
--radius-none, --radius-xxs, --radius-xs, --radius-3xl, --radius-4xl, --radius-full
```

---

## Section 3 — Oversized Values to Review

### 3.1 Text scale — top end candidates

The scale runs from `10.5px → 12px → 13px → 14px → 15px → 18px → 22px → 26px`.

| Token | Value | Usage count | Notes |
|---|---|---|---|
| `--text-xl` | 18px | 5× | Admin section headings. Fine at this density. |
| `--text-2xl` | 22px | 2× | Page titles (Review, Recruiters). Slightly large for the app's overall density — 20px would sit better. |
| `--text-3xl` | 26px | 1× | Single stat number in Admin Rules. Used once, very intentional. OK to keep or reduce to 24px. |

The `--text-2xl` value is the one most worth reconsidering. At 22px in an app where the base is 14px and most UI is 12–13px, page titles feel like a different product's scale. 19–20px would match the density of the rest of the UI more naturally.

### 3.2 Radius scale — note on `--radius` vs `--radius-sm` collision

Both `--radius` (the legacy alias) and `--radius-sm` currently resolve to **6px**. This is confusing — "sm" conventionally implies smaller-than-default, but here they're equal. Once the `4px` / `5px` literal cleanup pass is done (see Section 4), consider whether to:

- Reassign `--radius-sm` to `4px` to create a true smaller tier, or
- Retire `--radius` and have components explicitly use `--radius-sm` or `--radius-md`.

This is a naming decision, not an urgent change.

### 3.3 Unused shadow tiers

`--shadow-lg` through `--shadow-3xl` are defined but never used. RoleWise is a flat-ish UI — these are never going to be needed. Remove them alongside the `--color-shadows-*` blocks.

---

## Section 4 — Remaining Open Items (Not in This Trim)

These are separate jobs that were already flagged in `rolewise-ui-build-discipline.md` and `token-proposal.md`. The token trim doesn't affect or resolve them.

**`4px` and `5px` literal border-radii in `styles.css`** (~12 instances each). These predate the token system update and need a dedicated visual pass to decide: fold into `--radius` (6px, +1–2px change), keep as locals, or introduce `--radius-xs` (4px) as a formal tier.

**`6px` literal border-radii in `styles.css` and `app.js`** (~8 CSS + JS inline). The JS ones require a separate JS template string cleanup pass.

**Warning colors still in JS inline styles** (`#FEF3C7`, `#FDE68A`, `#92400E`). The `--warning-*` tokens exist in the file and are correct. The adoption pass just hasn't happened yet.

**`--error-solid` and `--success-bg-subtle`** not yet formalised. `#DC2626` (solid red button fill) and `#ECFDF5` (mint green pill background) are still raw literals. Add these two tokens in a future pass.

---

## Section 5 — Recommended Execution Order

### Step 1 — Token file trim (safe, additive-removal only)
Delete the blocks listed in Section 2. No `styles.css` changes needed. Verify the file builds correctly after each cluster is removed. Priority order:
1. `--color-shadows-*` and `--color-portfolio-*` (pure noise)
2. `--utility-*` palettes (largest single block)
3. `--alpha-*` and `--blur-*`
4. `--color-bg-*`, `--color-border-*`, `--color-fg-*`, `--color-text-*`
5. `--gray-modern-*`, unused brand tiers, unused radius/shadow tiers
6. Unused component meta-tokens
7. Remaining miscellaneous

### Step 2 — Text scale review (optional, design decision)
Decide whether `--text-2xl` (22px) stays at 22px or moves to 19–20px. If changed, update the two selectors using it (`review-page-title`, `recruiters-page-title`) and verify visually.

### Step 3 — `4px`/`5px` radius literal pass (separate scoped task)
One view at a time, per the build discipline. This is the largest remaining normalisation job in `styles.css`.

### Step 4 — JS inline style cleanup
Scoped pass to replace hardcoded `border-radius: 6px` and warning color values in `app.js` template strings with token references.

### Step 5 — Formalise `--error-solid` and `--success-bg-subtle`
Add both tokens to `:root` in `tokens.css`. Then adopt them where the literals currently appear.

---

## Definition of Done for Step 1

The token file trim is complete when:
- All tokens in Section 2 are removed from `tokens.css`
- `comm -23 defined_tokens.txt used_tokens.txt` returns only intentional omissions (radius/shadow tiers and the two brand fallback tokens if kept)
- `styles.css` produces no broken `var()` references (check: no `var(--[removed-token])` remains)
- `design-system/index.html` still renders correctly (it references many of these tokens for its own demo UI — some of its styles will lose their values, which is acceptable since it's documentation-only)
- The trim is documented here and in `rolewise-design-tokens-live.md`
