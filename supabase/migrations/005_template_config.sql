-- =============================================
-- MIGRATION 005: Template Config & Seed
-- Tambah kolom config JSONB ke certificate_templates
-- dan seed 2 template bawaan
-- =============================================

-- Tambah kolom config untuk menyimpan konfigurasi desain
ALTER TABLE certificate_templates
  ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb;

-- Hapus data lama jika ada (agar tidak konflik dengan seed baru)
DELETE FROM certificate_templates WHERE name IN ('Template Klasik', 'Template Ceria');

-- =============================================
-- SEED: Template 1 - Klasik Elegan
-- Formal, biru navy + emas, cocok untuk semua umur
-- =============================================
INSERT INTO certificate_templates (id, name, description, is_active, config)
VALUES (
  'a1b2c3d4-0001-0001-0001-000000000001',
  'Klasik Elegan',
  'Template formal dengan nuansa biru navy dan aksen emas. Cocok untuk semua jenjang dan acara resmi.',
  TRUE,
  '{
    "style": "classic",
    "primaryColor": [0.08, 0.15, 0.40],
    "secondaryColor": [0.85, 0.65, 0.13],
    "bgColor": [0.98, 0.97, 0.93],
    "textColor": [0.08, 0.08, 0.08],
    "titleText": "SERTIFIKAT PENGHARGAAN",
    "subtitleText": "Certificate of Achievement",
    "accentBorder": true,
    "showRibbon": true,
    "showWatermark": false,
    "footerText": "SertifChain · Sertifikat Digital Terverifikasi"
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  config = EXCLUDED.config,
  updated_at = NOW();

-- =============================================
-- SEED: Template 2 - Ceria Kids
-- Warna-warni cerah, playful, ramah anak-anak
-- =============================================
INSERT INTO certificate_templates (id, name, description, is_active, config)
VALUES (
  'a1b2c3d4-0002-0002-0002-000000000002',
  'Ceria Kids',
  'Template penuh warna dengan nuansa ceria dan playful. Dirancang khusus untuk siswa anak-anak.',
  TRUE,
  '{
    "style": "kids",
    "primaryColor": [1.0, 0.82, 0.0],
    "secondaryColor": [1.0, 0.43, 0.71],
    "bgColor": [1.0, 0.98, 0.94],
    "textColor": [0.04, 0.04, 0.04],
    "titleText": "SERTIFIKAT BINTANG",
    "subtitleText": "Selamat! Kamu Berhasil! 🌟",
    "accentBorder": true,
    "showRibbon": false,
    "showWatermark": false,
    "showStars": true,
    "footerText": "SertifChain · Sertifikat Digital Bimbel"
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  config = EXCLUDED.config,
  updated_at = NOW();
