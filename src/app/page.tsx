"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, MotionConfig } from "framer-motion";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Check,
  ChevronRight,
  KeyRound,
  LockKeyhole,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const reveal = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", unique_code: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    if (errors[name]) {
      setErrors((previous) => ({ ...previous, [name]: "" }));
    }
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Nama wajib diisi";
    }

    if (!formData.unique_code.trim()) {
      nextErrors.unique_code = "Kode unik wajib diisi";
    } else if (formData.unique_code.trim().length < 6) {
      nextErrors.unique_code = "Kode unik minimal 6 karakter";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Sertifikat tidak ditemukan");
        return;
      }

      toast.success("Sertifikat ditemukan");
      router.push(`/claim/${data.student.id}`);
    } catch (error) {
      console.error("Claim search error:", error);
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-hidden bg-[#fbfaff] text-[#292333]">
        <header className="border-b border-[#eee9f3] bg-white/95">
          <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <Link href="/" className="flex items-center gap-3" aria-label="SertifChain beranda">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5b2b82] text-white shadow-[0_8px_20px_rgba(91,43,130,0.2)]">
                <Award className="h-6 w-6" fill="currentColor" strokeWidth={1.8} />
              </span>
              <span className="leading-tight">
                <span className="block text-lg font-bold tracking-tight text-[#3d2057]">
                  Sertif<span className="text-[#7650a1]">Chain</span>
                </span>
                <span className="block text-[11px] font-medium tracking-wide text-[#81788a]">
                  SERTIFIKAT DIGITAL
                </span>
              </span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/verify"
                className="hidden items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#5b2b82] transition-colors hover:bg-[#f5effa] sm:inline-flex"
              >
                <ShieldCheck className="h-4 w-4" />
                Verifikasi
              </Link>
              <Link href="/admin/login">
                <Button
                  variant="black"
                  className="!rounded-xl !bg-[#5b2b82] !px-4 !py-2.5 text-sm hover:!bg-[#472064]"
                  leftIcon={<LockKeyhole className="h-4 w-4" />}
                >
                  Admin
                </Button>
              </Link>
            </div>
          </nav>
        </header>

        <main className="mx-auto max-w-6xl px-5 pb-16 pt-7 sm:px-8 sm:pt-10">
          <motion.section
            initial="hidden"
            animate="visible"
            variants={reveal}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#4c246c] via-[#693795] to-[#8856b4] px-6 py-9 text-white shadow-[0_24px_70px_rgba(86,45,120,0.2)] sm:px-10 sm:py-12 lg:px-14"
          >
            <div className="absolute -right-20 -top-32 -z-10 h-80 w-80 rounded-full bg-[#c89cf1]/20 blur-3xl" />
            <div className="absolute -bottom-40 left-1/3 -z-10 h-72 w-72 rounded-full bg-[#f7c83f]/20 blur-3xl" />
            <div className="grid items-center gap-8 lg:grid-cols-[1fr_0.72fr]">
              <div className="max-w-2xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-[#f3e8ff]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#ffd451]" />
                  PLATFORM SERTIFIKAT TERPERCAYA
                </div>
                <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[3.35rem]">
                  Setiap pencapaian
                  <br className="hidden sm:block" /> layak dirayakan.
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-6 text-white/80 sm:text-base sm:leading-7">
                  Temukan, klaim, dan verifikasi sertifikat digitalmu dengan
                  mudah. Aman tersimpan dan dapat diverifikasi kapan saja.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-white/90">
                  <span className="inline-flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#ffdb68]" strokeWidth={3} />
                    Proses mudah
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#ffdb68]" strokeWidth={3} />
                    Verifikasi tepercaya
                  </span>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotateY: -18, rotateX: 8 }}
                animate={{ opacity: 1, scale: 1, rotateY: -8, rotateX: 4 }}
                transition={{ delay: 0.18, duration: 0.75, ease: "easeOut" }}
                whileHover={{ rotateY: -3, rotateX: 1, y: -4 }}
                style={{ transformStyle: "preserve-3d", perspective: 1000 }}
                className="relative mx-auto w-full max-w-[23rem] py-5"
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-x-7 bottom-2 top-8 rotate-[-7deg] rounded-[1.15rem] bg-[#d6c6e5] shadow-[0_24px_40px_rgba(24,12,38,0.32)]"
                  style={{ transform: "translateZ(-28px) rotate(-7deg)" }}
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-x-4 bottom-4 top-5 rotate-[4deg] rounded-[1.15rem] bg-[#fff0c1] shadow-[0_18px_32px_rgba(24,12,38,0.22)]"
                  style={{ transform: "translateZ(-14px) rotate(4deg)" }}
                />
                <svg
                  viewBox="0 0 420 300"
                  role="img"
                  aria-labelledby="certificate-title certificate-description"
                  className="relative block w-full overflow-visible drop-shadow-[0_22px_24px_rgba(24,12,38,0.3)]"
                  style={{ transform: "translateZ(12px) rotate(-2deg)" }}
                >
                  <title id="certificate-title">Sertifikat digital SertifChain</title>
                  <desc id="certificate-description">
                    Ilustrasi sertifikat profesional dengan bingkai emas, tanda tangan, dan medali verifikasi.
                  </desc>
                  <defs>
                    <linearGradient id="certificate-paper" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#fffefb" />
                      <stop offset="1" stopColor="#f4eff8" />
                    </linearGradient>
                    <linearGradient id="certificate-gold" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#f8df98" />
                      <stop offset="0.5" stopColor="#c99a3c" />
                      <stop offset="1" stopColor="#f5d77f" />
                    </linearGradient>
                    <linearGradient id="certificate-seal" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#8554a8" />
                      <stop offset="1" stopColor="#4c246c" />
                    </linearGradient>
                    <filter id="certificate-soft-shadow" x="-30%" y="-30%" width="160%" height="170%">
                      <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#160d20" floodOpacity=".24" />
                    </filter>
                  </defs>

                  <g filter="url(#certificate-soft-shadow)">
                    <rect x="14" y="12" width="392" height="270" rx="13" fill="url(#certificate-paper)" />
                    <rect x="22" y="20" width="376" height="254" rx="9" fill="none" stroke="url(#certificate-gold)" strokeWidth="2.5" />
                    <rect x="29" y="27" width="362" height="240" rx="6" fill="none" stroke="#ded0e8" strokeWidth="1" />
                    <path d="M30 74h360" stroke="url(#certificate-gold)" strokeWidth="2" />

                    <circle cx="210" cy="48" r="15" fill="#5b2b82" />
                    <path d="M203 48l5 5 10-11" fill="none" stroke="#f8df98" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                    <text x="210" y="91" textAnchor="middle" fill="#8a6e9d" fontSize="8" fontFamily="Arial, sans-serif" fontWeight="700" letterSpacing="2">
                      SERTIFIKAT PENGHARGAAN
                    </text>
                    <text x="210" y="119" textAnchor="middle" fill="#39234e" fontSize="20" fontFamily="Georgia, serif" fontWeight="700">
                      CERTIFICATE
                    </text>
                    <text x="210" y="136" textAnchor="middle" fill="#39234e" fontSize="11" fontFamily="Georgia, serif" fontWeight="700" letterSpacing="2">
                      OF ACHIEVEMENT
                    </text>
                    <text x="210" y="158" textAnchor="middle" fill="#8a7b91" fontSize="8" fontFamily="Arial, sans-serif">
                      Dengan bangga diberikan kepada
                    </text>
                    <path d="M109 179h202" stroke="#ddcda9" strokeWidth="1" />
                    <text x="210" y="174" textAnchor="middle" fill="#5b2b82" fontSize="15" fontFamily="Georgia, serif" fontStyle="italic">
                      Nama Penerima
                    </text>
                    <text x="210" y="195" textAnchor="middle" fill="#85798d" fontSize="7.5" fontFamily="Arial, sans-serif">
                      Atas pencapaian dan dedikasi yang luar biasa
                    </text>
                    <path d="M63 224h81M276 224h81" stroke="#d7ccdf" strokeWidth="1" />
                    <path d="M84 218c8-13 13 10 22-4 5-8 9 2 14-2" fill="none" stroke="#77518f" strokeLinecap="round" strokeWidth="1.5" />
                    <path d="M298 214c8-10 14 9 21-1 6-7 11 4 17-3" fill="none" stroke="#77518f" strokeLinecap="round" strokeWidth="1.5" />
                    <text x="103" y="236" textAnchor="middle" fill="#8a7b91" fontSize="6.5" fontFamily="Arial, sans-serif">
                      DIREKTUR PROGRAM
                    </text>
                    <text x="317" y="236" textAnchor="middle" fill="#8a7b91" fontSize="6.5" fontFamily="Arial, sans-serif">
                      SERTIFIKAT DIGITAL
                    </text>

                    <path d="M350 178l-13 48 16-7 10 14 12-47" fill="#6c3e8c" />
                    <path d="M372 185l13 42-16-6-10 14-11-46" fill="#8c5aab" />
                    <circle cx="361" cy="176" r="29" fill="url(#certificate-gold)" />
                    <circle cx="361" cy="176" r="23" fill="url(#certificate-seal)" stroke="#fff1c8" strokeWidth="2" />
                    <path d="M361 162l4 8 9 1-6.5 6.3 1.5 9-8-4.2-8 4.2 1.5-9-6.5-6.3 9-1z" fill="#f7dc91" />
                  </g>
                </svg>
              </motion.div>
            </div>
          </motion.section>

          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={reveal}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="mt-7 grid items-stretch gap-5 lg:grid-cols-[1.4fr_0.8fr]"
          >
            <div className="rounded-3xl border border-[#eee9f3] bg-white p-5 shadow-[0_12px_36px_rgba(54,34,72,0.06)] sm:p-8">
              <div className="mb-6">
                <p className="text-xs font-bold tracking-[0.14em] text-[#815ba0]">
                  MULAI DI SINI
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#30243b] sm:text-[1.7rem]">
                  Klaim sertifikatmu
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#777080]">
                  Masukkan nama lengkap dan kode unik untuk menemukan sertifikat.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Nama lengkap"
                  name="name"
                  placeholder="Contoh: Budi Santoso"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  disabled={isLoading}
                  required
                  leftIcon={<UserRound className="h-4 w-4" />}
                  className="!rounded-xl !border-[#e8e2ed] !py-3 !font-medium !shadow-none focus:!border-[#8253a6] focus:!ring-[#8253a6]/15"
                />
                <Input
                  label="Kode unik"
                  name="unique_code"
                  placeholder="Contoh: ABC12345"
                  value={formData.unique_code}
                  onChange={handleChange}
                  error={errors.unique_code}
                  helperText="Kode unik terdiri dari minimal 6 karakter."
                  disabled={isLoading}
                  required
                  leftIcon={<KeyRound className="h-4 w-4" />}
                  className="!rounded-xl !border-[#e8e2ed] !py-3 !font-medium !shadow-none focus:!border-[#8253a6] focus:!ring-[#8253a6]/15"
                />
                <Button
                  type="submit"
                  variant="black"
                  className="!mt-6 !w-full !rounded-xl !bg-[#5b2b82] !py-3.5 !text-sm hover:!bg-[#472064]"
                  isLoading={isLoading}
                  rightIcon={<Search className="h-4 w-4" />}
                >
                  Cari sertifikat
                </Button>
              </form>
              <p className="mt-4 flex items-center justify-center gap-2 text-xs text-[#8a8291]">
                <LockKeyhole className="h-3.5 w-3.5" />
                Data sertifikatmu terlindungi
              </p>
            </div>

            <div className="flex flex-col">
              <Link href="/verify" className="block">
                <motion.div
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.99 }}
                  className="group flex min-h-32 flex-1 items-center gap-4 rounded-2xl bg-[#ffc928] px-5 py-5 text-[#4c2865] shadow-[0_10px_24px_rgba(188,143,12,0.12)] transition-shadow hover:shadow-[0_16px_30px_rgba(188,143,12,0.2)] sm:px-6"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/60 text-[#603582]">
                    <ShieldCheck className="h-6 w-6" fill="currentColor" strokeWidth={1.6} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">Verifikasi sertifikat</span>
                    <span className="mt-1 block text-xs text-[#684a72]">
                      Cek keaslian melalui kode atau PDF
                    </span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
                </motion.div>
              </Link>

            </div>
          </motion.section>

          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={reveal}
            transition={{ duration: 0.5 }}
            className="mt-12"
          >
            <div className="mb-5 text-center">
              <h2 className="text-xl font-bold tracking-tight text-[#30243b]">
                Proses klaim yang sederhana
              </h2>
              <p className="mt-1 text-sm text-[#81788a]">
                Sertifikatmu hanya beberapa langkah lagi.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  number: "01",
                  title: "Cari",
                  description: "Masukkan nama dan kode unik.",
                  icon: Search,
                },
                {
                  number: "02",
                  title: "Konfirmasi",
                  description: "Pastikan data sertifikat sesuai.",
                  icon: BadgeCheck,
                },
                {
                  number: "03",
                  title: "Simpan",
                  description: "Unduh sertifikat digitalmu.",
                  icon: ArrowRight,
                },
              ].map(({ number, title, description, icon: Icon }) => (
                <motion.div
                  key={number}
                  variants={reveal}
                  transition={{ duration: 0.45, delay: Number(number) * 0.04 }}
                  className="flex items-center gap-4 rounded-2xl border border-[#eee9f3] bg-white p-4 sm:p-5"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f1e9f8] text-[#673c8b]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-[11px] font-bold tracking-widest text-[#9b86ad]">
                      LANGKAH {number}
                    </span>
                    <span className="mt-0.5 block text-sm font-bold text-[#3d2c4d]">
                      {title}
                    </span>
                    <span className="mt-0.5 block text-xs text-[#81788a]">
                      {description}
                    </span>
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </main>

        <footer className="border-t border-[#eee9f3] bg-white">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 text-center sm:flex-row sm:px-8 sm:text-left">
            <p className="text-xs font-medium text-[#81788a]">
              © 2026 SertifChain. Platform sertifikat digital.
            </p>
            <Link
              href="/verify"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#68408b] hover:text-[#482265]"
            >
              Verifikasi sertifikat
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
