# RoleWise Design Tokens — Live Reference
_Documents the current active token system · March 2026_

This file reflects the live state of the codebase. It is a reference document, not a proposal. No values here are aspirational — everything listed is already in `:root` and in active use. The companion planning document is `specs/token-proposal.md`.

---

## 1. Purpose

This document is the single source of truth for what design tokens are live in the RoleWise CSS system. It exists to:

- prevent future CSS work from re-introducing literal values that already have a token
- give new contributors a fast orientation to the type and spacing scale
- record which local values are intentionally staying local (so they are not tokenised by accident in future passes)

Read this before writing any new CSS or running a token adoption pass.

---

## 2. Live Token Set

All tokens below are defined in `:root` in `index.html` and are active. Do not invent new tokens without a deliberate system decision.

### Core colours

```css
--bg:           #FAFAF8   /* warm off-white page background */
--surface:      #FFFFFF   /* card, panel, input background */
--border:       #E5E3DC   /* primary border and dividers */
--border-light: #EDEBE5   /* subtle internal dividers, row hover backgrounds */
--text:         #1A1A18   /* primary text and headings */
--text-muted:   #6B6960   /* secondary labels, table headers, muted values */
--text-light:   #A8A59C   /* placeholders, empty states, timestamps */
--accent:       #3B7DD8   /* links, active states, focus borders */
--radius:       5px       /* global default radius — inputs, buttons, admin panels */
--font: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif
```

### Semantic colours

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

### Typography scale

```css
--text-xs:   10.5px   /* uppercase labels, table headers, badge text, section labels */
--text-sm:   12px     /* secondary body, table cells, admin metadata, timeline sub-lines */
--text-base: 13px     /* primary body, nav items, descriptions, form inputs */
--text-md:   14px     /* base body size — html/body default, doc prose */
--text-lg:   15px     /* detail panel titles, sub-headings, decision summary values */
--text-xl:   18px     /* admin section headings */
--text-2xl:  22px     /* page-level titles (Review, Recruiters) */
--text-3xl:  26px     /* admin overview large count numbers */
```

### Line heights

```css
--leading-tight:   1.3   /* compact elements: chips, pills, state labels */
--leading-snug:    1.4   /* table rows, inline metadata, sub-lines */
--leading-normal:  1.5   /* body paragraphs, admin fields, descriptions */
--leading-relaxed: 1.6   /* page descriptions, long-form text — html/body default */
```

### Label tracking

```css
--label-tracking-sm: 0.05em   /* standard uppercase labels */
--label-tracking-md: 0.07em   /* section headings, radar section labels */
```

### Spacing scale

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

The spacing scale is defined but not yet systematically adopted in component CSS. It is available for use in new work. Do not displace existing padding with space tokens unless running a deliberate adoption pass.

### Component padding

```css
--pad-badge:    1px 7px     /* small inline badges */
--pad-tag:      2px 8px     /* standard tags and pills */
--pad-btn-sm:   5px 10px    /* admin action buttons */
--pad-btn:      8px 16px    /* primary action buttons */
--pad-input:    7px 10px    /* admin search and most inputs */
--pad-input-lg: 8px 10px    /* main app form inputs */
--pad-cell:     9px 12px    /* table cells */
--pad-panel:   18px 20px    /* admin detail panel content area */
--pad-card:    12px 14px    /* standard surface cards */
--pad-card-lg: 14px 16px    /* larger cards and admin stat panels */
```

### Radius scale

```css
--radius-sm:   3px    /* micro badges: .ars-badge, .stage-tag, .decision-badge, .signal-tag */
--radius-md:   7px    /* cards: .radar-signal-card, .review-state-chip, .rsnap-card */
--radius-lg:   8px    /* larger containers: .filter-toggle-btn, .inbox-search-wrap, .decision-summary */
--radius-pill: 20px   /* pill tags: .radar-signal-tag */
```

Note: `--radius: 5px` (the global default) also exists as a core token and is used throughout the app shell, admin panel, inputs, and buttons via `var(--radius)`.

---

## 3. Where tokens are now adopted

Token adoption has been completed and regression-verified across these modules:

| Module | Pass | Scope |
|---|---|---|
| Admin | Pass A | `.admin-*`, `.ar-*` — tables, detail panel, buttons, rules, prompts, stats, radar sections |
| Role detail / document view | Pass B | `.doc-*`, `.signal-*`, `.decision-summary`, `.role-memory-*`, `.role-snapshot-*`, `.rsnap-*`, `.outcome-*`, `.peek-section`, `.rail-*`, `.jump-links-*`, `.recommended-cv`, `.pattern-signal-*`, `.hn-*` |
| Radar | Pass C | `.radar-*`, `.radar2-*` |
| Review | Pass D | `.review-*` |
| Recruiters | Small cleanup | `.add-recruiter-toggle`, `.recruiter-autofill-badge` |
| Inbox — badges and tags | Inbox Pass 1 | `.stage-tag`, `.ars-badge`, `.decision-badge` |
| Inbox — row text sub-lines | Inbox Pass 2 | `.inbox-signals`, `.inbox-meta`, `.inbox-verdict-reasons`, `.inbox-archetype`, `.inbox-cluster-label`, `.inbox-mini-reasons` |
| Inbox — search and filter chrome | Inbox Pass 3 | `.filter-toggle-btn`, `.inbox-search-wrap`, `.filter-panel-label-row`, `.filter-check-item`, `.filter-search-input`, `.inbox-search-clear`, `.inbox-tab`, `.filter-btn` |

---

## 4. Intentionally local values

These values have no exact token match and are expected to remain as literals. Do not replace them with the nearest token — the nearest token would change the computed value.

### Font sizes

| Value | Where used | Note |
|---|---|---|
| `9px` | `.ars-badge` | Intentionally smaller than `--text-xs`; badge is a dense status indicator |
| `9.5px` | `.admin-nav-section-label`, `.recommended-cv-label`, `.doc-role-lens-label`, decision summary sub-keys | Sub-label tier below `--text-xs` |
| `10px` | `.inbox-company`, `.inbox-cluster-count`, `.decision-pattern-card` labels, `.doc-section-heading`, role record titles | Sits between `--text-xs` and `--text-sm`; used for dense uppercase context labels |
| `11px` | `.rail-label`, `.rail-group-label`, `.rc-list-title`, `.ar-ov-label`, various section sub-labels | Compact label tier above `--text-xs` |
| `11.5px` | `.inbox-tab`, `.filter-btn`, `.inbox-results-count`, `.review-state-label`, `.rc-item-company`, timestamps, hints, secondary rail text | Intermediate density step used throughout |
| `12.5px` | `.admin-nav-item`, `.ar-stats-row`, `.ar-attention-row`, `.ar-detail-placeholder`, `.ar-field-value`, `.inbox-search-input`, `.share-link-text`, `.rc-detail-summary` | Main density step between `--text-sm` and `--text-base` |
| `13.5px` | `.inbox-title`, `.next-action-text`, `.radar2-card-title`, `.doc-empty`, `.timeline-label`, `.snap-card-title`, `.doc-list li` | Intermediate between `--text-base` and `--text-md`; used for list item body text |
| `17px` | `.compare-panel-title` | One-off panel title |
| `20px` | `.radar-page-title`, `.radar2-page-title`, `.snap-page-title`, `.rail-stage`, `.rc-detail-name` | Section page title tier; sits between `--text-xl` and `--text-2xl` |

### Line heights

| Value | Where used |
|---|---|
| `1` | Button resets, stat numbers — not a typography value |
| `1.2` | `.doc-role-title`, `.rc-detail-name` — tight heading fit |
| `1.25` | `.doc-role-title` line-height variation |
| `1.35` | `.inbox-title`, `.review-timeline-event`, `.review-timeline-grouped > summary` — compact heading |
| `1.45` | `.radar2-card-why`, `.reality-snapshot-value`, `.rsnap-field-row` — slightly snug body |
| `1.55` | `.ar-rules-item`, `.rc-note-entry-text`, `.outcome-learning-list li`, `.radar-empty-sub` |
| `1.65` | `.ar-prompts-text` (monospace block) |
| `1.68` | `.doc-prose` — the primary document reading line-height |

### Letter spacing

| Value | Where used |
|---|---|
| `0.01em` | `.inbox-cluster-label`, `.archetype-primary`, `.signal-tag`, `.rc-avatar` |
| `0.04em` | `.ar-table th`, `.ar-field-label` |
| `0.06em` | `.rail-label`, `.rail-group-label`, `.admin-nav-section-label` |
| `0.08em` | `.radar-signal-group-label`, `.review-timeline-date`, `.ar-rules-version`, timeline date groups |
| `0.09em` | `.review-section-label`, `.next-action-label`, `.pattern-notice-label` |
| `0.5px` | `.filter-panel-label-row`, `.ars-badge` (pixel unit, not em) |
| Larger values (`0.7px`, `0.8px`, `1px`, `1.1px`, `1.2px`) | Section label decorative usage, role record titles, decision summary keys |

### Radius

| Value | Where used | Note |
|---|---|---|
| `3px` | Some small buttons (`.rc-edit-btn`, `.outcome-edit-btn`) | Also matches `--radius-sm` exactly — these could be tokenised |
| `4px` | `.inbox-tab`, `.filter-btn`, `.filter-search-input`, `.nav-item`, `.nav-profile-row`, `.quick-outcome-btn`, `.doc-decision`, `.outcome-badge`, `.verdict-chip`, `.decision-state-btn` | Intentionally tighter than `--radius` (5px) — compact interactive controls |
| `6px` | `.snap-take-btn`, `.add-recruiter-section`, `.role-snapshot-row`, `.hn-banner` | Pre-cleanup remnants; address in a future radius pass |
| `10px` | `.sg-badge`, `.compare-pill`, `.rc-type-badge` | Between `--radius-lg` and `--radius-pill`; sits in a gap in the scale |

### Component padding

| Value | Where used |
|---|---|
| `1px 5px` | `.ars-badge` — intentionally tighter than `--pad-badge` |
| `1px 6px` | `.stage-tag`, `.decision-badge` — intentionally tighter than `--pad-badge` |
| `2px 7px` | `.radar-signal-tag`, `.recruiter-autofill-badge` — note: `--pad-tag` is `2px 8px`, not a match |
| `10px 12px` | `.add-recruiter-toggle` |

### Colour one-offs

| Value | Where used | Note |
|---|---|---|
| `#ECFDF5` | `.doc-decision.apply`, `.dab-apply`, `.btn-copy-link.copied`, `.radar-signal-tag.plus` | Lighter mint green — distinct from `--success-bg` (`#D1FAE5`); used for pill/tag fills |
| `#DC2626` / `#B91C1C` | `.ar-btn-confirm-delete` | Solid-fill red for destructive confirm buttons — `--error` is a text-on-light colour and serves a different role |
| `#8A8A8A` | `.rail-label`, `.rail-group-label` | Slightly warmer grey for rail section labels; intentional |
| `#CCCAC4` | `.inbox-company-unknown` | Faded company label when company is unknown |

---

## 5. Deferred / out-of-scope areas

These modules or value categories were not included in any adoption pass and remain entirely on local literals.

| Area | Reason not touched |
|---|---|
| `.filter-side-panel` / `.fp-*` block | Not in scope for any pass; standalone component |
| Stats page (`.stats-*`) | Not in scope; all values are local literals |
| Platform Safeguards (`.sg-*`) | Not in scope; all values are local literals |
| Decision action bar (`.dab-*`) | Not in scope; bespoke values |
| Compare panel (`.compare-*`) | Not in scope |
| Snapshots page (`.snap-*`) | Not in scope |
| Modal and form components | Not in scope |
| JavaScript inline styles | Cannot be addressed in a CSS-only pass; tracked separately |
| `--space-*` adoption in component CSS | Spacing scale tokens are live in `:root` but have not been substituted into component-level padding/gap values |
| `4px` radius normalisation | Requires a visual decision on whether `--radius` (5px) should absorb it |
| `6px` radius cleanup | Partly blocked by JS inline styles |

### Within-scope selectors permanently deferred

These selectors were examined during the Inbox preflight and confirmed as having zero exact token matches. They remain on local literals indefinitely unless the token scale is deliberately expanded.

| Selector | Values kept local |
|---|---|
| `.inbox-role` | `padding: 12px 14px 13px` — asymmetric, no token match |
| `.inbox-title` | `font-size: 13.5px`, `line-height: 1.35` |
| `.inbox-company` | `font-size: 10px` |
| `.inbox-decision-pill` | All values — bespoke, no token matches |
| `.inbox-search-input` | `font-size: 12.5px` |
| `.inbox-results-count` | `font-size: 11.5px` |
| `.inbox-cluster-count` | `font-size: 10px` |
| `.filter-sub` | `font-size: 11px` |

---

## 6. Working rules for future UI changes

**Use an existing token first.** Before writing a literal value in new CSS, check whether the token set covers it. If `--text-base`, `--leading-normal`, `--radius-md`, or another active token resolves to the exact value you need, use the token.

**Do not invent a new token for a one-off local value.** A token earns its place by appearing in three or more unrelated selectors with a clear semantic meaning. A value used in one component is a local value.

**Do not substitute the nearest token if it changes the computed value.** A `12.5px` font-size is not `--text-sm` (12px). A `4px` radius is not `--radius-sm` (3px) or `--radius` (5px). Token adoption is value-preserving by definition. If the nearest token is off by even 0.5px, leave the literal.

**Treat shared utilities carefully.** Selectors like `.stage-tag`, `.ars-badge`, `.decision-badge`, and `.verdict-chip` are used across multiple views and contexts. Changes to these selectors affect the entire product. Run a preflight read across all usages before touching them.

**Keep module passes scoped.** Work on one named CSS namespace at a time. Do not make cross-module edits in a single pass. If you notice a value in `.review-*` while working on `.radar-*`, note it for a separate pass rather than fixing it in-place.

**Do not open a deferred item without a deliberate decision.** The items listed in Section 5 are deferred for documented reasons. Opening one requires a new scoped plan, not an opportunistic edit.

**Prefer `var()` references over repeating literals in new CSS.** New component CSS should use `var(--text-base)`, `var(--radius-md)`, etc. wherever the scale covers it. This keeps drift from accumulating in new work.

---

## 7. Change discipline

Future token adoption passes — whenever they happen — should follow the same discipline used in the completed passes:

**Scoped.** Each pass has a named, bounded scope: a list of selector names agreed in advance. Work only touches those selectors. Nothing adjacent is edited opportunistically.

**Read-only preflight first.** Before making any changes, read every selector in scope. Record all current values. Identify which have exact token matches and which do not. Produce a written plan of the substitutions before any edits begin.

**Exact value-preserving substitutions only.** Every token substituted must resolve to the same computed value as the literal it replaces. If a token resolves to a different value, it is not a valid substitution regardless of how close it is.

**One pass, one concern.** Do not mix a typography pass with a radius pass. Do not mix two modules in a single set of edits. Passes that mix concerns are harder to verify and harder to revert.

**Regression check after each pass.** After a pass is applied, re-read every selector that was edited and verify the token renders correctly. Confirm that preserved literals were not touched. Document the check.

**No speculative improvements.** If the pass scope is `.review-*`, a `.review-*` selector with no token match is left alone. It is not improved, renamed, reorganised, or cleaned up. Documentation is the only output for values with no match.
