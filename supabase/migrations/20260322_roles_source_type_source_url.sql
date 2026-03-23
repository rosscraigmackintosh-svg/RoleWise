-- Source tracking fields for LinkedIn-fetched roles
-- source_type: 'linkedin' when JD came from LinkedIn fetch
-- source_url:  original URL used to fetch the JD
ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS source_type text,
  ADD COLUMN IF NOT EXISTS source_url  text;
