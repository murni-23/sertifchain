-- =============================================
-- MIGRATION 003: Seed Data (Development)
-- Data awal untuk testing & development
-- JANGAN jalankan di production!
-- =============================================

-- =============================================
-- Admin default
-- Email: admin@sertifchain.com
-- Password: Admin@123
-- (password_hash di-generate dari bcryptjs, rounds=10)
-- =============================================
INSERT INTO admins (id, email, password_hash, name)
VALUES (
  uuid_generate_v4(),
  'admin@sertifchain.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: Admin@123
  'Admin Utama'
)
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- Template sertifikat default
-- =============================================
INSERT INTO certificate_templates (id, name, description, is_active)
VALUES (
  uuid_generate_v4(),
  'Template Klasik',
  'Template sertifikat formal dengan border elegan, cocok untuk semua acara',
  TRUE
),
(
  uuid_generate_v4(),
  'Template Ceria',
  'Template penuh warna untuk anak-anak dengan ilustrasi bintang dan piala',
  TRUE
)
ON CONFLICT DO NOTHING;
