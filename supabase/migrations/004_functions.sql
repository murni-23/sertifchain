-- =============================================
-- MIGRATION 004: Helper Functions & Views
-- =============================================

-- =============================================
-- VIEW: batch summary dengan statistik lengkap
-- =============================================
CREATE OR REPLACE VIEW batch_summary AS
SELECT
  b.id,
  b.name,
  b.description,
  b.created_at,
  b.updated_at,
  ct.name AS template_name,
  a.name AS admin_name,
  COUNT(s.id) AS total_students,
  COUNT(CASE WHEN s.status = 'claimed' THEN 1 END) AS claimed_count,
  COUNT(CASE WHEN s.status IN ('unclaimed', 'generated') THEN 1 END) AS unclaimed_count,
  COUNT(CASE WHEN s.status = 'pending' THEN 1 END) AS pending_count,
  ROUND(
    CASE 
      WHEN COUNT(s.id) > 0 
      THEN (COUNT(CASE WHEN s.status = 'claimed' THEN 1 END)::DECIMAL / COUNT(s.id)) * 100
      ELSE 0 
    END, 
    1
  ) AS claim_percentage
FROM batches b
LEFT JOIN certificate_templates ct ON b.template_id = ct.id
LEFT JOIN admins a ON b.admin_id = a.id
LEFT JOIN students s ON s.batch_id = b.id
GROUP BY b.id, b.name, b.description, b.created_at, b.updated_at, ct.name, a.name;

-- =============================================
-- FUNCTION: search_student_for_claim
-- Mencari siswa berdasarkan nama + kode unik (case-insensitive)
-- Digunakan di halaman klaim user
-- =============================================
CREATE OR REPLACE FUNCTION search_student_for_claim(
  p_name TEXT,
  p_unique_code TEXT
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  unique_code TEXT,
  batch_name TEXT,
  status certificate_status,
  certificate_url TEXT,
  certificate_pdf_url TEXT,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.unique_code,
    b.name AS batch_name,
    s.status,
    s.certificate_url,
    s.certificate_pdf_url,
    s.claimed_at,
    s.created_at
  FROM students s
  JOIN batches b ON s.batch_id = b.id
  WHERE
    LOWER(TRIM(s.name)) = LOWER(TRIM(p_name))
    AND UPPER(TRIM(s.unique_code)) = UPPER(TRIM(p_unique_code));
END;
$$;

-- =============================================
-- FUNCTION: claim_certificate
-- Mengklaim sertifikat — update status + timestamp + IP
-- =============================================
CREATE OR REPLACE FUNCTION claim_certificate(
  p_student_id UUID,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student students%ROWTYPE;
  v_result JSONB;
BEGIN
  -- Cek apakah student ada
  SELECT * INTO v_student FROM students WHERE id = p_student_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Sertifikat tidak ditemukan');
  END IF;

  -- Cek apakah sudah diklaim
  IF v_student.status = 'claimed' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Sertifikat ini sudah diklaim sebelumnya',
      'claimed_at', v_student.claimed_at
    );
  END IF;

  -- Cek apakah sertifikat sudah di-generate
  IF v_student.status = 'pending' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Sertifikat belum siap, silakan coba lagi nanti');
  END IF;

  -- Update status ke claimed
  UPDATE students
  SET
    status = 'claimed',
    claimed_at = NOW(),
    claimed_ip = p_ip_address
  WHERE id = p_student_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Sertifikat berhasil diklaim!',
    'student_id', p_student_id
  );
END;
$$;

-- =============================================
-- FUNCTION: get_dashboard_stats
-- Statistik global untuk dashboard admin
-- =============================================
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_batches', (SELECT COUNT(*) FROM batches),
    'total_students', (SELECT COUNT(*) FROM students),
    'total_claimed', (SELECT COUNT(*) FROM students WHERE status = 'claimed'),
    'total_unclaimed', (SELECT COUNT(*) FROM students WHERE status IN ('unclaimed', 'generated')),
    'total_pending', (SELECT COUNT(*) FROM students WHERE status = 'pending'),
    'claim_rate', (
      SELECT ROUND(
        CASE WHEN COUNT(*) > 0
          THEN (COUNT(CASE WHEN status = 'claimed' THEN 1 END)::DECIMAL / COUNT(*)) * 100
          ELSE 0
        END, 1
      )
      FROM students
    )
  ) INTO v_stats;

  RETURN v_stats;
END;
$$;
