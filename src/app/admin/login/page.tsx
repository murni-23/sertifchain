"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MotionConfig, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  CircleAlert,
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  UserPlus,
} from "lucide-react";

type AuthView = "login" | "register";

export default function AdminLoginPage() {
  const router = useRouter();
  const [view, setView] = useState<AuthView>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetErrors = () => setErrors({});

  const handleLogin = async () => {
    const nextErrors: Record<string, string> = {};
    if (!email.trim()) {
      nextErrors.email = "Email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Masukkan alamat email yang valid.";
    }
    if (!password) {
      nextErrors.password = "Password wajib diisi.";
    } else if (password.length < 6) {
      nextErrors.password = "Password minimal 6 karakter.";
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        const errorCode = result.error;
        if (errorCode === "EMAIL_NOT_FOUND") {
          setErrors({ email: "Email tidak terdaftar." });
          toast.error("Email tidak terdaftar.");
        } else if (errorCode === "WRONG_PASSWORD") {
          setErrors({ password: "Password yang Anda masukkan salah." });
          toast.error("Password salah.");
        } else {
          setErrors({ password: "Email atau password salah." });
          toast.error("Email atau password salah.");
        }
        return;
      }

      toast.success("Login berhasil! Mengalihkan...");
      router.push("/admin/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    const nextErrors: Record<string, string> = {};
    if (name.trim().length < 2) nextErrors.name = "Nama minimal 2 karakter.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Masukkan alamat email yang valid.";
    }
    if (password.length < 8) {
      nextErrors.password = "Password minimal 8 karakter.";
    } else if (new TextEncoder().encode(password).length > 72) {
      nextErrors.password = "Password maksimal 72 byte.";
    }
    if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Konfirmasi password tidak cocok.";
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 409) setErrors({ email: result.error });
        else toast.error(result.error || "Pendaftaran gagal.");
        return;
      }

      const loginResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (loginResult?.error) {
        setView("login");
        setPassword("");
        toast.success("Akun dibuat. Silakan masuk dengan akun baru.");
        return;
      }

      toast.success("Akun admin berhasil dibuat!");
      router.push("/admin/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Admin registration error:", error);
      toast.error("Pendaftaran gagal. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetErrors();

    if (view === "login") await handleLogin();
    else await handleRegister();
  };

  const titles: Record<AuthView, string> = {
    login: "Login Admin",
    register: "Buat Akun Admin",
  };
  const descriptions: Record<AuthView, string> = {
    login: "Masuk untuk mengelola sertifikat siswa",
    register: "Daftar untuk mulai mengelola sertifikat",
  };
  const submitLabels: Record<AuthView, string> = {
    login: "Masuk",
    register: "Buat Akun",
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen overflow-hidden bg-[#fbfaff] px-4 py-6 text-[#292333] sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute -right-36 -top-40 h-[28rem] w-[28rem] rounded-full bg-[#efe5f6] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 -left-36 h-[30rem] w-[30rem] rounded-full bg-[#fff3cb] blur-3xl" />

        <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
          <Link
            href="/"
            className="mb-6 inline-flex w-fit items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#68408b] transition-colors hover:bg-white sm:mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke beranda
          </Link>

          <div className="grid flex-1 items-center gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#4c246c] via-[#693795] to-[#8856b4] p-6 text-white shadow-[0_24px_70px_rgba(86,45,120,0.18)] sm:p-9 lg:min-h-[33rem] lg:p-11"
            >
              <div className="absolute -right-20 -top-24 -z-10 h-72 w-72 rounded-full bg-[#c89cf1]/20 blur-3xl" />
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                  <Award className="h-6 w-6 text-[#ffdb68]" fill="currentColor" />
                </span>
                <span>
                  <span className="block text-lg font-bold tracking-tight">SertifChain</span>
                  <span className="block text-[11px] font-medium tracking-[0.12em] text-white/65">
                    PORTAL ADMIN
                  </span>
                </span>
              </div>

              <div className="mt-8 sm:mt-12">
                <p className="text-xs font-bold tracking-[0.16em] text-[#f3e8ff]">
                  PENGELOLAAN SERTIFIKAT DIGITAL
                </p>
                <h1 className="mt-3 max-w-lg text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                  Kelola pencapaian siswa dengan lebih mudah.
                </h1>
                <p className="mt-4 max-w-md text-sm leading-6 text-white/75 sm:text-base">
                  Satu tempat untuk mengatur batch, data siswa, dan sertifikat
                  digital dengan aman.
                </p>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:mt-10 lg:grid-cols-1">
                {[
                  "Kelola batch dan data siswa",
                  "Terbitkan sertifikat digital",
                  "Pantau status klaim dan verifikasi",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm font-medium text-white/90">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[#ffdb68]">
                      <BadgeCheck className="h-4 w-4" />
                    </span>
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-8 hidden items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 lg:flex">
                <LockKeyhole className="h-5 w-5 shrink-0 text-[#ffdb68]" />
                <p className="text-xs leading-5 text-white/75">
                  Portal khusus pengelola. Pastikan informasi akun Anda tetap
                  rahasia.
                </p>
              </div>
            </motion.section>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto w-full max-w-xl"
            >
              <Card variant="white" className="!rounded-[1.75rem] !border-[#eee9f3] !p-5 !shadow-[0_18px_50px_rgba(54,34,72,0.08)] sm:!p-8">
                <CardHeader className="mb-6">
                  <p className="mb-2 text-xs font-bold tracking-[0.14em] text-[#815ba0]">
                    {view === "login" ? "SELAMAT DATANG KEMBALI" : "MULAI MENGELOLA"}
                  </p>
                  <CardTitle as="h2" className="!text-2xl !font-bold !text-[#30243b] sm:!text-3xl">
                    {titles[view]}
                  </CardTitle>
                  <CardDescription className="!mt-2 !text-sm !leading-6 !text-[#81788a]">
                    {descriptions[view]}
                  </CardDescription>
                </CardHeader>
                <CardContent className="!space-y-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              {view === "register" && (
                <Input
                  label="Nama"
                  name="name"
                  placeholder="Nama lengkap"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  error={errors.name}
                  disabled={isLoading}
                  autoComplete="name"
                />
              )}

              <Input
                label="Email"
                type="email"
                name="email"
                placeholder="admin@bimbel.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                error={errors.email}
                disabled={isLoading}
                autoComplete="email"
              />

              <div className="w-full">
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-[#49365b]"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isLoading}
                    autoComplete={
                      view === "login" ? "current-password" : "new-password"
                    }
                    className="input-brutal w-full pr-14 !shadow-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg border border-[#eee9f3] bg-[#faf8fc] p-2 text-[#68408b] transition-colors hover:bg-[#f1e9f8]"
                    aria-label={
                      showPassword ? "Sembunyikan password" : "Lihat password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 flex items-center gap-2 text-sm font-medium text-rose-700">
                    <CircleAlert className="h-4 w-4 shrink-0" />
                    {errors.password}
                  </p>
                )}
                {view === "register" && (
                  <p className="mt-1 text-xs text-[#81788a]">
                    Gunakan 8 sampai 72 karakter.
                  </p>
                )}
              </div>

              {view === "register" && (
                <Input
                  label="Konfirmasi Password"
                  type="password"
                  name="confirmPassword"
                  placeholder="Ulangi password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  error={errors.confirmPassword}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              )}

              <Button
                type="submit"
                variant="black"
                className="!mt-6 !w-full !rounded-xl !bg-[#5b2b82] !py-3.5 hover:!bg-[#472064]"
                isLoading={isLoading}
                rightIcon={
                  view === "login" ? (
                    <LogIn className="h-5 w-5" />
                  ) : (
                    <UserPlus className="h-5 w-5" />
                  )
                }
              >
                {submitLabels[view]}
              </Button>
            </form>

            <div className="mt-5 flex flex-col items-center gap-3 text-sm">
              {view === "login" && (
                <>
                  <p className="text-[#81788a]">
                    Belum punya akun?{" "}
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-semibold text-[#68408b] hover:text-[#472064] hover:underline"
                      onClick={() => {
                        resetErrors();
                        setView("register");
                      }}
                    >
                      Buat akun
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </p>
                </>
              )}
              {view === "register" && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 font-semibold text-[#68408b] hover:text-[#472064] hover:underline"
                  onClick={() => {
                    resetErrors();
                    setView("login");
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Kembali ke login
                </button>
              )}
            </div>
                </CardContent>
              </Card>
              <p className="mt-5 flex items-center justify-center gap-2 text-xs text-[#81788a]">
                <LockKeyhole className="h-3.5 w-3.5 text-[#7650a1]" />
                Area terbatas untuk admin
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
