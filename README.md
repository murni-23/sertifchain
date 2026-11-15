# 🎓 SertifChain - Platform Sertifikat Digital Bimbel

Platform modern untuk penerbitan dan klaim sertifikat digital bagi siswa bimbel dengan desain **Neo-Brutalism** yang menarik dan playful.

![SertifChain](https://img.shields.io/badge/SertifChain-v1.0-yellow?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=for-the-badge)

## ✨ Fitur MVP (Fase 1)

### 👨‍💼 Fitur Admin
- ✅ **Login Aman** - Autentikasi dengan NextAuth.js
- ✅ **Pendaftaran Admin** - Admin dapat membuat akun sendiri
- ✅ **Pemulihan Password** - Hubungi pengelola untuk bantuan reset password
- ✅ **Dashboard Real-time** - Statistik sertifikat (total, diklaim, belum diklaim)
- ✅ **Kelola Batch** - Buat dan kelola batch/angkatan siswa
- ✅ **Upload Massal** - Upload ratusan siswa sekaligus via CSV/Excel
- ✅ **Generate Kode Unik** - Otomatis untuk setiap siswa
- ✅ **Monitor Status** - Lihat siswa mana yang sudah/belum klaim

### 👨‍🎓 Fitur User (Siswa/Orang Tua)
- ✅ **Pencarian Sertifikat** - Cari dengan nama + kode unik
- ✅ **Klaim Self-Service** - Siswa klaim sendiri tanpa bantuan admin
- ✅ **Download PDF** - Sertifikat format PDF siap cetak
- ✅ **Verifikasi** - Kode unik untuk validasi keaslian

## 🎨 Design System

Menggunakan **Neo-Brutalism** dengan sentuhan playful untuk anak-anak:
- Border tebal (3px) dengan shadow hard (tidak blur)
- Warna kontras tinggi: Yellow, Pink, Mint, Orange, Purple, Sky
- Font chunky: Archivo Black untuk heading
- Animasi fun: bounce, wiggle, confetti
- Decorative shapes: bintang, lingkaran, segitiga

## 🛠️ Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| **Frontend & Backend** | Next.js 14 (App Router) |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | NextAuth.js |
| **Styling** | Tailwind CSS |
| **PDF Generation** | pdf-lib |
| **File Upload** | React Dropzone |
| **Parsing** | papaparse, xlsx |
| **Icons** | Lucide React |
| **Hosting** | Vercel (free tier) |

## 📦 Installation

### 1. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Buat file `.env.local` dari `.env.example`:
```bash
cp .env.example .env.local
```

Isi dengan credentials Anda:
```env
# Supabase (dari dashboard Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# NextAuth
NEXTAUTH_SECRET=generate-dengan-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000
```

### 4. Setup Database
Jalankan migrations di Supabase SQL Editor:
```sql
-- Jalankan file-file ini secara berurutan:
-- 1. supabase/migrations/001_initial_schema.sql
-- 2. supabase/migrations/002_rls_policies.sql
-- 3. supabase/migrations/003_seed_data.sql
-- 4. supabase/migrations/004_functions.sql
-- 5. supabase/migrations/005_template_config.sql
-- 6. supabase/migrations/006_template_custom_upload.sql
-- 7. supabase/migrations/007_admin_data_ownership.sql
```

### 5. Pendaftaran Admin
Buat akun admin melalui tautan **Buat akun** pada halaman login admin.
Pendaftaran terbuka: siapa pun yang dapat membuka situs bisa membuat akun
dengan akses admin.

Jika lupa password, hubungi pengelola sistem untuk bantuan reset. Reset
langsung tanpa verifikasi kepemilikan email tidak disediakan demi keamanan.

### 6. Run Development Server
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## 📁 Struktur Project

```
Sertifchain/
├── src/
│   ├── app/
│   │   ├── (root)/
│   │   │   └── page.tsx              # Landing page user
│   │   ├── admin/
│   │   │   ├── login/                # Login admin
│   │   │   ├── dashboard/            # Dashboard admin
│   │   │   ├── batches/              # Kelola batch
│   │   │   ├── students/             # Lihat semua siswa
│   │   │   └── templates/            # Template sertifikat
│   │   ├── claim/[id]/               # Halaman klaim sertifikat
│   │   └── api/
│   │       ├── auth/                 # NextAuth endpoints
│   │       ├── batches/              # CRUD batches
│   │       ├── students/             # CRUD students
│   │       ├── claim/                # Claim certificate
│   │       └── certificate/          # Generate & download PDF
│   ├── components/
│   │   ├── ui/                       # UI components (Button, Input, Card, etc)
│   │   ├── admin/                    # Admin-specific components
│   │   └── decorations/              # Decorative elements (Confetti, Shapes)
│   ├── lib/
│   │   ├── supabase/                 # Supabase clients
│   │   ├── pdf/                      # PDF generation
│   │   └── utils.ts                  # Utility functions
│   └── types/                        # TypeScript types
├── supabase/
│   └── migrations/                   # Database migrations
└── public/                           # Static assets
```

## 🚀 Usage Guide

### Admin Flow

1. **Login Admin**
   - Buka `/admin/login`
   - Masukkan email dan password

2. **Buat Batch Baru**
   - Menu "Batch Siswa" → "Buat Batch Baru"
   - Isi nama batch (contoh: "Batch Agustus 2026")

3. **Upload Data Siswa**
   - Klik batch yang dibuat
   - Download template CSV/Excel
   - Isi dengan nama-nama siswa
   - Upload file
   - Sistem otomatis generate kode unik untuk tiap siswa

4. **Bagikan Kode Unik**
   - Export data siswa dengan kode unik
   - Kirim ke siswa via WA/email

### User Flow

1. **Cari Sertifikat**
   - Buka homepage
   - Masukkan nama lengkap + kode unik

2. **Klaim Sertifikat**
   - Verifikasi data
   - Klik "Klaim Sertifikat"

3. **Download PDF**
   - Setelah diklaim, klik "Download Sertifikat PDF"
   - Simpan atau cetak

## 📤 Upload Format

### CSV Format
```csv
nama
John Doe
Jane Smith
Budi Santoso
```

### Excel Format
| nama |
|------|
| John Doe |
| Jane Smith |
| Budi Santoso |

**Notes:**
- Kolom header: `nama` atau `name` (case-insensitive)
- Maksimal 1000 siswa per upload
- Kode unik otomatis digenerate (8 karakter)

## 🔐 Security

- ✅ Admin routes protected dengan middleware
- ✅ NextAuth.js untuk session management
- ✅ Row Level Security (RLS) di Supabase
- ✅ Klaim sertifikat butuh nama + kode unik (tidak bisa asal klaim)
- ✅ IP tracking saat klaim
- ✅ Password hashing dengan bcrypt

## 🎯 Roadmap

### ✅ Fase 1 (MVP) - DONE
- [x] Admin dashboard & authentication
- [x] Batch management
- [x] Bulk student upload
- [x] Certificate claim system
- [x] PDF generation & download

### 🚧 Fase 1.5 (Coming Soon)
- [ ] Public verification page
- [ ] WhatsApp notification integration
- [ ] Multi-template support
- [ ] Certificate editor
- [ ] Analytics & reports

### 🔮 Fase 2 (Blockchain)
- [ ] Ethereum Sepolia integration
- [ ] Smart contract deployment
- [ ] On-chain certificate verification
- [ ] NFT certificate minting
- [ ] MetaMask wallet connect

### 📈 Fase 3 (Scale)
- [ ] Multi-tenant support
- [ ] Custom branding per bimbel
- [ ] Advanced analytics
- [ ] Bulk operations optimization
- [ ] Email notifications

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Pastikan Supabase credentials benar
# Cek di: https://supabase.com/dashboard/project/<your-project>/settings/api
```

### Upload CSV Gagal
- Pastikan kolom header adalah "nama" atau "name"
- File encoding UTF-8
- Maksimal 1000 baris

### Generate PDF Error
- Pastikan student sudah diklaim (status = "claimed")
- Cek console untuk error detail

## 🤝 Contributing

Contributions welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Developer

Built with ❤️ by [Your Name]

## 📞 Support

Butuh bantuan? Hubungi:
- Email: support@sertifchain.com
- GitHub Issues: [Issues Page](https://github.com/yourusername/sertifchain/issues)

---

**SertifChain** - Membuat penerbitan sertifikat digital jadi mudah, cepat, dan menyenangkan! 🎉
#   s e r t i f c h a i n  
 