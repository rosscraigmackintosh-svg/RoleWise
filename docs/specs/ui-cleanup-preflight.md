# UI Cleanup Plan — Preflight Validation Report
_Read-only code inspection · March 2026_

No code was modified during this pass.

---

## Section 1 — Plan Items Confirmed Safe (run as written)

**Job 1 — Add success tokens**
Confirmed safe. The `:root` block is at line 13 and currently has 6 tokens (`--bg`, `--surface`, `--border`, `--border-light`, `--text`, `--text-muted`, `--text-light`, `--accent`, `--radius`, `--font`). No `--success-*` tokens exist. Addition is purely additive.

**Job 2 — Add error tokens**
Confirmed safe. No `--error-*` tokens currently exist in `:root`.

**Job 3 — Add warning tokens**
Confirmed safe. No `--warning-*` tokens exist.

**Job 4 — Add focus-ring token**
Confirmed safe. No `--focus-ring` token exists. Note: there are no `outline: 2px solid #2563EB` patterns in the codebase at all (Job 11 confirmed below) — but the token is still useful pre-work for consistency.

**Job 5 — Replace hardcoded error reds in CSS**
Confirmed safe with one important scope note: `#991B1B`, `#FFF5F5`, `#FECACA`, and `#7F1D1D` appear **only in CSS rules**, not in JS template strings. The CSS locations are: `.admin-error` (lines 1312–1314), `.ar-error-cell` (lines 1321–1322), `.ar-delete-confirm` (lines 1014–1021), `.ar-btn-delete` (lines 1003, 1008), `.sg-badge.*` (lines 673, 678, 683), `.inbox-decision-pill.pill-red` (line 2561), `.ars-ghosted` (line 2589), `.doc-decision.skip` (line 2796), `.decision-summary.ds-red` (line 3250), `.sticky-decision-bar.sdb-red` (line 3311), `.s-rejected` (line 4525), `.inline-error` (lines 4643, 4648). **All are CSS only — safe to replace.**

**Job 6 — Replace hardcoded success greens in CSS**
Confirmed safe. `#065F46`, `#D1FAE5`, `#6EE7B7` appear in CSS rules only. Locations include: `.ar-action-toast` (lines 1047–1049), `.radar-signal-tag.plus` (line 277), `.sg-badge.success/normal` (lines 672, 681), `.ar-btn-restore:hover` (line 943), `.dab-apply:hover` (line 1424), `.btn-copy-link.copied` (line 2367), `.inbox-decision-pill.pill-green` (line 2559), `.doc-decision.apply` (line 2794), and several doc-decision and decision-summary rules.

**Job 7 — Normalise border-radius in CSS**
Confirmed. `4px` appears at lines 178, 491, 1095, 1219, 1727, 1793, 2014, 2040, 2357, 2551, 2788, 2980, 3094, 3536, 3965, 4017, 4071, 4107, 4518, 4665, 4821, 4842, 4939, 5049, 5086. `6px` appears at lines 491, 758, 1395, 1913, 2040, 2079, 2341, 2448, 3066, 3766. Both are safe to replace with `var(--radius)` where they are used as `border-radius` in general UI components. **Exception confirmed needed at line 1913**: `border-radius: 6px; padding: 0;` is on an element whose context needs checking — see Section 2.

**Job 13 — Normalise uppercase label letter-spacing**
The `.ar-table th` rule at line 795 already has `letter-spacing: 0.04em` — consistent. `.admin-nav-section-label` (line 713) uses `0.06em` — this is a section divider label, intentionally slightly looser. Radar heading (line 1343) uses `0.05em`. The `.ar-stats-label` (line 1287) has no letter-spacing set at all. Safe to target admin-specific label classes specifically.

**Job 15 — Audit toast class usage in JS**
Confirmed safe. The `.ar-action-toast` class in CSS at lines 1044–1053 contains all colour properties directly. No JS overrides with inline `style` were found on toast elements. The JS only sets `toast.className = 'ar-action-toast'` and `toast.textContent`. This job is already complete — no changes needed.

**Job 16 — Nav item visual alignment**
Confirmed. `.nav-item` (line 173) and `.admin-nav-item` (line 719) are the two nav systems. They have close but not identical styles:
- `.nav-item`: `font-size: 13px`, `padding: 6px 8px`, `border-radius: 4px`
- `.admin-nav-item`: `font-size: 12.5px`, `padding: 6px 10px`, `border-radius: 5px`
These are intentionally slightly different (admin is a narrower secondary nav), so this job should be reviewed carefully before implementation — see Section 2.

---

## Section 2 — Plan Items That Need Rewriting Before Implementation

**Job 7 — Border-radius normalisation: scope is too broad**
The plan says to replace "all `4px` and `6px` in CSS." This is risky at the stated scope. Several specific uses are intentional:
- Line 178: `.nav-item` — `4px` is slightly tighter than `--radius` (5px). This is fine to change but note it affects the main left nav.
- Line 1913: `border-radius: 6px; padding: 0;` — context is unclear without surrounding rule; needs checking before replacement.
- Line 4665: `.jd-truncation-actions button` inline rule — `4px` in a one-liner alongside other inline properties; fine to change but not worth a blind `replace_all`.
- Lines 2040, 2079: These are inside Inbox/doc decision pills — intentionally small radius for pill-style tags.

**Recommended rewrite:** Instead of a blind find-and-replace, split Job 7 into two targeted replacements: (a) admin-area `4px`/`6px` values only (selectors starting `.ar-`, `.admin-`), and (b) remaining global UI values as a separate pass with visual review.

---

**Job 8 — Button padding normalisation: `.btn-secondary`, `.btn-sm`, and `.btn-danger` do not exist**
The plan references `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-sm`, `.btn-danger` as the button classes to audit. Only two of these actually exist in the codebase:
- `.btn-primary` ✓ exists at line 4612, `padding: 9px 18px`
- `.btn-ghost` ✓ exists at line 4783, `padding: 7px 14px`
- `.btn-secondary` ✗ — does not exist
- `.btn-sm` ✗ — does not exist
- `.btn-danger` ✗ — does not exist
- `.btn` (base class) ✗ — does not exist

The actual admin-specific action buttons have their own classes: `.ar-btn-archive`, `.ar-btn-restore`, `.ar-btn-delete`, `.ar-btn-confirm-delete`, `.ar-btn-cancel-delete`. These are not mentioned in the plan at all.

Additionally, `.btn-ghost` is currently marked `cursor: not-allowed; opacity: 0.55` — it appears to be a deliberately disabled visual-only element, not a general interactive button. Applying `8px 16px` padding to it would change its apparent size in the UI.

**Recommended rewrite:** Rename this job to "Audit active button padding" and target only `.btn-primary` and the `.ar-btn-*` action buttons. Remove the non-existent class names. Do not touch `.btn-ghost` as it is a special-case disabled style.

---

**Job 9 — Page padding normalisation: `.admin-content` is already correct**
`.admin-content` at line 735 already has `padding: 32px 36px 40px`. The `40px` bottom padding is intentional (confirmed in a previous polish pass to reduce over-padding at bottom — this was the target state). Changing it to `32px 36px` would reduce the bottom padding.

The plan target of `padding: 32px 36px` is also ambiguous — the shorthand would set all four sides, discarding the intentional `40px` bottom. For other views, no consistent `padding` property was found on a single container class comparable to `.admin-content`.

**Recommended rewrite:** Change the job goal to "confirm `.admin-content` padding is at current intentional value (`32px 36px 40px`) and identify any other full-view containers with significantly different padding." Remove the implication of changing `.admin-content`.

---

**Job 10 — Table header normalisation: only one `<th>` system exists**
The plan assumes there are multiple conflicting `<th>` rules (split between "inline and class-based"). In practice, all admin tables use `.ar-table th` (line 789), which already has a fully defined, consistent style:
```
font-size: 10.5px; font-weight: 600; color: var(--text-muted);
text-transform: uppercase; letter-spacing: 0.04em;
padding: 9px 12px 8px; border-bottom: 1px solid var(--border);
```
There are no conflicting `<th>` rules, no inline `<th>` styles, and no other table systems in the admin area.

**Recommended rewrite:** Convert Job 10 to a no-op confirmation. If the intent is to align non-admin tables (there are other `<table>` elements elsewhere in the app), those need a separate targeted audit before changes are made, as they may be intentionally different.

---

**Job 11 — Focus ring normalisation: no `#2563EB` outline pattern exists**
The plan states: replace `outline: 2px solid #2563EB` with `var(--focus-ring)`. A full-file search confirms there are **zero instances** of `#2563EB` used in any `outline` property. The focus patterns in the codebase are:
- `:focus` rules universally use `border-color: var(--accent)` (not `outline`)
- `outline: none` appears in several textarea focus rules
- The `--accent` token is already `#3B7DD8` — not `#2563EB`
- `#2563EB` appears only in `.ar-expand-btn { color: var(--accent, #2563EB) }` as a fallback value, not an outline

**Recommended rewrite:** Job 11 as written would change nothing. If the intent is to ensure consistent focus rings exist, the job should instead be: "Audit `:focus` and `:focus-visible` rules across the file and confirm interactive elements use `border-color: var(--accent)` consistently." This is a different (and genuine) job.

---

**Job 12 — Line-height normalisation: scope is far too large and the target value is wrong**
The codebase has `line-height` on approximately 100+ rules with values from `1` to `1.9`. The body base is already `1.6` (line 33). A target of `1.5` across body copy, table cells, and detail panels would actually reduce line-height on many elements.

The `.ar-table td` rule has no explicit `line-height` set — it inherits the body's `1.6`. Adding `1.5` would decrease it.

The plan also states "Do not touch heading or label line-heights" — but without named selectors this restriction is hard to enforce safely.

**Recommended rewrite:** Narrow this job to admin-specific elements only. Target: confirm `.ar-detail-value` (if it exists — see Section 3), `.ar-stats-row`, and `.ar-radar-item` have appropriate line-heights. Do not attempt to normalise all `line-height` values across the entire file — that is a multi-day visual regression audit, not a single job.

---

**Job 14 — Remove inline colour styles from admin JS**
The plan says JS template literals contain `style="color: #..."` or `style="background: #..."` values to replace with CSS classes. A search of the JS section confirms this is partially true but **not for admin JS specifically**. The inline colour strings in JS are:
- Line 7237: `color:#aaa` in match output panel (non-admin)
- Line 8862: `color:#c0392b` in undo bar (non-admin)
- Lines 9088, 10142–10143: Warning banners with `background:#FEF3C7; color:#92400E` (analysis warning — non-admin)
- Line 9382: `color:#B91C1C` in CV empty state (non-admin)
- Line 16022: `color:#B91C1C` in state-msg (non-admin)
- Line 8638: `btn.style.background = '#FEF2F2'` (non-admin JS)

None of these are in the admin section. The admin JS does not use inline `style` colour properties on dynamically created elements.

**Recommended rewrite:** Either mark Job 14 as a no-op for admin JS (already clean), or retarget it as a separate future pass covering the non-admin inline JS colours (which is a larger, higher-risk job than currently scoped).

---

**Job 16 — Nav item visual alignment: differences are intentional**
As noted in Section 1, the two nav systems are deliberately different in size. The admin nav (`--admin-nav-item`) sits inside a narrower 168px sidebar at smaller type size. The main nav (`.nav-item`) is in a 180px column at slightly larger type. The padding and font-size differences are proportional and deliberate.

The main nav also has a hover state using `--border-light` while admin nav uses `--surface`. These serve the same purpose but in different background contexts (main nav bg is `--bg`, admin content bg is `--bg`).

**Recommended rewrite:** Clarify the job goal as "document the intentional differences and confirm no accidental divergences" rather than "align" them. If alignment is still desired, specify exactly which property and to which value — not a blanket "align."

---

## Section 3 — Missing or Incorrect Selectors in the Plan

| Selector in Plan | Status | Actual Selector |
|---|---|---|
| `.btn` | ✗ Does not exist | No base `.btn` class — use `.btn-primary` and `.ar-btn-*` |
| `.btn-secondary` | ✗ Does not exist | No secondary button class |
| `.btn-sm` | ✗ Does not exist | No small button variant class |
| `.btn-danger` | ✗ Does not exist | Use `.ar-btn-delete` instead |
| `.ar-detail-label` | ✗ Does not exist | No selector found anywhere in CSS or JS |
| `.ar-section-label` | ✗ Does not exist | No selector found anywhere in CSS or JS |
| `.ar-detail-value` | (not in plan, but plan references "detail panel text") | No selector found — detail rows are inline HTML in JS |
| `.btn-primary` | ✓ Exists at line 4612 | — |
| `.btn-ghost` | ✓ Exists at line 4783 | — |
| `.admin-content` | ✓ Exists at line 735 | — |
| `.admin-error` | ✓ Exists at line 1310 | — |
| `.admin-loading` | ✓ Exists at line 1305 | — |
| `.ar-error-cell` | ✓ Exists at line 1319 | — |
| `.ar-action-toast` | ✓ Exists at line 1044 | — |
| `.ar-stats-label` | ✓ Exists at line 1287 | Note: letter-spacing is absent from this rule |

**Additional note on admin detail panel structure:** The detail panel renders rows as raw HTML template strings in `_loadAndRenderDetail()`. There is no `.ar-detail-label` or `.ar-detail-value` class. Labels are `<span>` elements with inline styles applied. Job 13 as written (targeting `.ar-detail-label`) would match nothing.

---

## Section 4 — Recommended Revised Implementation Order

Based on actual code findings, the following order is safe and effective:

**Batch A — Token additions (safe, purely additive)**
Run jobs 1, 2, 3, 4 together or sequentially. No risk.

**Batch B — CSS colour token replacement (safe, scoped)**
Run job 5 (error reds in CSS) and job 6 (success greens in CSS). Mechanically safe. Confirm the wider app sections (badges, pills, decision bars) visually after completion — these are non-admin uses of the same colours.

**Batch C — Admin-scoped border-radius (safe with rewrite)**
Run a revised Job 7 targeting only `.ar-*` and `.admin-*` selectors. Skip the global pass until a separate visual audit is scheduled.

**Batch D — Button padding (safe with rewrite)**
Run a revised Job 8 targeting `.btn-primary` and `.ar-btn-*` only. Remove non-existent class names.

**Batch E — Letter-spacing on `.ar-stats-label` (safe)**
Run a revised Job 13 targeting `.ar-stats-label` specifically (add `letter-spacing: 0.05em` to match `.ar-table th`). The `.ar-detail-label` / `.ar-section-label` targets don't exist — skip or re-identify actual selectors first.

**Batch F — Deferred / needs investigation before scheduling**
- Job 9 (page padding): `.admin-content` is already correct; skip or rewrite goal.
- Job 10 (table headers): no problem exists; downgrade to confirmation.
- Job 11 (focus ring): no `#2563EB` outline exists; rewrite as focus-visible audit.
- Job 12 (line-height): scope too broad; needs narrowing to specific admin selectors.
- Job 14 (JS inline colours): no admin JS inline colours found; either skip or retarget non-admin JS as a separate higher-risk job.
- Job 15 (toast class): already clean; mark as done.
- Job 16 (nav alignment): differences are intentional; rewrite as documentation job or drop.
