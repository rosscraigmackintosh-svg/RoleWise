-- =============================================================================
-- Candidate Learning Layer — persistent behavioural learning for Applicant Mode
-- =============================================================================
-- Adds four tables that let Rolewise learn from Ross's decisions and outcomes
-- over time, feeding learned patterns back into the AI analysis pipeline.
--
-- Tables:
--   candidate_profile   — single-row extended profile (strengths, blockers, CV prefs)
--   candidate_learning  — aggregated behavioural patterns updated after each decision
--   role_decisions_ext  — extends existing role_decisions with structured role DNA
--   role_outcomes_ext   — extends existing outcome flow with structured outcome data
-- =============================================================================


-- ─── 1. candidate_profile ────────────────────────────────────────────────────
-- Single-row table holding the full structured candidate context.
-- Replaces the hardcoded ROLEWISE_CANDIDATE_CONTEXT over time as the user
-- edits their profile. For now, seeded from the static object.

CREATE TABLE IF NOT EXISTS candidate_profile (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Identity
  name            TEXT NOT NULL DEFAULT 'Ross',
  seniority       TEXT DEFAULT 'Senior / Lead Product Designer',
  years_experience TEXT DEFAULT '15+',
  location        TEXT DEFAULT 'Surrey, UK',

  -- Structured arrays (stored as JSONB)
  core_strengths          JSONB DEFAULT '[]'::jsonb,
  preferred_environments  JSONB DEFAULT '[]'::jsonb,
  hard_blockers           JSONB DEFAULT '[]'::jsonb,
  known_frictions         JSONB DEFAULT '[]'::jsonb,
  cv_variants             JSONB DEFAULT '[]'::jsonb,
  decision_lens           JSONB DEFAULT '[]'::jsonb,
  default_cv              TEXT,
  preferences_confirmed   BOOLEAN DEFAULT false,

  -- Work model
  work_model_ideal        TEXT DEFAULT 'Remote or hybrid (max 2 days in office)',
  work_model_hard_limit   TEXT DEFAULT '3+ days on-site is a hard no',
  commute_tolerance       TEXT DEFAULT '~60 minutes each way',

  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),

  UNIQUE(profile_id)
);


-- ─── 2. candidate_learning ───────────────────────────────────────────────────
-- Aggregated behavioural patterns. Updated after every decision and outcome.
-- This is what gets injected into Pass 1 and Pass 2 as "learned behaviour."
-- Single row per profile, updated incrementally.

CREATE TABLE IF NOT EXISTS candidate_learning (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Pattern counters (updated after each decision)
  total_roles_analysed    INT DEFAULT 0,
  total_applied           INT DEFAULT 0,
  total_skipped           INT DEFAULT 0,
  total_archived          INT DEFAULT 0,

  -- Role type patterns (JSONB objects: { "role_type": count })
  applied_role_types      JSONB DEFAULT '{}'::jsonb,
  skipped_role_types      JSONB DEFAULT '{}'::jsonb,
  applied_company_stages  JSONB DEFAULT '{}'::jsonb,
  skipped_company_stages  JSONB DEFAULT '{}'::jsonb,

  -- Skip reason patterns (JSONB object: { "reason": count })
  skip_reason_counts      JSONB DEFAULT '{}'::jsonb,

  -- Outcome patterns
  total_no_response       INT DEFAULT 0,
  total_rejected          INT DEFAULT 0,
  total_interviewed       INT DEFAULT 0,
  total_offered           INT DEFAULT 0,
  total_withdrew          INT DEFAULT 0,

  -- Learned signals (JSONB arrays — the actual patterns fed to the AI)
  -- These are rebuilt periodically from role_decisions_ext + role_outcomes_ext
  successful_role_patterns    JSONB DEFAULT '[]'::jsonb,   -- patterns from roles that reached interview/offer
  recurring_blockers          JSONB DEFAULT '[]'::jsonb,   -- frictions that keep appearing in skipped/rejected roles
  preferred_cv_by_role_type   JSONB DEFAULT '{}'::jsonb,   -- { "role_type": "cv_variant_id" } from successful roles
  roles_you_pursue            JSONB DEFAULT '[]'::jsonb,   -- short descriptions of roles Ross tends to apply to
  roles_you_skip              JSONB DEFAULT '[]'::jsonb,   -- short descriptions of roles Ross tends to skip
  friction_patterns           JSONB DEFAULT '[]'::jsonb,   -- recurring friction themes across skipped/negative roles

  -- Timestamps
  last_decision_at    TIMESTAMPTZ,
  last_outcome_at     TIMESTAMPTZ,
  last_rebuilt_at     TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),

  UNIQUE(profile_id)
);


-- ─── 3. role_decisions_ext ───────────────────────────────────────────────────
-- Extends the existing role_decisions table with structured role DNA captured
-- at decision time. This is the data used to rebuild candidate_learning.
-- Links to role_decisions via role_id + decision_type + created_at.

CREATE TABLE IF NOT EXISTS role_decisions_ext (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id             UUID NOT NULL,
  decision_type       TEXT NOT NULL,   -- 'apply' | 'skip' | 'keep_reviewing' | 'archive'

  -- Role DNA snapshot at decision time
  role_title          TEXT,
  company_name        TEXT,
  role_type           TEXT,            -- from Pass 1: "founding designer", "scale-up", etc.
  company_stage       TEXT,            -- from Pass 1: "early-stage", "growth", etc.
  work_model          TEXT,
  location_text       TEXT,
  salary_text         TEXT,
  engagement_type     TEXT,

  -- Candidate-specific signals at decision time
  candidate_fit_signals       JSONB DEFAULT '[]'::jsonb,
  candidate_specific_frictions JSONB DEFAULT '[]'::jsonb,
  hard_blocker_triggered      TEXT,
  recommended_cv              TEXT,
  actual_cv_used              TEXT,            -- CV variant ID the user actually submitted (null until explicitly confirmed)

  -- Skip/archive reason (from skip flow)
  reason              TEXT,
  reason_other        TEXT,
  notes               TEXT,

  -- The rolewise verdict at decision time
  rolewise_verdict    JSONB,

  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_role_decisions_ext_role
  ON role_decisions_ext(role_id);
CREATE INDEX IF NOT EXISTS idx_role_decisions_ext_type
  ON role_decisions_ext(decision_type);


-- ─── 4. role_outcomes_ext ────────────────────────────────────────────────────
-- Structured outcome data. Written when a role reaches a terminal state.
-- Links back to the role and captures the role DNA + outcome for learning.

CREATE TABLE IF NOT EXISTS role_outcomes_ext (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id             UUID NOT NULL UNIQUE,
  outcome_state       TEXT NOT NULL,   -- 'no_response' | 'rejected' | 'interviewed' | 'offer' | 'withdrew' | 'ghosted' | 'closed'
  outcome_reason      TEXT,

  -- Role DNA at outcome time (same shape as role_decisions_ext)
  role_title          TEXT,
  company_name        TEXT,
  role_type           TEXT,
  company_stage       TEXT,
  work_model          TEXT,
  location_text       TEXT,
  salary_text         TEXT,
  engagement_type     TEXT,

  -- What was the original decision?
  original_decision   TEXT,            -- 'apply' | 'skip' etc.

  -- Candidate signals at analysis time
  candidate_fit_signals       JSONB DEFAULT '[]'::jsonb,
  candidate_specific_frictions JSONB DEFAULT '[]'::jsonb,
  hard_blocker_triggered      TEXT,
  recommended_cv              TEXT,
  actual_cv_used              TEXT,            -- CV variant ID the user actually submitted (null until explicitly confirmed)

  -- Stage reached before outcome
  stage_reached       TEXT,

  -- Outcome quality (nullable — populated when UI captures it)
  outcome_quality     TEXT,                   -- e.g. 'positive' | 'neutral' | 'negative' (null until user provides it)

  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_role_outcomes_ext_state
  ON role_outcomes_ext(outcome_state);


-- ─── RLS policies ────────────────────────────────────────────────────────────
-- Simple open policies for the single-user app. Tighten if multi-user later.

ALTER TABLE candidate_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_learning ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_decisions_ext ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_outcomes_ext ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for candidate_profile" ON candidate_profile FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for candidate_learning" ON candidate_learning FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for role_decisions_ext" ON role_decisions_ext FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for role_outcomes_ext" ON role_outcomes_ext FOR ALL USING (true) WITH CHECK (true);
