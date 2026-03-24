-- Add source_meta JSONB column to roles for storing structured metadata
-- from LinkedIn / Apify / other external sources. Survives across sessions.
-- Contains: company_meta, poster, applicants_count, easy_apply,
--           seniority_level, job_functions, industries, posted_date, etc.
ALTER TABLE roles ADD COLUMN IF NOT EXISTS source_meta jsonb DEFAULT NULL;
