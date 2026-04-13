-- ═══════════════════════════════════════════════════════════════════════════
-- Tighten brand_assets RLS: remove open write, funnel through validated fn
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "brand_assets_insert" ON brand_assets;
DROP POLICY IF EXISTS "brand_assets_update" ON brand_assets;

-- SELECT stays open (logos are not sensitive; needed for cache warm)
-- brand_assets_select already exists: FOR SELECT USING (true)

-- No INSERT or UPDATE policy for anon — writes go through the function below.

-- ═══════════════════════════════════════════════════════════════════════════
-- Validated upsert function (SECURITY DEFINER — bypasses RLS internally)
-- ═══════════════════════════════════════════════════════════════════════════
-- Client calls: db.rpc('upsert_brand_asset', { ... })
-- Validates entity_type and entity_key before writing.
-- Returns the upserted row.

CREATE OR REPLACE FUNCTION upsert_brand_asset(
  p_entity_type     TEXT,
  p_entity_key      TEXT,
  p_display_name    TEXT DEFAULT NULL,
  p_logo_url        TEXT DEFAULT NULL,
  p_status          TEXT DEFAULT 'active'
)
RETURNS brand_assets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result brand_assets;
BEGIN
  -- Validate entity_type
  IF p_entity_type NOT IN ('company', 'source') THEN
    RAISE EXCEPTION 'Invalid entity_type: %', p_entity_type;
  END IF;

  -- Validate entity_key: non-empty, reasonable length
  IF p_entity_key IS NULL OR length(trim(p_entity_key)) < 2 OR length(p_entity_key) > 200 THEN
    RAISE EXCEPTION 'Invalid entity_key';
  END IF;

  -- Validate status
  IF p_status NOT IN ('active', 'missing', 'failed', 'needs_refresh') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;

  -- Validate logo_url if provided: basic sanity (starts with https)
  IF p_logo_url IS NOT NULL AND p_logo_url !~ '^https://' THEN
    RAISE EXCEPTION 'logo_url must be HTTPS';
  END IF;

  INSERT INTO brand_assets (entity_type, entity_key, display_name, logo_url, status, last_checked_at, updated_at)
  VALUES (p_entity_type, trim(p_entity_key), p_display_name, p_logo_url, p_status, now(), now())
  ON CONFLICT (entity_type, entity_key)
  DO UPDATE SET
    display_name    = COALESCE(EXCLUDED.display_name, brand_assets.display_name),
    logo_url        = EXCLUDED.logo_url,
    status          = EXCLUDED.status,
    last_checked_at = now(),
    updated_at      = now()
  RETURNING * INTO _result;

  RETURN _result;
END;
$$;
