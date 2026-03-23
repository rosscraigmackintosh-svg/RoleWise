# ROLEWISE — System State

> **Last polled:** 2026-03-22
> **Source:** Supabase project `peuaflazxvkkbpbhhjtu` (eu-west-1)
> **Purpose:** Live snapshot of system metrics. Update periodically.

---

## Core Metrics

| Metric | Value | Table / Source |
|--------|-------|----------------|
| Roles analysed | 107 | `roles` |
| JD matches generated | 122 | `jd_matches` |
| Full analyses stored | 5 | `analyses` |
| Roles skipped | 0 | `skip_reasons` |
| Decisions recorded | 5 | `role_decisions` |

## Pipeline Activity

| Metric | Value | Table / Source |
|--------|-------|----------------|
| Stage transitions logged | 5 | `status_events` |
| Role lifecycle events | 228 | `role_events` |
| Role state snapshots | 58 | `role_snapshots` |
| Role data mutations logged | 114 | `role_updates` |

## Workspace Activity

| Metric | Value | Table / Source |
|--------|-------|----------------|
| Conversations | 245 | `role_conversations` |
| Artifacts generated | 75 | `role_artifacts` |
| AI-generated insights | 8 | `role_insights` |
| User interactions logged | 1 | `role_interactions` |
| Documents uploaded | 0 | `role_documents` |

## Intelligence Pipelines

| Pipeline | Status | Rows | Edge Function |
|----------|--------|------|---------------|
| Memory signal extraction | Scaffolded (0 data) | 0 | `memory-extract` v1 |
| Document processing | Scaffolded (0 data) | 0 | `document-extract` v1 |
| Role enrichment | Early (5 rows) | 5 | `enrich-role` v1 |
| Learning accumulation | Early (1 row) | 1 | — |
| Pattern signals | Not started | 0 | — |
| Archetypes | Not started | 0 | — |

## Recruiter System

| Metric | Value | Table / Source |
|--------|-------|----------------|
| Recruiters tracked | 12 | `recruiters` |
| Role-recruiter links | 11 | `role_recruiters` |

## User & Trust

| Metric | Value | Table / Source |
|--------|-------|----------------|
| User profiles | 1 | `profiles` |
| CV versions stored | 5 | `cv_versions` |
| Candidate profile entries | 1 | `candidate_profile` |
| Trust state entries | 0 | `user_trust_state` |
| User boundaries | 0 | `user_boundaries` |
| Abuse signals | 0 | `abuse_signals` |

## Analytics

| Metric | Value | Table / Source |
|--------|-------|----------------|
| Usage events | 68 | `usage_events` |
| Daily rollups | 8 | `usage_daily_rollups` |

## Sharing

| Metric | Value | Table / Source |
|--------|-------|----------------|
| Shared analyses | 4 | `shared_analyses` |
| Job search snapshots | 1 | `job_search_snapshots` |

## Extended / Scaffolded Tables

| Table | Rows | Notes |
|-------|------|-------|
| `role_blockers` | 0 | Blocker tracking, scaffolded |
| `role_decision_snapshots` | 1 | Decision state snapshots |
| `role_decisions_ext` | 0 | Extended decision data, scaffolded |
| `role_learnings` | 0 | Per-role learning accumulation, scaffolded |
| `role_outcomes_ext` | 0 | Outcome tracking, scaffolded |

## Intelligence Unlock Progress

| Gate | Threshold | Current | Status |
|------|-----------|---------|--------|
| Hiring signals | 10+ roles | 107 roles | ✅ Threshold met |
| Decision signals | 30+ roles | 107 roles | ✅ Threshold met |
| Full pattern engine | 100+ roles | 107 roles | ✅ Threshold met |

## Edge Function Health

| Function | Version | Status | JWT |
|----------|---------|--------|-----|
| `analyse-jd` | v11 | ACTIVE | No |
| `workspace-chat` | v41 | ACTIVE | No |
| `memory-extract` | v1 | ACTIVE | No |
| `document-extract` | v1 | ACTIVE | No |
| `enrich-role` | v1 | ACTIVE | No |
| `smart-endpoint` | v5 | ACTIVE | Yes |
| `generate-lens` | v1 | ACTIVE | No |
| `generate-narrative` | v6 | ACTIVE | No |

## Codebase Size

| File | Lines |
|------|-------|
| `app.js` | 26,486 |
| `styles.css` | 14,101 |
| `reasoning-map.js` | 2,763 |
| `reasoning-map.css` | 1,459 |
| `tokens.css` | 1,322 |
| `index.html` | 997 |
| `recruiter-backfill.js` | 295 |
| `rolewise-prompts.js` | 866 |
| `config.js` | 5 |
| **Total** | **48,294** |
