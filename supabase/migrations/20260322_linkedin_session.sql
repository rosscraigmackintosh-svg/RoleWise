-- Add LinkedIn session cookie storage to profiles
-- Used by the fetch-linkedin-jd edge function to authenticate LinkedIn page fetches.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_session_cookie text;
