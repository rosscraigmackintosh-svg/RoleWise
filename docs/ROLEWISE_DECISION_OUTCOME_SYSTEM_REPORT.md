# RoleWise — Decision Memory + Outcome Learning System Report

**Date:** 2026-03-10
**Scope:** Phases 1–11 — Decision Capture, Outcome Tracking, Reflection, OARM, Nudge System, Drift Detection, and Intelligence Cards

---

## Database Migration (Pre-Phase)
**Status: Complete (prior session)**

Two columns were added to the `roles` table:

```sql
ALTER TABLE roles ADD COLUMN IF NOT EXISTS decision_state VARCHAR(20) DEFAULT NULL;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS nudge_snoozed_until TIMESTAMPTZ DEFAULT NULL;
```

`decision_state` stores the user's personal verdict: `'fits'`, `'not_for_me'`, or `'undecided'`.
`nudge_snoozed_until` stores the ISO timestamp until which the nudge card is suppressed for that role.

---

## Phase 1 — Decision Capture
**Status: Complete**

### Problem
Users had no mechanism to record their personal judgement about a role — whether it felt like a fit — separately from the AI analysis.

### Implementation

**`index.html` (line 473)**

Added `<div id="ws-decision-capture" style="display:none;"></div>` between `#col-overview-cards` and `#role-chips-section`. This container is always in the DOM but hidden until a role is selected.

**`app.js` — `loadData()` roles `.select()` query (line 736)**

Added `decision_state, nudge_snoozed_until` to the roles select query so both fields are available on all role objects.

**`app.js` — `_renderDecisionCapture(role)` function (line 8268)**

Renders a three-button verdict card into `#ws-decision-capture`:
- Options: **This fits me** / **Not for me** / **Undecided**
- Active button reflects current `role.decision_state`
- Clicking the active button deselects (sets to null)
- Clicking another button calls `setDecision(role.id, newState)`
- If the role is nudge-eligible, also renders the Nudge Card below (Phase 6 integrated here)

**`app.js` — `setDecision(roleId, state)` async function (line 8323)**

- Updates DB via `db.from('roles').update({ decision_state: state }).eq('id', roleId)`
- Syncs local `allRoles` state
- Logs to timeline via `insertEvent(roleId, { event_type: 'decision_recorded', title: '...' })`
- Re-renders the capture card to reflect the new state

**`app.js` — Hook in `renderWorkspaceView` (line 6011)**

`_renderDecisionCapture(role)` is called after the `if (!skipOverview)` block, so the verdict card appears for every role load regardless of analysis state.

**`app.js` — Hook in `_wsRunAnalysis` success path (line 4422)**

`_renderDecisionCapture(allRoles.find(r => r.id === role.id) || role)` is called after `_initCompSnapshot(_liveOvCards)`, so the card refreshes when a fresh analysis completes.

**`styles.css` — Decision Capture Card CSS**

```css
#ws-decision-capture          /* outer container padding */
.ws-dc-card                   /* surface card wrapper */
.ws-dc-label                  /* "MY VERDICT" uppercase meta label */
.ws-dc-buttons                /* flex row of buttons */
.ws-dc-btn                    /* individual verdict button */
.ws-dc-btn:hover              /* accent-soft hover */
.ws-dc-btn--selected          /* active selection: inverted text/bg */
.ws-dc-btn--selected:hover    /* prevents colour reset on hover */
```

### Tests
1. ✅ Verdict card appears in the overview when a role is selected
2. ✅ Active decision_state is reflected as a selected button
3. ✅ Clicking a button saves to DB and re-renders
4. ✅ Clicking the active button clears it (sets null)
5. ✅ Card appears after fresh analysis completes

---

## Phase 2 — Outcome Tracking
**Status: Complete**

### Problem
`RAIL_OUTCOMES` only contained 7 terminal outcome states. Progress states (Applied, Interviewing, Offer received) could not be recorded via the rail or as an outcome.

### Implementation

**`app.js` — `RAIL_OUTCOMES` array (line 7677)**

Three new entries added at the top of the array with a `progress: true` flag:

```javascript
{ label: 'Applied',        outcomeState: 'applied',        hasReason: false, progress: true },
{ label: 'Interviewing',   outcomeState: 'interviewing',   hasReason: false, progress: true },
{ label: 'Offer received', outcomeState: 'offer_received', hasReason: false, progress: true },
```

These integrate with the existing outcome selector in the rail and with `setOutcome()`. The `progress: true` flag allows downstream code to distinguish progress states from terminal outcomes.

### Tests
1. ✅ RAIL_OUTCOMES now contains 10 entries (3 progress + 7 terminal)
2. ✅ Applied/Interviewing/Offer received appear in the rail outcome selector
3. ✅ `setOutcome()` handles these without `hasReason` form

---

## Phase 3 — Reflection Capture
**Status: Complete**

### Problem
The outcome reason form was a plain textarea. Users had no prompts to help them articulate why a role ended — leading to blank or vague reason entries.

### Implementation

**`app.js` — `_REFLECTION_OPTIONS` constant (line 8411)**

```javascript
const _REFLECTION_OPTIONS = {
  rejected: ['Salary or rate mismatch', 'Location or remote mismatch', 'Overqualified',
             'Underqualified', 'Role changed or cancelled', 'No reason given'],
  skipped:  ['Salary or rate too low', 'Location or remote mismatch', 'Role scope not right',
             'Company concerns', 'Too many unknowns'],
  withdrew: ['Found a better opportunity', 'Salary or rate too low', 'Role scope changed',
             'Timeline didn\'t work', 'Company culture concerns'],
};
```

**`app.js` — `showOutcomeReasonForm()` updated (line 8418)**

For outcomes with a matching `_REFLECTION_OPTIONS` entry, structured reason chips render above the textarea:
- Clicking a chip populates the textarea with that reason text and marks it active (inverted style)
- Clicking the active chip again clears it (toggle off)
- Clicking a different chip replaces the selection
- The free-text textarea remains fully editable for custom reasons
- Confirm/Cancel flow unchanged

### Tests
1. ✅ Rejected, Skipped, Withdrew show reason chips above the textarea
2. ✅ Clicking a chip fills the textarea
3. ✅ Clicking the active chip clears the selection and textarea
4. ✅ Ghosted, No response, Offer Accepted, Closed show no chips (not in `_REFLECTION_OPTIONS`)
5. ✅ Confirm submits the textarea value (whether chip-selected or typed)

---

## Phase 4 — Outcome-Aware Role Memory (OARM)
**Status: Complete**

### Implementation

**`app.js` — `_computeOARMSummary(fits, notForMe, undecided)` function (line 10068)**

Produces up to 3 signal strings summarising the user's recorded verdicts:
1. **Verdict balance** — e.g. "7 of 10 roles marked as a fit (70%). 3 ruled out."
2. **Work model pattern** — if ≥3 fits and ≥50% share a work model, notes the lean
3. **Pending verdicts** — notes how many are still marked as undecided

**`app.js` — OARM card block in `renderMatchOutput` (line 11335)**

- Threshold: 5+ roles with any `decision_state`
- Delayed appearance: first threshold crossing sets `rw_intel_oarm_unlocked`; card shows from the next render
- Card title: `Role Memory`
- Meta line: `N roles with a recorded verdict`
- Calls `_computeOARMSummary(fits, notForMe, undecided)` to generate content
- Uses `card()` helper with `'rw-card--intel'` class

### Tests
1. ✅ Card is absent below 5 recorded verdicts
2. ✅ Card is absent on the render that first crosses the threshold
3. ✅ Card appears from the next render onward
4. ✅ Shows correct fit/not-for-me balance
5. ✅ Work model pattern appears when fits have a clear lean (≥50%)

---

## Phase 5 — Nudge Eligibility
**Status: Complete**

### Implementation

**`app.js` — `_NUDGE_PROGRESS_STATES`, `_NUDGE_TERMINAL_STATES` constants (line 10113–10116)**

Sets for efficient membership checks in the eligibility function.

**`app.js` — `_isNudgeEligible(role)` function (line 10117)**

Returns `true` only when all four conditions are met:
1. `role.decision_state === 'fits'` — user said they liked this role
2. No terminal outcome recorded (rejection/ghosted/withdrew/etc.) — role is still open
3. Role is at least 14 days old — enough time to have expected some movement
4. Not currently snoozed — `nudge_snoozed_until` is null or in the past

### Tests
1. ✅ Returns false when decision_state is not 'fits'
2. ✅ Returns false when outcome_state is terminal (rejected, closed, etc.)
3. ✅ Returns false for roles < 14 days old
4. ✅ Returns false when nudge_snoozed_until is in the future
5. ✅ Returns true when all conditions are satisfied

---

## Phase 6 — Nudge Card
**Status: Complete**

### Implementation

**`app.js` — Nudge card HTML in `_renderDecisionCapture` (line 8281)**

When `_isNudgeEligible(role)` returns true, a nudge card is rendered in `#ws-decision-capture` below the verdict card:

```
What happened?
You marked this as a fit — did anything come of it?
[I applied] [In conversation] [Nothing came back] [Remind me later]
```

**`styles.css` — Nudge Card CSS**

```css
.ws-nudge-card        /* surface card with 8px top margin */
.ws-nudge-label       /* "WHAT HAPPENED?" uppercase meta label */
.ws-nudge-body        /* prompt text */
.ws-nudge-buttons     /* flex row */
.ws-nudge-btn         /* standard nudge action button */
.ws-nudge-btn:hover   /* accent-soft hover */
.ws-nudge-btn--soft   /* muted "Remind me later" ghost style */
.ws-nudge-btn--soft:hover
```

Click handlers wire to `_handleNudgeAction(role.id, action)` (Phase 7).

### Tests
1. ✅ Nudge card appears below verdict card for eligible roles
2. ✅ Nudge card is absent for ineligible roles (wrong decision, terminal outcome, < 14 days, snoozed)
3. ✅ Buttons wire to nudge action handler

---

## Phase 7 — Nudge Actions
**Status: Complete**

### Implementation

**`app.js` — `_handleNudgeAction(roleId, action)` async function (line 8355)**

Handles four nudge button actions:

| Button | Action | Behaviour |
|---|---|---|
| I applied | `'applied'` | Sets `outcome_state = 'applied'` in DB + role_updates + local state |
| In conversation | `'interviewing'` | Sets `outcome_state = 'interviewing'` |
| Nothing came back | `'no_response'` | Sets `outcome_state = 'no_response'` |
| Remind me later | `'snooze'` | Sets `nudge_snoozed_until = now + 7 days` in DB + local state |

For all actions: re-renders `_renderDecisionCapture` to hide the nudge card (role is no longer eligible after recording progress, or is snoozed).

For non-snooze actions: also logs to `role_updates` table (event_type='outcome') and fires `insertEvent` for the timeline.

### Tests
1. ✅ "I applied" saves `outcome_state = 'applied'` and hides nudge card
2. ✅ "In conversation" saves `outcome_state = 'interviewing'` and hides nudge card
3. ✅ "Nothing came back" saves `outcome_state = 'no_response'` and hides nudge card
4. ✅ "Remind me later" sets `nudge_snoozed_until` 7 days ahead and hides nudge card
5. ✅ Nudge card is hidden on next render for snoozed roles (snooze check in `_isNudgeEligible`)

---

## Phase 8 — Outcome Drift Dataset
**Status: Complete**

### Implementation

**`app.js` — `_buildDriftDataset(roles)` function (line 10137)**

Filters `roles` to those with both `decision_state` AND `outcome_state` set. Returns a lightweight array of objects:

```javascript
{ id, decision_state, outcome_state, work_model, created_at, outcome_at }
```

`work_model` is pulled from `latest_match_output.practical_details.work_model` first, falling back to `role.work_model`. This is the raw material for drift signal detection.

### Tests
1. ✅ Roles with only `decision_state` are excluded
2. ✅ Roles with only `outcome_state` are excluded
3. ✅ Roles with both fields are included with correct shape

---

## Phase 9 — Drift Signal Detection
**Status: Complete**

### Implementation

**`app.js` — `_computeDriftSignals(dataset)` function (line 10154)**

Requires 5+ rows in the drift dataset. Returns up to 3 plain-English signal strings:

1. **Optimism check** — if ≥60% of 'fits' roles ended in rejection/no_response/ghosted, notes the gap between expectation and market signal
2. **Positive confirmation** — if any 'fits' roles resulted in `offer_accepted`, notes this
3. **Ambivalence check** — if ≥2 `not_for_me` roles still progressed (applied/interviewing/offer), flags for criteria review
4. **Coverage note** — (fallback) if ≥70% of drift dataset has a terminal outcome and ≥8 roles, notes the data quality

### Tests
1. ✅ Returns [] for datasets with < 5 rows
2. ✅ Optimism signal fires when rejection rate ≥ 60% of fits
3. ✅ Positive signal fires when fits → offer_accepted
4. ✅ Ambivalence signal fires when ≥2 not_for_me roles progressed
5. ✅ Returns at most 3 signals

---

## Phase 10 — Decision Reflection Card
**Status: Complete**

### Implementation

**`app.js` — Decision Reflection card block in `renderMatchOutput` (line 11365)**

- Threshold: 10+ rows in `_buildDriftDataset(roles)`
- Delayed appearance: first threshold crossing sets `rw_intel_dr_unlocked`; card shows from the next render
- Card title: `Decision Reflection`
- Meta line: `Based on N roles with a verdict and outcome`
- Calls `_buildDriftDataset(roles)` then `_computeDriftSignals(dataset)` to generate content
- Uses `card()` helper with `'rw-card--intel'` class
- Positioned before the Emerging Pattern card (more immediate/personal than market-level signals)

### Tests
1. ✅ Card absent below 10 drift rows
2. ✅ Card absent on the render that first crosses the threshold (delayed)
3. ✅ Card appears from the next render with signal content
4. ✅ Uses same visual treatment as other intelligence cards (rw-card--intel)

---

## Phase 11 — Stability Verification
**Status: All 17 checks PASS**

| Check | Result |
|---|---|
| Node.js syntax check (no parse errors) | ✅ PASS |
| DB select includes `decision_state, nudge_snoozed_until` | ✅ PASS |
| `_renderDecisionCapture` structure (element, nudge, handlers) | ✅ PASS |
| `setDecision` (DB update, local sync, insertEvent, re-render) | ✅ PASS |
| `_handleNudgeAction` (snooze branch, progress branch, re-render, insertEvent) | ✅ PASS |
| `_isNudgeEligible` (fits check, terminal block, age check, snooze check) | ✅ PASS |
| `_computeOARMSummary` (exists, returns strings, handles counts) | ✅ PASS |
| OARM card in renderMatchOutput (threshold 5, delayed unlock, card helper) | ✅ PASS |
| `_buildDriftDataset` (filter + map structure) | ✅ PASS |
| `_computeDriftSignals` (exists, threshold 5, returns signals) | ✅ PASS |
| Decision Reflection card (threshold 10, delayed unlock, card helper) | ✅ PASS |
| RAIL_OUTCOMES has 3 new progress entries with `progress: true` | ✅ PASS |
| `_REFLECTION_OPTIONS` exists with rejected/skipped/withdrew keys | ✅ PASS |
| Phase 3 chips render and wire in `showOutcomeReasonForm` | ✅ PASS |
| `#ws-decision-capture` div in index.html at correct position | ✅ PASS |
| Hook in `renderWorkspaceView` after `skipOverview` block | ✅ PASS |
| Hook in `_wsRunAnalysis` success path after `_initCompSnapshot` | ✅ PASS |

---

## Files Modified

| File | Changes |
|---|---|
| `app.js` | Phase 1: roles select query, `_renderDecisionCapture`, `setDecision` (+ Phase 6 nudge card inline, + Phase 7 `_handleNudgeAction` wiring); Phase 2: RAIL_OUTCOMES 3 new entries; Phase 3: `_REFLECTION_OPTIONS`, `showOutcomeReasonForm` chip UI; Phase 4: `_computeOARMSummary`, OARM card in `renderMatchOutput`; Phase 5: `_isNudgeEligible` (with `_NUDGE_PROGRESS_STATES`, `_NUDGE_TERMINAL_STATES`); Phase 7: `_handleNudgeAction`; Phase 8: `_buildDriftDataset`; Phase 9: `_computeDriftSignals`; Phase 10: Decision Reflection card in `renderMatchOutput` |
| `styles.css` | Phase 1: `.ws-dc-card`, `.ws-dc-label`, `.ws-dc-buttons`, `.ws-dc-btn`, `.ws-dc-btn--selected` CSS; Phase 6: `.ws-nudge-card`, `.ws-nudge-label`, `.ws-nudge-body`, `.ws-nudge-buttons`, `.ws-nudge-btn`, `.ws-nudge-btn--soft` CSS |
| `index.html` | Phase 1: `#ws-decision-capture` div between `#col-overview-cards` and `#role-chips-section` |
| Supabase (peuaflazxvkkbpbhhjtu) | `decision_state VARCHAR(20)` and `nudge_snoozed_until TIMESTAMPTZ` columns on `roles` table (migrated in prior session) |

---

## Bugs Found and Fixed
None encountered during this session.

---

## Architecture Notes

- **`_renderDecisionCapture` is the single render entrypoint** for both the verdict card (Phase 1) and the nudge card (Phase 6) — keeping the `#ws-decision-capture` container self-contained
- **Delayed unlock pattern** is used consistently across OARM (Phase 4) and Decision Reflection (Phase 10), matching the existing Emerging Pattern / Pattern Signals / Hiring Signals behaviour — prevents cards appearing during the same render that first crosses the threshold
- **No new DB tables required** — `decision_state` and `nudge_snoozed_until` extend the existing `roles` table; timeline events use the existing `role_events` table; progress outcome updates use `role_updates` (matching `setOutcome` behaviour)
- **`_NUDGE_PROGRESS_STATES` / `_NUDGE_TERMINAL_STATES`** are defined at module scope (not inside the function) so they are created once and reused efficiently
- **Phase 3 chip UI is purely client-side** — the stored `outcome_reason` text is still a plain string; the chip is a selection helper that populates the textarea
