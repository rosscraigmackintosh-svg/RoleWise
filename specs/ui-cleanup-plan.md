# RoleWise UI Cleanup Plan
_Generated from full design system audit · March 2026_

---

## Context

This plan converts the findings from the UI consistency audit into a safe, staged series of Claude jobs. The codebase is a single-file SPA (`index.html`, ~16,100 lines). All changes are CSS or JS variable declarations unless otherwise noted — no structural HTML changes, no logic changes.

**Ground rules for every job in this plan:**
- One job at a time, no side effects
- Do not touch anything not named in the job spec
- Save a backup before each job

---

## Audit Findings Summary

Ten categories of inconsistency were identified:

| # | Category | Risk | Scope |
|---|----------|------|-------|
| 1 | Border-radius fragmentation | Low | CSS only |
| 2 | Button padding inconsistency | Low | CSS only |
| 3 | Semantic colour tokens missing | Medium | CSS + JS |
| 4 | Hardcoded colours in JS strings | Medium | JS only |
| 5 | Page padding inconsistency | Low | CSS only |
| 6 | Table header inconsistency | Low | CSS only |
| 7 | Mixed focus colours | Low | CSS only |
| 8 | Line-height drift | Low | CSS only |
| 9 | Uppercase label letter-spacing | Low | CSS only |
| 10 | Nav item inconsistency | Low | CSS only |

---

## Recommended Cleanup Phases

### Phase 1 — CSS token foundation (lowest risk)
Add missing semantic tokens to `:root` without changing any existing values. This is a pure addition — nothing breaks because nothing is being replaced yet.

**Jobs in this phase:**
1. Add `--success`, `--success-bg`, `--success-border` tokens
2. Add `--error`, `--error-bg`, `--error-border` tokens
3. Add `--warning`, `--warning-bg`, `--warning-border` tokens
4. Add `--focus-ring` token (single canonical focus colour)

### Phase 2 — CSS search and replace (low risk, auditable)
Replace hardcoded hex/rgb values in CSS with the new tokens. Each job targets one category only. Changes are mechanical and easy to verify by diff.

**Jobs in this phase:**
5. Replace all hardcoded error reds in CSS (`#991B1B`, `#FFF5F5`, `#FECACA`, `#7F1D1D`) with `--error-*` tokens
6. Replace all hardcoded success greens in CSS (`#065F46`, `#D1FAE5`, `#6EE7B7`) with `--success-*` tokens
7. Normalise border-radius: replace `4px` and `6px` in CSS with `var(--radius)` (currently `5px`)
8. Normalise button padding: audit all `.btn-*` variants and align to two sizes (default `8px 16px`, small `5px 10px`)
9. Normalise page section padding: align `.admin-content` and main view containers to a single consistent `padding` value
10. Normalise table header styles: pick one rule for `<th>` (currently split between inline and class-based)
11. Normalise focus ring: replace `outline: 2px solid #2563EB` etc. with `outline: 2px solid var(--focus-ring)`
12. Normalise line-height: audit and align body copy, table cells, and detail panel text to `1.5`
13. Normalise uppercase label spacing: add/align `letter-spacing: 0.04em` on all `.label`, `.ar-section-label`, `.ar-detail-label` targets

### Phase 3 — JS hardcoded colours (medium risk)
Replace hardcoded colour strings inside JS template literals with CSS variable lookups or class additions. This is slightly higher risk because it touches JS rendering functions — but changes are still mechanical.

**Jobs in this phase:**
14. Replace hardcoded `color: #...` inline styles in admin JS with CSS class assignments
15. Replace toast background/border colours in JS with CSS class (the `.ar-action-toast` class already exists in CSS — ensure JS only sets `className`, never inline colour)

### Phase 4 — Nav item polish (low risk, visual only)
16. Audit and align all nav item padding, font-size, and active/hover states between main rail and admin nav

---

## Exact Change Order

```
Phase 1:  Jobs 1 → 2 → 3 → 4         (add tokens, no replacements)
Phase 2:  Jobs 5 → 6 → 7 → 8 → 9     (replace in CSS, error/success first)
          → 10 → 11 → 12 → 13         (remaining CSS normalisations)
Phase 3:  Jobs 14 → 15                (JS colour cleanup)
Phase 4:  Job 16                      (nav polish)
```

Do **not** run Phase 3 before Phase 1 and Phase 2 are complete — the JS jobs reference CSS class names that may not yet be updated.

---

## Low-Risk Changes

All Phase 1 and Phase 2 jobs are low risk. Specific reasons:

- **Token additions (jobs 1–4)** are purely additive. No existing code is touched.
- **CSS hex replacements (jobs 5–13)** are mechanical find-and-replace. Each targets a single visual property. Visual regression is the only risk and is easy to spot in browser.
- **Border-radius and padding (jobs 7–8)** have no layout impact — they affect visual size only.
- **Focus ring (job 11)** only affects keyboard focus outlines. Unlikely to affect users unless they rely on keyboard nav, and the change is purely cosmetic.

---

## Higher-Risk Changes

- **Jobs 14–15 (JS colours):** Replacing inline styles in JS template strings risks breaking existing rendering if the replacement class is not applied in exactly the right place. Mitigation: test each admin section after the job, specifically look for toast feedback, error cells, and action messages.

- **Job 8 (button padding normalisation):** Button sizes affect layout density. If padding is reduced on any button that currently has extra padding compensating for something, content may shift. Mitigation: screenshot before/after on Roles detail panel, Radar, and all modal/confirm dialogs.

- **Job 10 (table header normalisation):** If the current split between inline and class-based `<th>` styles is intentional (e.g. different tables have different header weights), flattening them could make the admin tables visually identical when they shouldn't be. Mitigation: confirm all admin tables should share one style before running this job.

---

## Suggested Claude Job Breakdown

Each job below is a standalone Claude instruction. Copy and run them one at a time.

---

**Job 1 — Add success tokens**
> You are doing one small isolated job only. Do not modify any existing code. Goal: Add three new CSS custom properties to the `:root` block in `index.html`: `--success: #065F46`, `--success-bg: #D1FAE5`, `--success-border: #6EE7B7`. Add them directly after the existing colour tokens. No other changes.

---

**Job 2 — Add error tokens**
> You are doing one small isolated job only. Do not modify any existing code. Goal: Add three new CSS custom properties to the `:root` block: `--error: #991B1B`, `--error-bg: #FFF5F5`, `--error-border: #FECACA`. Add after the success tokens added in Job 1.

---

**Job 3 — Add warning tokens**
> You are doing one small isolated job only. Do not modify any existing code. Goal: Add three new CSS custom properties to the `:root` block: `--warning: #92400E`, `--warning-bg: #FFFBEB`, `--warning-border: #FCD34D`. Add after the error tokens.

---

**Job 4 — Add focus-ring token**
> You are doing one small isolated job only. Do not modify any existing code. Goal: Add one new CSS custom property to the `:root` block: `--focus-ring: #2563EB`. Add after the warning tokens.

---

**Job 5 — Replace hardcoded error colours in CSS**
> You are doing one small isolated job only. Goal: In the CSS section of `index.html`, replace all hardcoded error-red values with the new semantic tokens. Specifically: `#991B1B` → `var(--error)`, `#FFF5F5` → `var(--error-bg)`, `#FECACA` → `var(--error-border)`, `#7F1D1D` → `var(--error)`. Only change CSS rule declarations, not JS strings or HTML attributes.

---

**Job 6 — Replace hardcoded success colours in CSS**
> You are doing one small isolated job only. Goal: In the CSS section of `index.html`, replace all hardcoded success-green values with the new semantic tokens. Specifically: `#065F46` → `var(--success)`, `#D1FAE5` → `var(--success-bg)`, `#6EE7B7` → `var(--success-border)`. Only change CSS rule declarations.

---

**Job 7 — Normalise border-radius in CSS**
> You are doing one small isolated job only. Goal: In the CSS section of `index.html`, replace `border-radius: 4px` and `border-radius: 6px` with `border-radius: var(--radius)`. The `--radius` token is already defined as `5px`. Do not touch `border-radius` values on elements that intentionally differ (e.g. circular avatars, pill badges). Do not touch any JS.

---

**Job 8 — Normalise button padding**
> You are doing one small isolated job only. Goal: Audit all `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-sm`, `.btn-danger` CSS rules and confirm that padding follows two sizes only: default `8px 16px` and small `5px 10px`. Correct any outliers. Do not change button colours, font-size, or border. Do not touch JS.

---

**Job 9 — Normalise page section padding**
> You are doing one small isolated job only. Goal: Ensure `.admin-content` and the main application view containers use a consistent top/bottom padding. The target is `padding: 32px 36px`. Check for any views that have noticeably different padding and align them. Do not touch layout structure or flex properties.

---

**Job 10 — Normalise table header styles**
> You are doing one small isolated job only. Goal: Ensure all admin `<th>` elements share one consistent style: `font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted)`. Remove any duplicate or conflicting `<th>` rules. Do not touch `<td>` styles.

---

**Job 11 — Normalise focus ring**
> You are doing one small isolated job only. Goal: In the CSS section of `index.html`, replace all hardcoded focus outline colour values (`outline: 2px solid #2563EB`, `outline-color: #2563EB`, etc.) with `var(--focus-ring)`. Do not touch any focus-visible display logic, only the colour value.

---

**Job 12 — Normalise line-height**
> You are doing one small isolated job only. Goal: Audit the CSS for body copy, table cells (`.ar-table td`), and admin detail panel text (`.ar-detail-value`). Where `line-height` is missing or set to a value other than `1.5`, add or update it to `line-height: 1.5`. Do not touch heading or label line-heights.

---

**Job 13 — Normalise uppercase label letter-spacing**
> You are doing one small isolated job only. Goal: Ensure all uppercase label rules (`.ar-detail-label`, `.ar-section-label`, `.ar-stats-label` where applicable) include `letter-spacing: 0.04em`. Add the property where missing; correct any that differ. No other changes.

---

**Job 14 — Remove inline colour styles from admin JS**
> You are doing one small isolated job only. Goal: Audit JS template literals in the admin section of `index.html` for any `style="color: #..."` or `style="background: #..."` inline styles. Replace each with a CSS class assignment instead. The relevant CSS classes already exist (`.admin-error`, `.admin-loading`, `.ar-action-toast`, `.ar-error-cell`). Do not add new CSS classes in this job.

---

**Job 15 — Audit toast class usage in JS**
> You are doing one small isolated job only. Goal: Confirm that every toast div created in JS (archive/restore confirmation) sets `className = 'ar-action-toast'` only and does not additionally set inline `style` colour properties. If any inline colour overrides exist on toast elements, remove them. No CSS changes.

---

**Job 16 — Nav item visual alignment**
> You are doing one small isolated job only. Goal: Confirm that the main left-rail nav items and the admin nav items share the same `font-size`, `padding`, and `border-radius` for their active/hover states. Correct any visual differences. Do not change nav layout widths or structure.

---

## Notes for Implementer

- **Always save a backup before each job.** The folder already has a `backups/` directory.
- **Visual test after each job.** Load the app in the browser, open Admin, click through Roles, Radar, Stats, and Prompts after any CSS change.
- **Jobs 1–4 can be batched** into a single Claude job if preferred (they are all additive `:root` additions). All others should remain separate.
- **Phase 3 jobs (14–15) require a smoke test** of the archive/restore flow and the error state flow specifically after completion.
