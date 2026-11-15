ALTER TABLE certificate_templates
  ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES admins(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_templates_admin_id
  ON certificate_templates(admin_id);

DO $$
DECLARE
  legacy_admin_id UUID;
BEGIN
  SELECT id
  INTO legacy_admin_id
  FROM admins
  ORDER BY created_at ASC, id ASC
  LIMIT 1;

  IF legacy_admin_id IS NOT NULL THEN
    UPDATE batches
    SET admin_id = legacy_admin_id
    WHERE admin_id IS NULL;

    UPDATE certificate_templates
    SET admin_id = legacy_admin_id
    WHERE admin_id IS NULL
      AND id NOT IN (
        'a1b2c3d4-0001-0001-0001-000000000001',
        'a1b2c3d4-0002-0002-0002-000000000002'
      );
  END IF;
END;
$$;
