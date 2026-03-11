# RoleWise v2 Closeout Report

**Date**: 9 March 2026
**Scope**: 5 targeted fixes from the v2 completion audit (Bucket 1 items)

---

## Fix 1: Silent failure handling

**Audit item**: 1.8 — Error handling swallows failures silently in user-facing flows

**Root cause**: Critical save paths used `.catch(() => {})` or `catch (_) {}` — failures were logged to console but never surfaced to the user. A user could wait 10+ seconds for an analysis, have the `jd_matches.insert` fail, and see an empty card with no explanation.

**What was fixed**:

- **`jd_matches.insert` failure** (the most impactful): Now renders a visible amber warning bar below the timeline with the message "Analysis could not be saved. It is visible now but will be lost if you leave this page." Includes a "Retry save" button that re-attempts only the insert, with disabled state and success/failure feedback. On success, the warning is removed.

- **`wsAppendDecision` failure**: Now renders a transient 12-second warning near the timeline: "Decision could not be saved. Your choice is reflected here but may not persist." Auto-removes after 12 seconds to avoid clutter — the user has been notified and the decision is still reflected in the UI.

- **`wsRefreshDecisionHistory` failure**: Now prepends a `.ws-stale-note` to the existing decision history block: "Decision history may be out of date — reload to refresh." Does not duplicate if already present.

**CSS added**: `.ws-save-warning`, `.ws-save-warning-text`, `.ws-save-warning-retry`, `.ws-stale-note` — amber/yellow theme consistent with existing warning patterns.

**What remains**: Non-critical silent failures (ledger writes, signal extraction) were intentionally left silent as noted in the audit. The `_wsExtractAndStoreSignals` failure path (audit item 2.5) is a Bucket 2 concern — the pipeline needs end-to-end verification but the failure is non-blocking.

---

## Fix 2: Company name reliability

**Audit item**: 1.4 — 11 roles (19%) have no company name

**Root cause**: `extractJDMetadata()` runs client-side before AI analysis. If it fails to find a company name in the raw JD text, no backfill occurs — even though the AI analysis (`analysis._company` or the `role_summary` field) often extracts the company successfully. The company name was only set once, at the earliest (least reliable) stage.

**What was fixed**:

- **Workspace analysis path** (`_wsRunAnalysis`): After `callAnalysisAPI` returns, added a backfill step that checks `analysis._company` first, then falls back to parsing `analysis.role_summary` for an "at CompanyName" pattern. Uses `sanitiseCompanyName()` for validation (length ≥ 3, ≤ 4 words). Same logic also backfills `_title` from `analysis._roleTitle`.

- **Add JD modal path** (`saveRole`): Added the same backfill as "Step 2b" after `callAnalysisAPI`. If the AI found a company name that client-side extraction missed, updates the role record via `db.from('roles').update()`.

**What remains**: The 11 existing roles with NULL company names will not be retroactively fixed by this change — it only applies to new analyses. A one-time backfill migration could address historical data but was out of scope for this pass.

---

## Fix 3: Orphaned jd_matches

**Audit item**: 1.5 — 37 jd_matches rows (39%) have no role_id

**Root cause**: Identified via date distribution analysis. March 4 had 10/10 orphans (early development, before the save pipeline was fully wired). March 5 had 15/30 (transition period). March 6+ had much fewer (1–6 per day), caused by workspace temp-role race conditions where `jd_matches.insert` fires before the temp role is promoted to a real role. The `jd_matches.role_id` column is nullable (`IS_NULLABLE = 'YES'`), which allows orphans to persist.

**What was fixed**:

- **`_reconcileOrphanedMatches()`**: Added as a new function that runs once at app startup (after `refresh()`). It:
  1. Fetches all `jd_matches` rows where `role_id IS NULL`
  2. Builds a normalised `company_name::role_title` → `role_id` lookup from all roles
  3. Links orphans that match an existing role
  4. Deletes truly unrecoverable orphans (no output_json AND no company AND no title)
  5. Leaves orphans that have output but no match (may be from deleted roles or test data)

- **Wired to init**: `refresh().then(() => { _reconcileOrphanedMatches(); });`

**What remains**: The function is defensive (non-critical catch, console.warn only). Future orphans from temp-role race conditions will be caught on next app load. Making `role_id` NOT NULL would be a schema-level fix for later.

---

## Fix 4: Profile nav copy

**Audit item**: 1.2 — Profile nav says "coming soon"

**Root cause**: `NAV_EMPTY_STATES.profile` was set to `'Profile — coming soon'`. The actual profile/settings panel exists and works (display name, location, day rate, pension, CV management, working preferences). But if a user navigates to Profile before selecting a role, the empty state text shows "coming soon" — contradicting reality.

**What was fixed**: Changed `NAV_EMPTY_STATES.profile` from `'Profile — coming soon'` to `''` (empty string). The profile view renders its own content via `renderProfileView()` which is properly wired in `FULL_VIEWS`, so no empty state message is needed.

**Audit item resolved**: Yes — this was a one-line copy fix. The feature is complete; only the empty state label was wrong.

---

## Fix 5: CV content wiring

**Audit item**: 1.3 — CV versions have no content

**Root cause**: All 5 `cv_versions` rows have `cv_file_url` (PDF uploads in Supabase storage) but `cv_text = NULL`. Users upload PDFs rather than pasting text. The `loadCvVersions()` function didn't even select the `cv_text` column. The cover letter and CV alignment action card prompts (`_buildCoverLetterPrompt`, `_buildCvAlignmentPrompt`) referenced only analysis data (what_they_are_really_looking_for, responsibilities, risks). The chat brain received zero personal context about the user's background or CV.

**What was fixed**:

- **`loadCvVersions()` select**: Added `cv_text` to the query so pasted text is loaded if it exists.

- **`_wsTriggerChat` context**: Added a `user_background` field sourced from `userProfile.role_preference_note` (the "What I want from a role" free-text field in Profile). Also added a DB query for the default CV's `cv_text` and `notes` — if `cv_text` is populated, it's sent as `context.cv_summary` (truncated to 1500 chars); if only `notes` exist, sent as `context.cv_notes`. Non-critical — wrapped in try/catch so chat works even if the query fails.

- **`_buildCoverLetterPrompt`**: Now includes the user's `role_preference_note` in the prompt and instructs the chat brain to "weave it naturally into the letter" if available.

- **`_buildCvAlignmentPrompt`**: Now includes the user's `role_preference_note` and instructs the chat brain to "tailor suggestions to their actual experience" if available.

**What remains**: The fundamental gap is that CV content is in PDFs, not text. A proper solution would extract text from uploaded PDFs at upload time (e.g., via a `pdf-extract` edge function) and populate `cv_text`. That's a new feature, not a wiring fix. For now, the user's `role_preference_note` provides the personal context the chat brain needs, and if a user ever pastes CV text, it will be wired through correctly.

---

## Summary

| Fix | Audit item | Status | Stale? |
|-----|-----------|--------|--------|
| Silent failures | 1.8 | Fixed — 3 critical paths now surface visible warnings | No — actively broken |
| Company name | 1.4 | Fixed — AI backfill on both save paths | No — 19% of roles affected |
| Orphaned jd_matches | 1.5 | Fixed — startup reconciliation + cleanup | Partially stale — mostly early-dev debris, but ongoing temp-role race still creates orphans |
| Profile nav copy | 1.2 | Fixed — removed misleading "coming soon" | No — visible to users |
| CV content wiring | 1.3 | Fixed — user background + CV notes now in chat context | Root cause was design gap (PDFs not text), not broken wiring |

### Remaining Bucket 1 items not addressed in this pass

| Item | Why not addressed |
|------|-------------------|
| 1.1 Auth | Explicitly excluded — separate public-release track |
| 1.6 TEMP backfill | Low risk — runs harmlessly, should be a cleanup migration |
| 1.7 Admin dedup notice | Cosmetic — either implement dedup or remove the notice |

### What true v2 completion still needs

1. **Auth** — the single biggest gap. Everything else works as a single-user tool.
2. **TEMP backfill removal** — run once as migration, delete the runtime code.
3. **Admin dedup notice** — either implement basic dedup using `radar_match_key` or remove the notice.
4. **Historical company name backfill** — 11 existing roles still have NULL company. A one-time script could attempt extraction from stored `jd_matches.output_json`.
