-- ═══════════════════════════════════════════════════════════════════════════
-- brand_assets: Reusable logo/brand image store
-- ═══════════════════════════════════════════════════════════════════════════
-- Stores one logo per (entity_type, entity_key) pair.
-- entity_type: 'company' or 'source'
-- entity_key:  company domain (preferred) or normalised company name; source slug
-- Roles reference this table via company_logo_asset_id.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS brand_assets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     TEXT NOT NULL CHECK (entity_type IN ('company', 'source')),
  entity_key      TEXT NOT NULL,
  display_name    TEXT,
  logo_url        TEXT,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'missing', 'failed', 'needs_refresh')),
  last_checked_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (entity_type, entity_key)
);

-- Index for fast lookup by entity
CREATE INDEX IF NOT EXISTS idx_brand_assets_entity
  ON brand_assets (entity_type, entity_key);

-- ═══════════════════════════════════════════════════════════════════════════
-- roles: Add company_domain + company_logo_asset_id columns
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS company_domain        TEXT,
  ADD COLUMN IF NOT EXISTS company_logo_asset_id  UUID REFERENCES brand_assets(id);

CREATE INDEX IF NOT EXISTS idx_roles_company_domain
  ON roles (company_domain);

CREATE INDEX IF NOT EXISTS idx_roles_company_logo_asset_id
  ON roles (company_logo_asset_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS: brand_assets — SELECT only for anon. Writes via upsert_brand_asset().
-- See 20260412_brand_assets_tighten_rls.sql for the write function.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE brand_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand_assets_select" ON brand_assets
  FOR SELECT USING (true);

-- No INSERT or UPDATE policies — all writes go through
-- upsert_brand_asset() SECURITY DEFINER function.
