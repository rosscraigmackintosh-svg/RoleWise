-- Add LinkedIn source tracking fields to roles
-- captured_via: 'auto_fetch' when JD loaded via fetch-linkedin-jd edge function
-- recruiter_intermediary: true when company absent or detected as agency
ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS captured_via text,
  ADD COLUMN IF NOT EXISTS recruiter_intermediary boolean;
