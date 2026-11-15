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
                initial={{ opacity: 0, scale: 0.92, rotate: 2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 0.18, duration: 0.6, ease: "easeOut" }}
                className="mx-auto w-full max-w-[19rem] rounded-2xl border border-white/60 bg-white p-5 text-[#3e2852] shadow-[0_22px_48px_rgba(31,15,48,0.22)]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.18em] text-[#8e7c9f]">
                      SERTIFIKAT DIGITAL
                    </p>
                    <div className="mt-3 h-2 w-28 rounded-full bg-[#eee8f4]" />
                    <div className="mt-2 h-2 w-20 rounded-full bg-[#f4d87a]" />
                  </div>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff4c9] text-[#ae7c10]">
                    <Award className="h-7 w-7" fill="currentColor" strokeWidth={1.6} />
                  </span>
                </div>
                <div className="mt-7 border-t border-dashed border-[#ded5e7] pt-4">
                  <div className="h-2 w-32 rounded-full bg-[#d9cce6]" />
                  <div className="mt-2 h-2 w-24 rounded-full bg-[#eee8f4]" />
                  <div className="mt-5 flex items-center justify-between">
                    <div className="h-1.5 w-16 rounded-full bg-[#eee8f4]" />
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f1e9f8] text-[#74479b]">
                      <BadgeCheck className="h-5 w-5" />
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.section>

          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={reveal}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="mt-7 grid items-start gap-5 lg:grid-cols-[1.4fr_0.8fr]"
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
                  Masukkan nama lengkap dan kode unik dari bimbel untuk
                  menemukan sertifikat.
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

            <div className="space-y-4">
              <Link href="/verify" className="block">
                <motion.div
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.99 }}
                  className="group flex min-h-28 items-center gap-4 rounded-2xl bg-[#ffc928] px-5 py-5 text-[#4c2865] shadow-[0_10px_24px_rgba(188,143,12,0.12)] transition-shadow hover:shadow-[0_16px_30px_rgba(188,143,12,0.2)] sm:px-6"
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

              <Link href="/admin/login" className="block">
                <motion.div
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.99 }}
                  className="group flex min-h-28 items-center gap-4 rounded-2xl border border-[#ece5f2] bg-white px-5 py-5 shadow-[0_10px_24px_rgba(54,34,72,0.05)] transition-shadow hover:shadow-[0_16px_30px_rgba(54,34,72,0.1)] sm:px-6"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f2eaf8] text-[#603582]">
                    <LockKeyhole className="h-6 w-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-[#3d2c4d]">Portal admin</span>
                    <span className="mt-1 block text-xs text-[#81788a]">
                      Kelola data siswa dan sertifikat
                    </span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-[#80619a] transition-transform group-hover:translate-x-1" />
                </motion.div>
              </Link>

              <div className="rounded-2xl border border-[#eee9f3] bg-[#f7f3fa] p-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#79529b]">
                    <KeyRound className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-[#443353]">Belum punya kode unik?</h3>
                    <p className="mt-1 text-xs leading-5 text-[#787080]">
                      Hubungi bimbel penyelenggara untuk mendapatkan kode klaim sertifikat.
                    </p>
                  </div>
                </div>
              </div>
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
