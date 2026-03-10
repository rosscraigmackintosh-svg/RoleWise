# RoleWise v2 Completion Audit

**Audited**: 9 March 2026
**Scope**: Full end-to-end review of app.js (20,217 lines), 7 edge functions, 29 DB tables, 50 migrations

---

## Bucket 1: Must Fix Before v2 Is Complete

### 1.1 — Auth is absent

There is no authentication layer. The Supabase client uses the anon key with `persistSession: false`. No login flow, no sign-up, no session management. Every query hits the DB unscoped — any user on the URL sees all data. RLS policies exist on some tables but are not enforced through the client. This is the single biggest gap between "working prototype" and "shippable product."

**What it blocks**: Multi-user support, data privacy, any form of deployment beyond personal use.

### 1.2 — Profile nav says "coming soon"

`NAV_EMPTY_STATES.profile` is set to "Profile — coming soon" (line 15481). The actual settings panel exists and works (display name, location, day rate, pension, CV, working preferences). But if a user navigates to Profile before selecting a role, they see the "coming soon" text. The wording needs to match reality.

### 1.3 — CV versions have no content

All 5 `cv_versions` rows in the DB have `content_text = NULL`. The schema has this column but the save path appears to store CV text in a different flow. If the cover letter and CV alignment actions reference the user's CV, they're pulling nothing. Verify which column actually holds CV text and ensure the save pipeline populates it.

### 1.4 — 11 roles (19%) have no company name

`roles.company_name` is NULL for 11 of 59 roles. This cascades: analysis cards show blank company, cover letter prompts say "at this company", prep focus says "why this company interests you" without naming one. The JD extraction or role creation flow should require or at minimum attempt company name extraction before saving.

### 1.5 — 37 jd_matches rows (39%) have no role_id

These are orphaned analysis outputs — they were created but never linked to a role record. If a user analyses a JD and the role insert fails silently, the analysis exists in `jd_matches` but is invisible. Either clean these up or wire a recovery path that links them on next load.

### 1.6 — Legacy TEMP backfill is still in production code

`backfillMissingUpdates()` (line 19575) is marked `// TEMP` and `// END TEMP`. It inserts synthetic `role_updates` rows for roles that lack them. This was a migration aid — it should either be run once and removed, or converted to a proper migration. Leaving TEMP code in production creates confusion.

### 1.7 — Admin role deduplication notice is user-visible

Line 17704 renders a visible notice: "Role deduplication is not yet implemented. The same role saved twice by the same user will appear as two distinct records." This is fine internally but signals incompleteness to anyone who opens Admin. Either implement basic dedup (radar_match_key already exists) or remove the notice.

### 1.8 — Error handling swallows failures silently in user-facing flows

Multiple critical paths use `.catch(() => {})` or `catch (_) {}` with no user feedback:

- `jd_matches.insert` failure (step 5 of `_doSave`): analysis is lost, user sees empty card, no indication why
- `wsAppendDecision` failure: decision not recorded, no feedback
- `wsRefreshDecisionHistory` failure: stale decision list shown
- `_wsExtractAndStoreSignals` failure: memory signals lost silently

Non-critical paths (ledger writes, signals) can stay silent. But `jd_matches.insert` failure should surface a user-visible warning — the user just waited 10+ seconds for an analysis that vanished.

---

## Bucket 2: Should Improve Soon After v2

### 2.1 — Radar view is functional but thin

`renderRadarView()` has real logic — it buckets undecided roles, maps archetypes from progressed roles, and renders role cards with "why this appeared" context. But it doesn't use the radar_match_key infrastructure we just built, and it doesn't surface cross-user intelligence. The foundation is there; the view just needs to use it.

### 2.2 — enrich-role only supports 3 ATS platforms

The edge function explicitly rejects URLs that aren't Greenhouse, Lever, or Ashby. This was an intentional v1 scope limit, but it means most LinkedIn or generic job board URLs get no enrichment. Expanding to generic URL enrichment (HTML stripping → Claude extraction fallback) would significantly increase data quality.

### 2.3 — Workspace chat has no streaming

All chat responses wait for full completion before displaying. For longer responses (cover letters, interview prep), this means 5-15 seconds of "Thinking..." with no visible progress. Streaming would make the workspace feel dramatically more responsive.

### 2.4 — No filter state persistence

`filterState` (decision, engagement, work model, response, recruiter) is a pure in-memory Set. Page reload clears all filters. For a user with 59+ roles, re-applying filters on every session is friction. Store in localStorage.

### 2.5 — Role memory signals table is empty

`role_memory_signals` has 0 rows despite `_wsExtractAndStoreSignals` being wired and `memory-extract` edge function being deployed. Either the extraction is failing silently or users aren't chatting enough to trigger it. Verify the pipeline works end-to-end and add logging if signals are being extracted but not stored.

### 2.6 — Comparison view is wired but not discoverable

`renderCompareView()` works — checkboxes appear in the inbox, the compare bar shows with a count, the "Compare" button triggers rendering. But there's no onboarding or hint that comparison exists. Users will never discover it unless they happen to tick checkboxes. Consider a brief affordance.

### 2.7 — Admin edits don't save back

The admin role detail panel shows editable fields but changes are read-only — they don't persist to the DB. Either wire the save or make the fields read-only to avoid confusion.

### 2.8 — Salary reality rendering gap

The salary-to-take-home calculator (Compensation Snapshot) is well-built, but `salary_monthly` is only populated on the AI analysis path. If the local fallback fires, the salary reality layer produces `salary_monthly: null` and the calculator shows nothing. The local path's salary detection should at least attempt the monthly conversion.

### 2.9 — generate-lens edge function vs client-side _computeUserLens

There are two lens implementations: the `generate-lens` edge function (Claude-powered, 3-decision minimum) and the client-side `_computeUserLens` (deterministic, 10-role minimum). They serve different purposes but the relationship isn't documented. If both run, which takes priority? Clarify or unify.

---

## Bucket 3: Leave for Later / v3

### 3.1 — Unused DB tables

7 tables have 0 rows: `skip_reasons`, `role_interactions`, `role_learnings`, `role_documents`, `role_memory_signals`, `abuse_signals`, `user_trust_state`. Most are schema for planned features (document uploads, trust scoring, interaction logging). No action needed now — they're not hurting anything.

### 3.2 — smart-endpoint edge function

Older analysis endpoint (v5) with a different schema than analyse-jd (v9). No references to it in app.js — it appears fully superseded. Can be removed when convenient but isn't causing harm.

### 3.3 — Missing DB indexes

No explicit indexes beyond primary keys. Queries on `jd_matches.role_id`, `role_conversations.role_id`, `role_events.role_id + created_at` would benefit from indexes at scale. With 59 roles this doesn't matter; at 500+ it will.

### 3.4 — Duplicate migration name

`create_shared_analyses` appears as two separate migrations (20260306113941 and 20260309090039). Both likely ran successfully (Supabase uses `IF NOT EXISTS`). No harm, but worth noting if migration tooling ever enforces unique names.

### 3.5 — workspace-chat edge function is 50KB+

At v38 with truncated output, this function has accumulated significant complexity. Consider modularising into sub-functions when the next major chat feature is added, not before.

### 3.6 — Artifact ID race condition

Artifacts use `'tmp-' + Date.now()` as placeholder IDs during save, patched to real DB IDs after insert. If two artifacts are created within the same millisecond, they share a placeholder ID. Extremely unlikely in practice; not worth fixing until artifact creation frequency increases.

### 3.7 — Multi-tenant architecture

The DB has no `user_id` column on `roles`. All data is effectively single-tenant. This is fine for personal use and would need a full schema revision for multi-user deployment. This is a v3/platform concern, not a v2 concern.

---

## Summary

| Bucket | Count | Theme |
|--------|-------|-------|
| **Must fix** | 8 | Auth, data integrity, visible incompleteness, silent failures |
| **Should improve** | 9 | Feature depth, polish, pipeline reliability |
| **Leave for later** | 7 | Scale prep, cleanup, architectural debt |

The product works well as a single-user tool. The analysis pipeline, workspace chat, recruiter management, decision system, and action cards are all functional and interconnected. The two things that most visibly prevent v2 from feeling complete are (1) auth and (2) the silent failure paths where users lose work without knowing.
