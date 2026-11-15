-- =============================================
-- MIGRATION 006: Template Custom Upload
-- Tambah kolom untuk background gambar dan
-- posisi teks overlay pada sertifikat custom
-- =============================================

-- Tambah kolom background image URL
ALTER TABLE certificate_templates
  ADD COLUMN IF NOT EXISTS background_image_url TEXT DEFAULT NULL;

-- Tambah kolom posisi teks (JSON array of text layers)
-- Format: [{ "field": "name"|"batch"|"code"|"date", "x": 0-100, "y": 0-100, 
--            "fontSize": 24, "fontWeight": "bold"|"normal", "color": "#000000",
--            "align": "center"|"left"|"right", "label": "Nama Siswa" }]
ALTER TABLE certificate_templates
  ADD COLUMN IF NOT EXISTS text_positions JSONB DEFAULT '[]'::jsonb;

-- Tambah kolom untuk dimensi halaman PDF (landscape/portrait)
-- Format: "landscape" | "portrait"
ALTER TABLE certificate_templates
  ADD COLUMN IF NOT EXISTS page_orientation TEXT DEFAULT 'landscape'
  CHECK (page_orientation IN ('landscape', 'portrait'));

-- Update 2 template bawaan agar punya nilai default yang eksplisit
UPDATE certificate_templates
SET
  background_image_url = NULL,
  text_positions = '[]'::jsonb,
  page_orientation = 'landscape'
WHERE id IN (
  'a1b2c3d4-0001-0001-0001-000000000001',
  'a1b2c3d4-0002-0002-0002-000000000002'
);

-- =============================================
-- Pastikan storage bucket 'templates' sudah ada
-- (Migration 002 sudah membuat ini, tapi jaga-jaga)
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'templates',
  'templates',
  TRUE,
  10485760, -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy untuk templates bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'templates_public_read'
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "templates_public_read" ON storage.objects
      FOR SELECT USING (bucket_id = 'templates');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'templates_service_write'
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "templates_service_write" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'templates' AND auth.role() = 'service_role');
  END IF;
END $$;
