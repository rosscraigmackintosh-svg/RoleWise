# RoleWise UI Build Discipline
_Internal working rulebook · March 2026_

This file defines how UI work should be done on RoleWise, not what the design system contains. For the live token set and documented local exceptions, see `specs/rolewise-design-tokens-live.md`.

---

## 1. Purpose

RoleWise has a stable, regression-tested CSS system. The purpose of this file is to keep it that way. It documents the working discipline that was actually followed during the token adoption passes — inspection-first, narrowly scoped, value-preserving — so that future UI work, by any contributor, maintains the same standard.

The risk this file guards against is well-intentioned drift: small casual edits, approximate token substitutions, and scope creep that individually seem harmless but collectively erode the system's integrity.

---

## 2. Core rule

**Prefer existing tokens, selectors, and patterns before introducing anything new.**

Before writing any new CSS value, check whether the token set or an existing component pattern already covers it. Before adding a new selector, check whether an existing one can serve the purpose. Before restructuring anything, check whether the current structure is deliberate.

When in doubt, match what is already there.

---

## 3. Token usage rules

**Use an existing token when there is an exact match.**
If `--text-base` resolves to 13px and the value you need is 13px, use `var(--text-base)`. If `--radius-md` resolves to 7px and the value you need is 7px, use `var(--radius-md)`. The test is exact computed value equality, not visual closeness.

**If there is no exact match, leave the value as a local literal.**
A `12.5px` font-size is not close enough to `--text-sm` (12px) to substitute. A `4px` radius is not close enough to `--radius-sm` (3px) or `--radius` (5px). Do not round up or round down. Leave the literal in place.

**Do not invent a new token for a one-off local value.**
A value that appears in one selector, or even in two closely related selectors within a single component, is a local value. It earns a token only when it appears across multiple unrelated modules with a clear semantic meaning — and only as the result of a deliberate system decision, not opportunistic cleanup.

**Do not casually replace local values because they look similar to a token.**
Approximate substitutions introduce subtle but real visual regressions. The system's integrity depends on every substitution being exact. If you are unsure whether a substitution is exact, read the token definition in `:root` and compare it to the literal character by character.

**`var()` references in new CSS are preferred.**
New selectors should use `var(--text-base)`, `var(--radius-md)`, etc. wherever the scale covers the value exactly. This prevents fresh drift from accumulating.

---

## 4. Scoped change discipline

Before making UI changes, follow this sequence:

**Inspect first.**
Read the selectors in scope before touching anything. Note the current values. Note which have exact token matches and which do not. Produce a written plan of what will change and what will be left alone. Do not begin editing until the plan is clear.

**Define scope narrowly.**
A pass has a named list of selectors agreed before work begins. Nothing outside that list is edited, even if an adjacent selector appears to have the same issue. Opportunistic edits are how regressions happen.

**Avoid shared and global selectors unless the intent is explicitly global.**
Shared utilities (`.stage-tag`, `.ars-badge`, `.decision-badge`, `.verdict-chip`, `.signal-body`) appear across multiple views and modules. A change to one of these affects the entire product. If you need to change something that looks like a shared utility but only want the change to apply in one context, use a scoped descendant selector or modifier class rather than editing the base rule.

**Prefer module passes over broad cross-app rewrites.**
Work one named CSS namespace at a time: `.review-*`, `.radar-*`, `.inbox-*`, etc. If you notice an issue in `.review-*` while working on `.radar-*`, note it for a separate pass. Cross-module edits in a single pass are harder to verify, harder to revert, and harder to document.

**Exact value-preserving substitutions only when normalising.**
When adopting tokens into existing CSS, every substitution must preserve the computed value. This is not a stylistic preference — it is the definition of a safe normalisation pass. Any change that alters computed value is a design change, not a normalisation, and requires explicit intent and sign-off.

**Regression check after each pass.**
After a pass is applied, re-read every selector that was edited. Verify the token renders correctly. Confirm that preserved literals were not accidentally touched. Document the check. A pass without a regression check is not complete.

---

## 5. Shared selector caution

**Global utilities** (`.stage-tag`, `.ars-badge`, `.decision-badge`, `.signal-tag`, `.verdict-chip`, `.status-tag`) are consumed across multiple modules and often across both CSS and JS template strings. Any change must account for every usage site. Read all callsites before editing.

**Shared buttons** (`.ar-action-btn`, `.ar-btn-delete`, `.ar-btn-confirm-delete`, `.rail-admin-btn`, `.btn-primary`) have hover, disabled, and active states that depend on specific padding and sizing relationships. Changing font-size or padding on a shared button class requires verifying every state and every context where it appears.

**Form controls** (`.field-input`, `.field-select`, `.field-textarea`, `.ar-search`, modal inputs) are used across the main app and admin. Their font-size, padding, and border-radius are intentionally aligned. Do not adjust one without checking the others.

**Multi-module selectors.** Some selectors defined in one CSS region render in a different product area. `.stage-tag` is defined near the Inbox CSS but renders in the document view's `.doc-stage-context` block as well. `.signal-tag` renders inside the document column but is reused in the rail peek panel. Before editing any selector that appears in the Inbox region, verify whether it is also used in the document view or admin panels.

**Co-located but distinct selectors.** Some CSS blocks contain selectors from different product areas written adjacently for historical reasons. The Inbox region includes `.ars-badge`, `.stage-tag`, and `.decision-badge` which are shared across views. Edit only the specific selectors named in the pass scope, not everything in the surrounding block.

---

## 6. Allowed local exceptions

The following categories of values are expected to remain as local literals. Do not normalise them without a deliberate system decision.

**Intermediate font sizes.** Values of `9px`, `9.5px`, `10px`, `11px`, `11.5px`, `12.5px`, `13.5px`, and `20px` all serve specific density roles in their contexts. They are not noise — they are intentional steps between the formal scale tiers. Leave them local.

**4px and 6px radius.** `4px` is used throughout compact interactive controls (tabs, nav items, filter buttons, small chips). `6px` appears in analysis banners and some older components. Neither has an exact token equivalent. Folding them into `--radius` (5px) or `--radius-sm` (3px) would change every tab and nav item in the product. Leave them local until a visual decision is made.

**10px radius.** Used on `.sg-badge` and a few rounded chip elements. Sits between `--radius-lg` (8px) and `--radius-pill` (20px). No formal tier exists for it. Leave it local.

**Bespoke line-heights.** `1.35` (compact headings), `1.45` (slightly snug body), `1.55` (note entries, rule lists), `1.65` (monospace output), `1.68` (document prose reading measure). These are all calibrated to their specific reading contexts. Do not normalise them.

**Pixel-based letter-spacing.** `0.5px` on `.filter-panel-label-row` and `.ars-badge` is in pixel units, not em. The token system only contains em-based letter-spacing values. These cannot be replaced with a token — they are not equivalent. Leave them as literals.

**Extended letter-spacing values.** `0.08em`, `0.09em`, `0.10em`, and larger values (`1px`, `1.1px`, `1.2px`) appear in decorative label contexts where the extra tracking is part of the aesthetic intent. They are not candidates for `--label-tracking-sm` or `--label-tracking-md`. Leave them local.

**Stronger solid reds.** `#DC2626` and `#B91C1C` are used on the destructive confirm button as solid fill colours. `--error` (`#991B1B`) is a text-on-light colour and serves a different role. These should not be merged.

**Softer green pill backgrounds.** `#ECFDF5` is used for pill and tag fill backgrounds (apply decision, copy link confirmed, signal tag positive). It is lighter and mintier than `--success-bg` (`#D1FAE5`), which is used for admin banners and toasts. These are two distinct green tiers. Do not merge them.

**Asymmetric padding.** Some selectors use asymmetric padding (e.g. `.inbox-role` at `12px 14px 13px`) that serves specific alignment purposes. There is no token equivalent. Leave them local.

---

## 7. When to expand the system

Add a new token or formal pattern only when all of the following are true:

1. The value appears in at least three unrelated selectors across at least two different modules.
2. It serves a clear, nameable semantic role (not just "it's a common number").
3. There is a deliberate decision to add it — not just an observation that it recurs.
4. The decision is documented: the new token is added to `specs/rolewise-design-tokens-live.md` before any adoption pass begins.
5. An adoption pass is scoped and executed using the same inspection-first, value-preserving discipline as all prior passes.

Do not add a token because a value "almost" appears in three places, or because it would be tidier, or because a future component might use it. Add it when the pattern is already live and the adoption is ready to begin.

---

## 8. Claude working style

When doing UI work on RoleWise, follow these rules:

**Read-only preflight before any significant change.** Before editing CSS in a module, read the full selector set in scope. Do not begin editing until the current values are understood and a written plan exists.

**One job at a time.** Each session or task has a single named goal. Do not combine a typography pass with a radius pass. Do not combine two modules. Mixing concerns makes verification harder and makes regressions harder to isolate.

**Report exact selectors touched.** After each pass, state precisely which selectors were edited and what was changed in each one. Vague summaries ("cleaned up the Inbox styles") are not acceptable documentation.

**Report what was deliberately left alone.** For each pass, document which selectors were inspected and found to have no viable token match, and therefore preserved. This is as important as documenting what was changed.

**Do not widen scope silently.** If during a pass something outside the agreed scope looks like it needs attention, note it for a future task. Do not edit it in the current pass. Scope creep is how regressions happen.

**Do not improve unrelated UI while in a scoped pass.** A normalisation pass is not an opportunity to fix inconsistencies that were not in scope. If `.radar-*` is the scope, adjacent `.stats-*` selectors are not touched, even if they look similar and have obvious fixes. Note them instead.

**Prefer `var()` references in any new CSS you write.** New selectors written during feature work should use the live token set where it applies. Do not introduce fresh literals for values the token set already covers.

---

## 9. Definition of done

A UI cleanup or normalisation task is complete when all of the following are true:

- The scoped goal is fully complete — every selector in scope has been processed.
- No regressions were found in the post-pass read — every edited selector renders at the same computed value as before.
- All token substitutions are exact and value-preserving — no approximations, no rounding.
- Deferred items are clearly documented — every in-scope selector that was inspected and left unchanged has a recorded reason.
- The token reference (`rolewise-design-tokens-live.md`) reflects the current state — if new local exceptions were discovered, they are documented there.

A pass that is "mostly done" or "close enough" is not done.

---

## 10. Pre-edit checklist

Before making any UI change, run through this list:

- [ ] Have I read the selectors in scope and noted their current values?
- [ ] Does the value I need have an exact token match? If yes, am I using `var()`?
- [ ] If no token matches exactly, am I leaving the value as a local literal?
- [ ] Is this selector shared across multiple modules or views? If yes, have I checked all usages?
- [ ] Is my scope narrowly defined? Am I touching only the selectors I named upfront?
- [ ] Am I making value-preserving substitutions, not design changes?
- [ ] After editing, have I re-read the modified selectors to confirm correctness?
- [ ] Have I documented what was changed and what was deliberately left alone?
- [ ] If I noticed issues outside my scope, have I noted them separately rather than fixing them in-place?
- [ ] Is the task now complete by the definition above, or is there still work to finish?
