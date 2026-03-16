# ROLEWISE — System State

> **Last polled:** 2026-03-12
> **Source:** Supabase project `peuaflazxvkkbpbhhjtu` (eu-west-1)
> **Purpose:** Live snapshot of system metrics. Update periodically.

---

## Core Metrics

| Metric | Value | Table / Source |
|--------|-------|----------------|
| Roles analysed | 81 | `roles` |
| JD matches generated | 93 | `jd_matches` |
| Full analyses stored | 5 | `analyses` |
| Roles skipped | 0 | `skip_reasons` |
| Decisions recorded | 4 | `role_decisions` |

## Pipeline Activity

| Metric | Value | Table / Source |
|--------|-------|----------------|
| Stage transitions logged | 5 | `status_events` |
| Role lifecycle events | 157 | `role_events` |
| Role state snapshots | 53 | `role_snapshots` |
| Role data mutations logged | 108 | `role_updates` |

## Workspace Activity

| Metric | Value | Table / Source |
|--------|-------|----------------|
| Conversations | 200 | `role_conversations` |
| Artifacts generated | 46 | `role_artifacts` |
| AI-generated insights | 7 | `role_insights` |
| User interactions logged | 1 | `role_interactions` |
| Documents uploaded | 0 | `role_documents` |

## Intelligence Pipelines

| Pipeline | Status | Rows | Edge Function |
|----------|--------|------|---------------|
| Memory signal extraction | Scaffolded (0 data) | 0 | `memory-extract` v1 |
| Document processing | Scaffolded (0 data) | 0 | `document-extract` v1 |
| Role enrichment | Early (5 rows) | 5 | `enrich-role` v1 |
| Learning accumulation | Scaffolded (0 data) | 0 | — |
| Pattern signals | Not started | 0 | — |
| Archetypes | Not started | 0 | — |

## Recruiter System

| Metric | Value | Table / Source |
|--------|-------|----------------|
| Recruiters tracked | 4 | `recruiters` |
| Role-recruiter links | 4 | `role_recruiters` |

## User & Trust

| Metric | Value | Table / Source |
|--------|-------|----------------|
| User profiles | 1 | `profiles` |
| CV versions stored | 5 | `cv_versions` |
| Trust state entries | 0 | `user_trust_state` |
| Abuse signals | 0 | `abuse_signals` |

## Analytics

| Metric | Value | Table / Source |
|--------|-------|----------------|
| Usage events | 32 | `usage_events` |
| Daily rollups | 3 | `usage_daily_rollups` |

## Sharing

| Metric | Value | Table / Source |
|--------|-------|----------------|
| Shared analyses | 4 | `shared_analyses` |
| Job search snapshots | 1 | `job_search_snapshots` |

## Intelligence Unlock Progress

| Gate | Threshold | Current | Status |
|------|-----------|---------|--------|
| Hiring signals | 10+ roles | 81 roles | ✅ Threshold met (rendering not yet gated) |
| Decision signals | 30+ roles | 81 roles | ✅ Threshold met (rendering not yet gated) |
| Full pattern engine | 100+ roles | 81 roles | ❌ 19 roles short |

## Edge Function Health

| Function | Version | Status | JWT |
|----------|---------|--------|-----|
| `analyse-jd` | v9 | ACTIVE | No |
| `workspace-chat` | v41 | ACTIVE | No |
| `memory-extract` | v1 | ACTIVE | No |
| `document-extract` | v1 | ACTIVE | No |
| `enrich-role` | v1 | ACTIVE | No |
| `smart-endpoint` | v5 | ACTIVE | Yes |
| `generate-lens` | v1 | ACTIVE | No |

## Codebase Size

| File | Lines |
|------|-------|
| `app.js` | 22,433 |
| `styles.css` | 11,553 |
| `reasoning-map.js` | 2,763 |
| `reasoning-map.css` | 1,459 |
| `tokens.css` | 1,307 |
| `index.html` | 494 |
| `recruiter-backfill.js` | 295 |
| `rolewise-prompts.js` | 254 |
| `config.js` | 5 |
| **Total** | **40,563** |
