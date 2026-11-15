"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
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
import { ArrowLeft, LogIn, Shield, Eye, EyeOff, UserPlus } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-cream relative overflow-hidden">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow border border-slate-200 rounded-xl shadow-sm mb-4">
            <Shield className="w-10 h-10 text-[#2878b8]" />
          </div>
          <h1 className="heading-brutal text-4xl md:text-5xl mb-2">
            SertifChain
          </h1>
          <p className="text-lg font-semibold text-black/70">
            Portal Admin 
          </p>
        </div>

        <Card variant="white">
          <CardHeader>
            <CardTitle as="h2">{titles[view]}</CardTitle>
            <CardDescription>{descriptions[view]}</CardDescription>
          </CardHeader>
          <CardContent>
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
                  className="block mb-2 text-sm font-bold text-black uppercase tracking-wide"
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
                    className="input-brutal w-full pr-14"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 border border-slate-200 rounded-md bg-slate-50 hover:bg-slate-100 transition-colors"
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
                  <p className="mt-2 text-sm font-semibold text-red-600">
                    {errors.password}
                  </p>
                )}
                {view === "register" && (
                  <p className="mt-1 text-xs text-slate-600">
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
                variant="yellow"
                className="w-full mt-6"
                isLoading={isLoading}
                rightIcon={
                  view === "login" ? (
                    <LogIn className="w-5 h-5" />
                  ) : (
                    <UserPlus className="w-5 h-5" />
                  )
                }
              >
                {submitLabels[view]}
              </Button>
            </form>

            <div className="mt-5 flex flex-col items-center gap-3 text-sm">
              {view === "login" && (
                <>
                  <p className="text-slate-700">
                    Belum punya akun?{" "}
                    <button
                      type="button"
                      className="font-semibold text-[#21699f] hover:underline"
                      onClick={() => {
                        resetErrors();
                        setView("register");
                      }}
                    >
                      Buat akun
                    </button>
                  </p>
                </>
              )}
              {view === "register" && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 font-semibold text-[#21699f] hover:underline"
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

        <div className="mt-6 text-center">
          <div className="inline-block bg-pink-light border border-slate-200 rounded-md px-4 py-2">
            <p className="text-sm font-bold">🔒 Area terbatas untuk admin</p>
          </div>
        </div>
      </div>
    </div>
  );
}
