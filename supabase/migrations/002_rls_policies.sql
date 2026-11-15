-- =============================================
-- MIGRATION 002: Row Level Security (RLS) Policies
-- Mengamankan akses data di Supabase
-- =============================================

-- Enable RLS on all tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLICIES: admins table
-- Hanya service_role (backend) yang bisa akses
-- =============================================
CREATE POLICY "admins_service_only" ON admins
  FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================
-- POLICIES: certificate_templates
-- Public bisa READ, hanya service_role yang bisa WRITE
-- =============================================
CREATE POLICY "templates_public_read" ON certificate_templates
  FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "templates_service_write" ON certificate_templates
  FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================
-- POLICIES: batches
-- Service role full access
-- =============================================
CREATE POLICY "batches_service_only" ON batches
  FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================
-- POLICIES: students
-- Public bisa READ (untuk klaim), service_role full access
-- =============================================
CREATE POLICY "students_public_read" ON students
  FOR SELECT
  USING (TRUE);

CREATE POLICY "students_service_write" ON students
  FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================
-- STORAGE BUCKETS
-- =============================================
-- Buat bucket untuk sertifikat (jalankan di Supabase Dashboard > Storage)
-- Atau lewat SQL Editor dengan fungsi storage:

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'certificates',
    'certificates',
    TRUE,
    10485760, -- 10MB per file
    ARRAY['image/png', 'image/jpeg', 'application/pdf']
  ),
  (
    'templates',
    'templates', 
    TRUE,
    5242880, -- 5MB per file
    ARRAY['image/png', 'image/jpeg']
  )
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read untuk certificates
CREATE POLICY "certificates_public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'certificates');

CREATE POLICY "certificates_service_write" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'certificates' AND auth.role() = 'service_role');

CREATE POLICY "certificates_service_delete" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'certificates' AND auth.role() = 'service_role');

CREATE POLICY "templates_public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'templates');

CREATE POLICY "templates_service_write" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'templates' AND auth.role() = 'service_role');
