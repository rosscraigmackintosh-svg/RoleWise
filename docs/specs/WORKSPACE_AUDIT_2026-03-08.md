# RoleWise Workspace — Code Audit Report
**Date:** 2026-03-08
**Scope:** Read-only. `app.js` reviewed at current HEAD. No code was modified.
**Coverage:** `_wsRunAnalysis`, `_doSave`, `renderWorkspaceView`, `wsLoadMemory`, restore loop, `_wsHandlePaste`, `_wsDetectStageSignal`, `_wsHandleStageSignal`, `_wsAdvanceStage`, `_wsHandleEmail`, `extractRecruiterFromEmail`, `_wsLinkRecruiterFromEmail`.

---

## 1. Analysis Pipeline

**Status: CONFIRMED — matches expected behaviour**

### Phase separation

Phase 1 (metadata extraction + `callAnalysisAPI`) is clearly delimited at line 2278. It runs inside its own `try/catch`. A failure here renders a "Retry analysis" button that calls `_wsRunAnalysis()` directly, which is correct — the entire analysis must re-run because the AI step never completed.

Phase 2 (`_doSave`) begins at line 2346 with the comment marking it as the save/promotion block. Only DB writes live here.

### Artefact render before DB write

Confirmed. The analysis artefact is rendered at line 2343 (`_wsAppend(timelineEl, _wsAnalysisArtefactHtml(...))`) before `_doSave()` is called at line 2424. The artefact uses a `local-{timestamp}` placeholder ID so it is visible immediately.

### Retry logic

The save-error path (lines 2426–2448) shows an error message and attaches a click handler that calls `await _doSave()` directly. It does NOT call `_wsRunAnalysis()`. This is correct.

### Error message text

The exact string rendered on save failure (line 2432) is:

> "Analysis completed, but we couldn't save this role yet."

The button reads "Try saving again", not "Retry analysis", which correctly signals to the user that re-analysis is not required.

### Role not created until successful save

`allRoles.unshift()` and `renderInbox()` are called inside `_doSave()`, inside the `if (role._isTemp)` block, only after `roles.insert` succeeds and `createErr` does not throw (line 2368–2369). If `createErr` is truthy, the function throws at line 2360 and never reaches the inbox render. The role does not appear in the list until promotion is complete. ✅

---

## 2. Workspace Restore Logic

**Status: CONFIRMED — all four streams present with one flag on stage filter semantics**

### `hasHistory` check

Located at lines 2855–2859:

```js
const hasHistory = memory && (
  memory.conversations.length > 0 ||
  memory.artifacts.length > 0 ||
  memory.interactions.length > 0
);
```

All three relevant tables are included. `memory.insights` is intentionally excluded — insights are not rendered in the timeline, so their presence alone should not suppress the blank state.

### Four-stream merge

All four streams are present in the restore loop (lines 2911–2927):

- `memory.conversations` → source cards and chat bubbles
- `memory.artifacts` → analysis / preparation / thoughts artefact blocks
- `memory.interactions` → compact interaction event lines
- `role.role_updates` → stage-advance dividers

The array is sorted chronologically with `timeline.sort((a, b) => a.t - b.t)` at line 2929. ✅

### `recruiter_email` skip

Line 2919 explicitly skips interactions where `interaction_type === 'recruiter_email'`. This prevents a duplicate event line from appearing alongside the source card that the conversations stream already renders. ✅

### Stage events from `role.role_updates`

Confirmed. The restore loop reads from `role.role_updates`, not from a separate DB call. This means stage data is whatever was fetched at `loadData()` time, consistent with the rest of the rail. ✅

### Flag: Stage filter guard semantics

The condition used to filter stage rows in the restore loop (line 2924) is:

```js
if (upd.event_type && upd.event_type !== 'stage') continue;
```

This guard skips rows whose `event_type` is a non-`stage` string (e.g., outcome rows). However, rows where `event_type` is `null` or `undefined` are **not** skipped by this condition — they would pass through to the next guard (`if (!upd.stage_reached) continue`). A legacy row with `event_type = null` and a non-null `stage_reached` would render as a stage divider.

The identical pattern appears in `currentStageIndex()` at line 4378, so both functions behave consistently. This appears to be an intentional backward-compatibility accommodation for legacy rows. If the DB contains any such rows, they will affect both stage calculation and timeline rendering in the same way, which is internally consistent.

---

## 3. Recruiter Email Ingestion

**Status: CONFIRMED — all functions exist and are wired correctly**

### Function presence

- `extractRecruiterFromEmail` — defined at line 8000
- `_wsHandleEmail` — defined at line 2771
- `_wsLinkRecruiterFromEmail` — defined at line 2697

### Wiring in `_wsHandlePaste`

`_wsHandlePaste` classifies content type at line 2454. When `type === 'email'`, it calls `_wsHandleEmail(role, text, timelineEl)` at line 2490 and returns early. The source card and `wsAddMessage` are both handled by `_wsHandlePaste` before the email-specific branch, so `_wsHandleEmail` only handles extraction logic, as documented. ✅

### Confidence routing

Inside `_wsHandleEmail`:

- **No useful signal** (lines 2785–2789): shows a generic "Recruiter email captured." status, no DB write.
- **Temp role** (lines 2793–2798): stores extracted data in `role._pendingRecruiter`, shows a status message, returns.
- **High confidence** (lines 2802–2820): calls `_wsLinkRecruiterFromEmail` silently.
- **Medium confidence** (lines 2824–2840): appends a confirmation prompt (`_wsRecruiterConfirmHtml`). "Yes" triggers `_wsLinkRecruiterFromEmail`; "No" removes the prompt.

All four paths are implemented. ✅

### Pending recruiter promotion

`role._pendingRecruiter` is stored during temp state (line 2794). Inside `_doSave()`, after the role is promoted and `role._isTemp` is set to `false`, lines 2381–2385 check for `_pendingRecruiter` and fire `_wsLinkRecruiterFromEmail` immediately. The pending value is cleared on both success and failure. ✅

### De-duplication

`_wsLinkRecruiterFromEmail` checks for an existing `role_recruiters` entry with the same email before creating a new link (lines 2703–2710). It returns `{ linked: false, reason: 'already_linked' }` if a duplicate is found. ✅

### Note: recruiter_email interaction for temp roles

`wsAddInteraction` for `recruiter_email` is guarded by `if (!role._isTemp)` at line 2773. If a recruiter email is pasted before analysis completes (while the role is still temp), the interaction row is **never** written to `role_interactions` — not during the email paste, and not during promotion. The recruiter link itself is created correctly, but the interaction log has no `recruiter_email` entry for that event. This is a known limitation rather than a wiring error.

---

## 4. Stage Signal Detection

**Status: CONFIRMED — all three functions present and wired inside `_wsHandlePaste`**

### Function presence

- `_wsDetectStageSignal` — defined at line 2535
- `_wsHandleStageSignal` — defined at line 2651
- `_wsAdvanceStage` — defined at line 2600

### Wiring

All three are invoked from inside the `if (!role._isTemp)` block in `_wsHandlePaste` (lines 2498–2506):

```js
const _stageSignal = _wsDetectStageSignal(text);
if (_stageSignal) {
  await _wsHandleStageSignal(role, text, _stageSignal, timelineEl);
  return;
}
```

The early `return` prevents prep/thoughts intent from firing on the same message. ✅

### Detection coverage for given examples

- "Recruiter call tomorrow" — matches `_wsDetectStageSignal` via `/\brecruiter\s+(call|screen|chat|interview)\b/i` → `{ type: 'recruiter_call', stage: 'Recruiter Screen', confidence: 'high' }` ✅
- "Interview booked next week" — `\binterview\b` + `_hasSched` (`booked`) → `{ type: 'interview', stage: null, confidence: 'medium' }` ✅
- "Final round scheduled" — matches `/\bfinal\s+(round|stage|interview|call)\b/i` → `{ type: 'interview', stage: 'Final', confidence: 'high' }` ✅

### Signal flow in `_wsHandleStageSignal`

1. In-session 5-second de-dupe check using `role._lastSignalTime` keyed by `type:stage`. ✅
2. `wsAddInteraction` called to persist the interaction (fire-and-forget with `.catch`). ✅
3. `_wsAppend(timelineEl, _wsInteractionEventHtml(...))` renders the compact event inline. ✅
4. If `confidence === 'high'` and `signal.stage` is non-null, `_wsAdvanceStage` is called. ✅

### Stage regression prevention

`_wsAdvanceStage` compares `detectedIdx` against `currentIdx` at line 2604:

```js
if (detectedIdx <= currentIdx) return;
```

This prevents same-stage re-entry and all backward moves. ✅

### Prep artefact refresh

After advancing the stage, `_wsAdvanceStage` loads memory and checks for an existing preparation artefact (lines 2642–2647). If one exists, it calls `_wsTriggerPrep(role, timelineEl)`. ✅

---

## 5. Workspace Gating

**Status: CONFIRMED — temp workspace correctly blocks Prepare, Thoughts, and stage signals**

### Action buttons (Prepare / Thoughts)

The `ws-chat-actions` container is rendered with `ws-actions-hidden` when `role._isTemp` is true (line 2866):

```js
<div class="ws-chat-actions${role._isTemp ? ' ws-actions-hidden' : ''}">
```

After promotion, `document.querySelector('.ws-chat-actions')?.classList.remove('ws-actions-hidden')` is called inside `_doSave()` at line 2377. ✅

### Stage signals, prep intent, thought intent

All three intent checks in `_wsHandlePaste` are inside an `if (!role._isTemp)` block (lines 2498–2510). For temp roles, the code falls through to the `return` at line 2511 for non-JD content. ✅

### JD analysis for temp roles

`_wsRunAnalysis` runs regardless of `_isTemp` — this is correct. Analysis is the action that creates the role record, so it must be permitted in temp state.

---

## 6. Potential Risks

### R1 — Duplicate analysis artefact on re-analysis of existing roles *(medium)*

`wsAddArtifact('analysis', ...)` inside `_doSave` has no guard against an existing analysis artefact for the role. For **temp → promoted** roles, this is not an issue because `_doSave` can only succeed once (after success, `role._isTemp` is false, and the only throw in `_doSave` occurs before `wsAddArtifact` is reached, so the retry path cannot trigger a second write).

However, for **existing (already saved) roles**, pasting a second JD triggers `_wsRunAnalysis` a second time, which calls `_doSave` a second time, which fires `wsAddArtifact` a second time. This creates a second `role_artifacts` row. On next restore, both analysis artefacts render chronologically. Whether this is the intended "re-analysis" behaviour is not documented.

### R2 — Concurrent prep artefact writes *(low)*

`_wsAdvanceStage` calls `_wsTriggerPrep` after a stage advance. If the user also clicks the Prepare button at roughly the same time (or rapid consecutive stage signals both advance), two concurrent `_wsTriggerPrep` calls could run. Both would find the same `existing` artifact, call `wsUpdateArtifact`, and then try to replace the same DOM node. The second DOM replacement would succeed (same artifact ID), so visual output remains correct — but two DB writes for the same artifact would occur within milliseconds. No corruption risk, but it is wasteful.

### R3 — Initial JD message not persisted to `role_conversations` for new roles *(low)*

`wsAddMessage` is skipped for temp roles (line 2458). `_doSave` does not back-fill the initial JD paste into `role_conversations` after promotion. The JD text is saved to `roles.job_description_raw` and `jd_matches.jd_text_raw`, but there is no source card from `role_conversations` on restore. The **analysis artefact** will still render (from `role_artifacts`), but the JD source card will be absent on re-open. This means the timeline for a freshly created role looks slightly different on first open vs. on re-open.

### R4 — Stage filter null `event_type` rows *(low / legacy)*

As noted in Section 2, the stage filter guard `if (upd.event_type && upd.event_type !== 'stage') continue` passes through rows with a null `event_type`. If any legacy `role_updates` rows in the DB have `event_type = null` with a non-null `stage_reached`, they will render as stage dividers. This is consistent with `currentStageIndex()` but may surface unexpected dividers for old data.

### R5 — `recruiter_email` interaction gap for temp-state email pastes *(informational)*

Described in Section 3. An email pasted before the role is promoted never generates a `role_interactions` row. The recruiter link and the conversation message are both created correctly, but the interaction log is incomplete for that event.

### R6 — No cross-session deduplication for stage signals *(informational)*

The 5-second de-dupe in `_wsHandleStageSignal` operates on an in-memory `role._lastSignalTime` map. It resets on page reload. If a user closes and reopens the workspace and pastes the same stage signal text again, it will be logged again and could re-trigger `_wsAdvanceStage`. The forward-only guard in `_wsAdvanceStage` would prevent an actual stage regression, but a duplicate `role_interactions` row and a redundant stage divider would be added to the timeline.

---

## Summary

| Area | Expected Behaviour | Status |
|---|---|---|
| Analysis pipeline — two phases | Phase 1 (AI), Phase 2 (DB) | ✅ Confirmed |
| Artefact rendered before DB write | Yes | ✅ Confirmed |
| Save-error retry calls `_doSave()` | Not `_wsRunAnalysis` | ✅ Confirmed |
| Save-error message text | "…couldn't save this role yet" | ✅ Confirmed |
| Role not in list until saved | `renderInbox` inside `_doSave` | ✅ Confirmed |
| `hasHistory` includes interactions | Yes | ✅ Confirmed |
| `recruiter_email` skipped in restore | Yes, line 2919 | ✅ Confirmed |
| Stage events from `role_updates` | Yes | ✅ Confirmed |
| All 4 streams merged chronologically | Yes | ✅ Confirmed |
| `extractRecruiterFromEmail` exists | Yes, line 8000 | ✅ Confirmed |
| `_wsHandleEmail` wired | Yes, from `_wsHandlePaste` | ✅ Confirmed |
| `_wsLinkRecruiterFromEmail` wired | Yes, inside `_wsHandleEmail` | ✅ Confirmed |
| High confidence → silent link | Yes | ✅ Confirmed |
| Medium confidence → prompt | Yes | ✅ Confirmed |
| Temp role → `_pendingRecruiter` | Yes | ✅ Confirmed |
| Pending recruiter linked on promotion | Yes, inside `_doSave` | ✅ Confirmed |
| `_wsDetectStageSignal` wired | Yes, inside `_wsHandlePaste` | ✅ Confirmed |
| `_wsHandleStageSignal` wired | Yes | ✅ Confirmed |
| `_wsAdvanceStage` wired | Yes, from `_wsHandleStageSignal` | ✅ Confirmed |
| Forward-only stage advance | `detectedIdx <= currentIdx → return` | ✅ Confirmed |
| Prep refresh after stage advance | Yes, checks for existing artefact | ✅ Confirmed |
| Temp blocks Prepare/Thoughts buttons | `ws-actions-hidden` class | ✅ Confirmed |
| Temp blocks stage signals | `if (!role._isTemp)` guard | ✅ Confirmed |
| Duplicate analysis on re-analysis | No guard for existing roles | ⚠️ R1 |
| Concurrent prep writes | Possible, low risk | ⚠️ R2 |
| Initial JD absent from restore timeline | No back-fill in `_doSave` | ⚠️ R3 |
