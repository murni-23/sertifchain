# 🚀 Quick Start Guide - SertifChain

Panduan cepat untuk setup dan menjalankan SertifChain dalam 5 menit!

## ✅ Prerequisites

- Node.js 18+ 
- npm atau yarn
- Account Supabase (gratis)

## 📝 Step-by-Step Setup

### 1️⃣ Install Dependencies (1 menit)

```bash
npm install
```

### 2️⃣ Setup Supabase (2 menit)

1. **Buat Project Baru**
   - Buka [https://supabase.com](https://supabase.com)
   - Klik "New Project"
   - Isi nama project, database password, region
   - Tunggu hingga selesai (±2 menit)

2. **Jalankan Migrations**
   - Buka SQL Editor di Supabase Dashboard
   - Copy-paste dan jalankan file-file ini **secara berurutan**:
   
   ```sql
   -- 1. Copy & Run: supabase/migrations/001_initial_schema.sql
   -- 2. Copy & Run: supabase/migrations/002_rls_policies.sql
   -- 3. Copy & Run: supabase/migrations/003_seed_data.sql
   -- 4. Copy & Run: supabase/migrations/004_functions.sql
   ```

3. **Ambil API Keys**
   - Go to: Settings → API
   - Copy:
     - `Project URL`
     - `anon/public key`
     - `service_role key` (secret)

### 3️⃣ Setup Environment Variables (1 menit)

```bash
# Copy template
cp .env.example .env.local
```

Edit `.env.local`:
```env
# Paste dari Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Generate secret (jalankan di terminal):
# node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
NEXTAUTH_SECRET=paste-generated-secret-here
NEXTAUTH_URL=http://localhost:3000
```

### 4️⃣ Run Development Server

```bash
npm run dev
```

Buka browser: [http://localhost:3000](http://localhost:3000)

## 🎉 Selesai! Login Admin

**Default Admin Credentials** (dari seed data):
```
Email: admin@sertifchain.com
Password: Admin@123
```

⚠️ **PENTING**: Ganti password default di production!

## 🧪 Test the Application

### Test Admin Flow

1. Login ke `/admin/login`
2. Buat batch baru: "Test Batch September 2026"
3. Download template CSV
4. Edit CSV, tambahkan beberapa nama:
   ```csv
   nama
   John Doe
   Jane Smith
   Budi Santoso
   ```
5. Upload CSV ke batch
6. Lihat daftar siswa & kode unik mereka

### Test User Flow

1. Kembali ke homepage `/`
2. Masukkan:
   - **Nama**: `John Doe` (sesuai CSV)
   - **Kode Unik**: (copy dari admin dashboard)
3. Klik "Cari Sertifikat"
4. Klaim sertifikat
5. Download PDF

## 🐛 Troubleshooting

### Error: Cannot connect to Supabase
```bash
# Cek .env.local
# Pastikan URL & keys benar
# Restart dev server
```

### Error: Admin table does not exist
```bash
# Jalankan migrations lagi di SQL Editor
# Pastikan menjalankan 001, 002, 003, 004 secara berurutan
```

### Error: Cannot login
```bash
# Pastikan migration 003_seed_data.sql sudah dijalankan
# Atau buat admin manual:
```

SQL untuk create admin manual:
```sql
-- Generate password hash dulu di terminal:
-- node -e "console.log(require('bcryptjs').hashSync('password123', 10))"

INSERT INTO admins (email, password_hash, name)
VALUES (
  'admin@bimbel.com',
  '$2a$10$...', -- paste hash dari command di atas
  'Admin Bimbel'
);
```

### Error: Upload CSV failed
- Pastikan file encoding UTF-8
- Header kolom harus "nama" atau "name"
- Maksimal 1000 baris

## 📚 Next Steps

1. **Ganti Password Admin**
   - Login → (akan ada menu profile)
   - Atau update di Supabase SQL Editor

2. **Customize Branding**
   - Edit `src/app/layout.tsx` untuk metadata
   - Edit `.env.local` untuk nama bimbel

3. **Deploy to Vercel**
   - Push ke GitHub
   - Connect repo ke Vercel
   - Add environment variables
   - Deploy!

## 🆘 Need Help?

- Check [README.md](./README.md) untuk dokumentasi lengkap
- GitHub Issues untuk bug reports
- Email: support@sertifchain.com

---

**Happy Certifying! 🎓✨**
