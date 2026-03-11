# RoleWise Token System Proposal
_Read-only proposal based on live code inspection · March 2026_

No code was modified to produce this document. All proposed values are drawn directly from the current live CSS unless explicitly flagged otherwise.

---

## Section 1 — Proposed Token Set

### 1.1 Core Colours
These all already exist in `:root` and are stable.

```css
--bg:           #FAFAF8   /* warm off-white page background */
--surface:      #FFFFFF   /* card / panel / input background */
--border:       #E5E3DC   /* primary border, dividers */
--border-light: #EDEBE5   /* subtle internal dividers, row hover bg */
--text:         #1A1A18   /* primary text, headings */
--text-muted:   #6B6960   /* secondary labels, table headers, muted values */
--text-light:   #A8A59C   /* placeholders, empty states, timestamps */
--accent:       #3B7DD8   /* links, active states, focus borders on inputs */
```

### 1.2 Semantic Colours
These were added in the recent cleanup and are live in `:root`.

```css
--success:        #065F46
--success-bg:     #D1FAE5
--success-border: #6EE7B7

--error:          #991B1B
--error-bg:       #FFF5F5
--error-border:   #FECACA

--warning:        #92400E
--warning-bg:     #FFFBEB
--warning-border: #FCD34D

--focus-ring:     #2563EB
```

### 1.3 Typography

**Font family** (already a token):
```css
--font: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif
```

**Font sizes** — proposed formal scale based on actual values in use:
```css
--text-xs:   10.5px   /* uppercase labels, table headers, badge text */
--text-sm:   12px     /* secondary body, table cell content, admin metadata */
--text-base: 13px     /* primary body, nav items, descriptions */
--text-md:   14px     /* base body size (html/body default) */
--text-lg:   15px     /* detail panel titles, sub-headings */
--text-xl:   18px     /* admin section headings */
--text-2xl:  22px     /* page titles (Review, Recruiters) */
--text-3xl:  26px     /* Admin Rules large stat number */
```

Note: `9.5px`, `11px`, `11.5px`, `12.5px`, `13.5px` are also in active use — these are intentional intermediate steps, not noise. They should not be folded into the scale above; they work well as component-specific local values.

**Font weights** — three weights in use, no formalisation needed beyond documentation:
```
400  regular   — body copy, secondary values
500  medium    — nav active, buttons, field labels, row titles
600  semibold  — headings, table headers, uppercase labels, badge numbers
```
Weight 700 does not appear in the CSS. 400/500/600 is the complete set.

**Line heights** — proposed scale from observed values:
```css
--leading-tight:    1.3    /* compact UI elements, pills, chips */
--leading-snug:     1.4    /* table rows, inline metadata */
--leading-normal:   1.5    /* body paragraphs, admin fields */
--leading-relaxed:  1.6    /* page descriptions, long-form text (body default) */
```
`1.55`, `1.65`, `1.68`, `1.9` are edge cases for specific components (monospace output, textarea). Do not normalise these.

**Uppercase label letter-spacing** — two clear tiers used throughout:
```css
--label-tracking-sm: 0.05em   /* standard uppercase labels (table th, ar-field-label, ar-stats-label, radar headings) */
--label-tracking-md: 0.07em   /* section headings (nav-section-label, stats-section-heading, many page section labels) */
```
Values of `0.08em` and `0.09em` appear in decorative and secondary contexts (chip sub-labels, decision outcome text). Leave those as local values for now.

### 1.4 Spacing

**Base spacing scale** — derived from the most frequent padding/gap values:
```css
--space-1:   4px
--space-2:   8px
--space-3:  12px
--space-4:  16px
--space-5:  20px
--space-6:  24px
--space-7:  28px
--space-8:  32px
--space-9:  36px
--space-10: 40px
```

**Gap scale** — the most common flex/grid gaps in the codebase are:
`2px`, `4px`, `6px`, `7px`, `8px`, `10px`, `12px`, `16px`, `20px`, `28px`, `32px`

The gap vocabulary maps almost exactly to the spacing scale above. Aliases are not needed; document the values instead.

**Page section padding** — the full-view containers use three tiers:
```css
--page-pad-sm:  28px 28px          /* Radar, Stats, list-type views */
--page-pad-md:  32px 36px          /* Admin content */
--page-pad-lg:  36px 32px 72px     /* Review, Recruiters, doc-panel views */
```
Bottom padding on full-view wrappers is consistently `40px–72px` to account for the sticky bottom bar or simply give breathing room. This is intentional — do not flatten it to a single value.

**Component padding** — the consistent patterns:
```css
--pad-badge:    1px 7px     /* .sg-badge, small inline badges */
--pad-tag:      2px 8px     /* .status-tag, small tags */
--pad-btn-sm:   5px 10px    /* admin action buttons (.ar-action-btn, .ar-btn-delete etc.) */
--pad-btn:      8px 16px    /* .btn-primary */
--pad-input:    7px 10px    /* .ar-search, most admin inputs */
--pad-input-lg: 8px 10px    /* .field-input, .field-select (main form inputs) */
--pad-cell:     9px 12px    /* .ar-table td / th */
--pad-panel:   18px 20px    /* .ar-detail panel content */
--pad-card:    12px 14px    /* .radar-signal-card, many surface cards */
--pad-card-lg: 14px 16px    /* .decision-pattern-card, admin stats sections */
```

### 1.5 Radius

**Proposed formal scale:**
```css
--radius-sm:   3px    /* micro badges: .cv-default-badge, .ars-badge, small inline chips */
--radius:      5px    /* default: inputs, buttons, admin panels, all var(--radius) usages */
--radius-md:   7px    /* cards: .radar-signal-card, .stats-summary-chip, .decision-pattern-card */
--radius-lg:   8px    /* modals, larger overlay panels */
--radius-pill: 20px   /* pill tags: .radar-signal-tag, circular avatar containers */
```

Note: `4px` and `6px` appear throughout non-admin UI and currently sit between `--radius-sm` and `--radius`. These are the main surface remaining after the admin-scoped cleanup. They are intentional in their contexts (filter tabs, inbox tabs, some action buttons) and should be addressed in a separate pass. `10px` appears on badge-style `.sg-badge` (currently `border-radius: 10px`) and recruiter avatar chips — this is an intermediate pill, sits between `--radius-lg` and `--radius-pill`.

### 1.6 Component Guidance

**Buttons:**
| Type | Class | Background | Text | Padding | Radius |
|------|-------|------------|------|---------|--------|
| Primary CTA | `.btn-primary` | `var(--text)` | `#fff` | `--pad-btn` | `var(--radius)` |
| Admin action | `.ar-action-btn` | `var(--surface)` | `var(--text-muted)` | `--pad-btn-sm` | `var(--radius)` |
| Danger trigger | `.ar-btn-delete` | `var(--surface)` | `var(--error)` | `--pad-btn-sm` | `var(--radius)` |
| Danger confirm | `.ar-btn-confirm-delete` | `#DC2626` | `#fff` | `--pad-btn-sm` | `var(--radius)` |
| Ghost/cancel | `.ar-btn-cancel-delete` | none | `var(--text-muted)` | `--pad-btn-sm` | `var(--radius)` |

Disabled state: set `opacity` explicitly rather than relying on browser default. Admin buttons use `opacity: 1` with greyed colour override. Primary uses `opacity: 0.38`.

**Inputs:**
- Border: `1px solid var(--border)`
- Border on focus: `var(--accent)` (most inputs) or `#B0ADA5` (form inputs, a softer variant)
- Background: `var(--surface)`
- Placeholder: `var(--text-light)`
- Radius: `var(--radius)`
- Outline: `none` (focus handled via border colour only)

**Table headers (`.ar-table th`):**
- Font size: `--text-xs` (10.5px)
- Weight: 600
- Transform: `uppercase`
- Letter-spacing: `--label-tracking-sm` (0.05em)
- Colour: `var(--text-muted)`
- Background: `var(--bg)` (not surface — subtle elevation difference)
- Border-bottom: `1px solid var(--border)`
- Padding: `--pad-cell`

**Cards / panels:**
- Background: `var(--surface)` (elevated) or `var(--bg)` (flush/inline)
- Border: `1px solid var(--border-light)` for subtle cards, `1px solid var(--border)` for prominent panels
- Radius: `--radius-md` (7px) for free-standing cards, `var(--radius)` for inline panels
- Padding: `--pad-card` (12px 14px) or `--pad-card-lg` (14px 16px)

**Badges / pills:**
| Type | Radius | Pattern |
|------|--------|---------|
| Micro badge | `--radius-sm` (3px) | `.cv-default-badge`, `.ars-badge` |
| Standard tag | `--radius` (5px) / `4px` | `.status-tag`, `.doc-decision` |
| Rounded badge | `10px` | `.sg-badge`, `.inbox-decision-pill` |
| Pill tag | `--radius-pill` (20px) | `.radar-signal-tag` |

All badges: weight 500–600, `--text-xs` or `11px`, semantic colour pairs (bg + text).

**Empty / loading / error states:**
- Loading: `font-size: --text-sm`, `color: var(--text-light)`, no border/background
- Error inline (admin): use `.admin-error` — `var(--error)` text, `var(--error-bg)` bg, `var(--error-border)` border, `var(--radius)`, `--pad-card` padding
- Error in table cell: use `.ar-error-cell` — centred, `var(--error)` text, `var(--error-bg)` bg, no border
- Empty state text: `font-size: --text-sm`, `color: var(--text-light)`, centred, `24px 0` padding

---

## Section 2 — Why These Values

**Core colours:** Already the single most consistent part of the system. All panels, nav, and text universally use `var(--bg)`, `var(--surface)`, `var(--text)`, `var(--text-muted)`, `var(--text-light)`. No normalisation needed — these are working correctly now.

**Semantic colours:** Chosen from the modal/most-functional existing values. `--error` (`#991B1B`) was the most used text-on-light-background error red. `--success` (`#065F46`) was the most used success text colour. The background shades (`#FFF5F5`, `#D1FAE5`, `#FFFBEB`) are the lightest, most appropriate tints for use with white content. `--focus-ring` was set to `#2563EB` (standard accessible blue) for future use since `--accent` serves focus in inputs today.

**Font size scale:** The scale from `10.5px` to `26px` covers every legitimate heading, body, and label level used in the product. The non-round values (`10.5px`, `12.5px`, `13.5px`) are genuine design choices that provide optical density between steps — they are preserved and named, not flattened.

**Font weights:** Only 400/500/600 appear. The three-step system maps cleanly onto body/medium/strong without needing a token — weight is used semantically enough that documentation suffices.

**Line heights:** The `1.3`–`1.6` scale covers every reading context in the app. Higher values (`1.9` for monospace output, `1.55`/`1.65` for specific textareas) are intentional exceptions and should stay as local values.

**Letter-spacing:** Two functional tiers (`0.05em` for dense labels, `0.07em` for section headings) cover 80% of all uppercase label usage. The remaining values (`0.08em`–`0.10em`) are decorative and used in specific visual contexts like decision outcome text where the extra tracking is part of the aesthetic intent.

**Spacing scale:** The 4px grid underlies virtually every padding and gap value in the codebase. The proposed scale (`4` through `40`) names every significant step that actually appears. Values above `40px` (`48px`, `60px`, `72px`, `80px`) exist exclusively as bottom padding on full-view wrappers and are intentionally generous — they do not need tokens.

**Radius scale:** Five tiers (`3px`, `5px`, `7px`, `8px`, `20px`) cover every meaningful radius category. `3px` is for inline micro-chips. `5px` (`var(--radius)`) is the default interactive element radius. `7px` appears consistently on every card in the product. `8px` appears on modals. `20px` is the pill. The `4px` / `6px` values are a separate cleanup task — they are not proposed as a formal tier.

**Component guidance:** Derived directly from the most consistent existing implementations. The admin component system is the most normalised part of the app; the main app has more variation. Component guidance here favours the admin patterns as the target state.

---

## Section 3 — Mapping From Current Live Values

### Core colours
All already tokens. No mapping needed.

### Semantic colours
All already tokens since the recent cleanup. No mapping needed.

### Font sizes → proposed tokens
| Current value | Proposed token | Used in |
|---|---|---|
| `10.5px` | `--text-xs` | `.ar-table th`, `.ar-field-label`, `.sg-badge`, section labels |
| `12px` | `--text-sm` | `.ar-table td`, admin metadata, `.admin-loading`, `.status-tag` |
| `13px` | `--text-base` | `.nav-item`, `.page-description`, `.dab-btn`, most body text |
| `14px` | `--text-md` | `html/body` base, `.page-description` |
| `15px` | `--text-lg` | `.ar-detail-title`, `.rc-form-section-title`, sub-headings |
| `18px` | `--text-xl` | `.admin-section-title` |
| `22px` | `--text-2xl` | `.review-page-title`, `.recruiters-page-title` |
| `26px` | `--text-3xl` | `.ar-rules-count` (big number on Rules page) |

Note: `12.5px` and `13.5px` should remain as local values — they are mid-steps used in specific contexts, not general scale members.

### Radius → proposed tokens
| Current value | Proposed token | Used in |
|---|---|---|
| `3px` | `--radius-sm` | `.cv-default-badge`, `.ars-badge`, `.doc-decision` (some), `.rail-admin-btn` |
| `5px` / `var(--radius)` | `--radius` | All admin components, inputs, buttons — already using the token |
| `7px` | `--radius-md` | `.radar-signal-card`, `.stats-summary-chip`, `.decision-pattern-card`, several content cards |
| `8px` | `--radius-lg` | `.share-modal`, `.rc-notes-area`, `.pref-radio` containers, modals |
| `20px` | `--radius-pill` | `.radar-signal-tag`, several avatar-container chips |
| `10px` | _(no token proposed)_ | `.sg-badge`, `.recruiter-type-badge` — sits in a gap; leave as local for now |
| `4px` | _(no token proposed)_ | Nav items, filter tabs, inbox tabs — intentionally slightly tighter than `--radius`; address in a separate pass |
| `6px` | _(no token proposed)_ | `.hn-banner`, `.dab-btn`, analysis warning banners — pre-admin-cleanup remnants |

### Letter-spacing → proposed tokens
| Current value | Proposed token | Used in |
|---|---|---|
| `0.04em` | _(fold into `--label-tracking-sm`)_ | `.ar-table th`, `.ar-field-label` — effectively the same as 0.05em at this scale |
| `0.05em` | `--label-tracking-sm` | `.ar-tl-header`, `.ar-stats-heading`, `.ar-radar-heading`, `.ar-stats-label`, `.ar-dup-header` |
| `0.07em` | `--label-tracking-md` | `.nav-section-label`, many section labels across main app views |

### Spacing / padding → proposed tokens
| Recurring value | Proposed token | Primary uses |
|---|---|---|
| `5px 10px` | `--pad-btn-sm` | `.ar-action-btn`, `.ar-btn-delete`, confirm/cancel buttons |
| `8px 16px` | `--pad-btn` | `.btn-primary` |
| `7px 10px` | `--pad-input` | `.ar-search`, most admin inputs |
| `8px 10px` | `--pad-input-lg` | `.field-input`, `.field-select` (main app form inputs) |
| `9px 12px` | `--pad-cell` | `.ar-table td` and `th` |
| `18px 20px` | `--pad-panel` | `.ar-detail` |
| `12px 14px` | `--pad-card` | `.radar-signal-card`, various inline cards |

---

## Section 4 — Recommended Adoption Order

**Step 1 — Typography tokens** (lowest risk)
Add `--text-xs` through `--text-3xl` and `--leading-*` to `:root`. Do not replace any existing values yet — this is additive only. Once confirmed in the browser, replace the ~8 most common font-size values in admin CSS using the tokens. Start with `--text-xs` (10.5px) since it's the most uniform.

**Step 2 — Radius tokens** (low risk)
Add `--radius-sm` (3px), `--radius-md` (7px), `--radius-lg` (8px), `--radius-pill` (20px) to `:root`. Then replace the `7px` card values first (`.radar-signal-card`, `.stats-summary-chip`) — these are visually unambiguous and consistent. Replace `3px` badge values next. Leave `4px` / `6px` / `10px` for a separate audit pass.

**Step 3 — Component padding tokens** (medium risk, auditable)
Add padding tokens to `:root`. Then adopt them in admin components first (`.ar-action-btn`, `.ar-btn-delete`, `.ar-table td/th`, `.ar-detail`). Verify each section visually before moving to the main app.

**Step 4 — Typography scale replacement in main app** (medium risk)
After admin CSS is converted, apply the same font-size token replacements across the main app view CSS. This is the largest scope change. Do it one view at a time: Radar first, then Review, then Recruiters, then Inbox/Document.

**Step 5 — Letter-spacing tokens** (lowest risk, any time)
Add `--label-tracking-sm` and `--label-tracking-md` to `:root`. Replace the 10–12 admin label rules first. The values are already visually consistent — this is a naming-only cleanup.

---

## Section 5 — What Not to Normalise Yet

**`4px` border-radius** — used in `.nav-item`, `.inbox-tab`, `.filter-btn`, and several small UI controls. These are intentionally slightly tighter than `--radius` (5px) and appear to be a design choice for compact interactive controls. Folding them into `--radius` would add 1px to every tab and nav item in the app. Worth a dedicated visual pass before deciding.

**`6px` border-radius** — appears in `.hn-banner`, `.dab-btn`, `.share-modal-note`, and several analysis-output banners in JS template strings. The JS-inline ones cannot be replaced without a separate JS cleanup pass. Leave until that is scoped.

**`10px` badge radius on `.sg-badge`** — sits awkwardly between `--radius-lg` (8px) and `--radius-pill` (20px). The `.sg-badge` intentionally looks more rounded than a standard tag. Introducing a `--radius-xl` (10px) tier just for this case would bloat the scale. Leave as a local value.

**`11px`, `11.5px`, `12.5px`, `13.5px` font sizes** — these sub-step values are intentional density adjustments in specific UI contexts (compact headers, field values, form inputs). They should not be folded into the formal scale. Document them as acceptable local deviations.

**Line heights `1.55`, `1.65`, `1.68`, `1.9`** — all appear in highly specific contexts (textarea readability, monospace output, recruiter card layouts). These are correct in their context. Do not normalise.

**Warning colour usage** — `--warning-bg`, `--warning-border`, `--warning` tokens exist but are not yet used in CSS (the warning banners in the codebase are still using hardcoded JS inline styles: `#FEF3C7`, `#FDE68A`, `#92400E`). These should remain as-is until the JS inline colour cleanup pass is scoped as a separate job.

**`#DC2626` / `#B91C1C` on `.ar-btn-confirm-delete`** — the solid-red confirm button uses a slightly stronger red than `--error` (`#991B1B`). This is correct: `--error` is a text-on-light-background colour, while `#DC2626` is a fill colour for a solid button. These serve different roles and should not be merged. Consider adding `--error-solid: #DC2626` in a future pass if this pattern expands.

**`#ECFDF5` (mint)** — appears in many green-state backgrounds (`.inbox-decision-pill.pill-green`, `.doc-decision.apply`, `.btn-copy-link.copied`, `.radar-signal-tag.plus`, `.cv-default-badge`). This is a lighter green than `--success-bg` (`#D1FAE5`) and is intentionally used for pill/tag backgrounds — it's more mint, less saturated. There are now two green background tiers in the codebase: `--success-bg` (for admin banners/toasts) and `#ECFDF5` (for inbox/doc decision pills). Consider formalising this as `--success-bg-subtle: #ECFDF5` in a future pass, but do not merge them.
