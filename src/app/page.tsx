"use client";

import { useState } from "react";
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
import { Award, Search, Shield, Star, Trophy, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    unique_code: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nama wajib diisi";
    }

    if (!formData.unique_code.trim()) {
      newErrors.unique_code = "Kode unik wajib diisi";
    } else if (formData.unique_code.trim().length < 6) {
      newErrors.unique_code = "Kode unik minimal 6 karakter";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Sertifikat tidak ditemukan");
        return;
      }

      toast.success("Sertifikat ditemukan! 🎉");
      router.push(`/claim/${data.student.id}`);
    } catch (error) {
      console.error("Claim search error:", error);
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream relative overflow-x-clip">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b-3 border-black bg-white">
        <div className="container-brutal py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow border-3 border-black shadow-brutal flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h1 className="heading-brutal text-xl leading-tight">SertifChain</h1>
                <p className="text-xs font-bold text-black/60">Sertifikat Digital</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/admin/login">
                <Button variant="white" leftIcon={<Shield className="w-4 h-4" />}>
                  Admin
                </Button>
              </Link>
              <Link href="/verify">
                <Button variant="mint" leftIcon={<CheckCircle className="w-4 h-4" />}>
                  Verifikasi
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 container-brutal py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          {/* Hero Content */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="w-16 h-16 bg-yellow border-3 border-black shadow-brutal rotate-playful-2 flex items-center justify-center">
                <Trophy className="w-8 h-8" />
              </div>
              <div className="w-16 h-16 bg-pink border-3 border-black shadow-brutal rotate-playful-1 flex items-center justify-center">
                <Star className="w-8 h-8 text-[#a04e70]" />
              </div>
              <div className="w-16 h-16 bg-mint border-3 border-black shadow-brutal rotate-playful-3 flex items-center justify-center">
                <Award className="w-8 h-8" />
              </div>
            </div>

            <h4 className="heading-brutal text-3xl md:text-5xl mb-3">
              Klaim Sertifikat
              <br />
              <span className="text-yellow">Digital</span> Kamu!
            </h4>

            <p className="text-base md:text-lg text-black/70 font-semibold max-w-2xl mx-auto">
              Masukkan nama dan kode unik yang kamu terima untuk mendapatkan
              sertifikat digital kamu. Mudah, cepat, dan aman! 🎉
            </p>
          </div>

          {/* Search Form Card */}
          <Card variant="white" className="max-w-xl mx-auto p-5 rotate-playful-1">
            <CardHeader className="mb-3">
              <CardTitle as="h2" className="text-lg md:text-xl">
                Cari Sertifikat Kamu
              </CardTitle>
              <CardDescription className="text-sm">
                Masukkan nama lengkap dan kode unik yang sudah diberikan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                  label="Nama Lengkap"
                  name="name"
                  placeholder="Contoh: Budi Santoso"
                  className="py-2.5"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  disabled={isLoading}
                  required
                />

                <Input
                  label="Kode Unik"
                  name="unique_code"
                  placeholder="Contoh: ABC12345"
                  className="py-2.5"
                  value={formData.unique_code}
                  onChange={handleChange}
                  error={errors.unique_code}
                  disabled={isLoading}
                  required
                  helperText="Kode unik yang diberikan oleh bimbel (8 karakter)"
                />

                <Button
                  type="submit"
                  variant="yellow"
                  className="w-full mt-6"
                  isLoading={isLoading}
                  rightIcon={<Search className="w-5 h-5" />}
                >
                  Cari Sertifikat
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-12">
            <Card variant="yellow">
              <CardContent>
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">🔍</div>
                  <h3 className="font-bold mb-1">Cari</h3>
                  <p className="text-sm text-black/70">
                    Masukkan nama dan kode unik
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card variant="pink">
              <CardContent>
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">✅</div>
                  <h3 className="font-bold mb-1">Klaim</h3>
                  <p className="text-sm text-black/70">
                    Konfirmasi dan klaim sertifikat
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card variant="mint" className="bg-mint">
              <CardContent>
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">📥</div>
                  <h3 className="font-bold mb-1">Download</h3>
                  <p className="text-sm text-black/70">
                    Download sertifikat PDF
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Card Verifikasi — clickable langsung ke /verify */}
            <Link href="/verify" className="block">
              <div className="border-3 border-black shadow-brutal hover:shadow-brutal-lg bg-white hover:bg-sky/20 hover:translate-x-0.5 hover:translate-y-0.5 transition-all h-full cursor-pointer">
                <div className="text-center py-6 px-4">
                  <div className="text-4xl mb-2">🔗</div>
                  <h3 className="font-bold mb-1">Verifikasi</h3>
                  <p className="text-sm text-black/70 mb-3">
                    Cek keaslian sertifikat
                  </p>
                  <span className="inline-block text-xs font-bold px-2 py-1 bg-sky border-2 border-black">
                    Klik di sini →
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Banner Verifikasi */}
          <div className="mt-8">
            <Link href="/verify">
              <div className="border border-slate-200 rounded-lg bg-sky p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow border-2 border-yellow flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-[#2878b8]" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">Verifikasi Keaslian Sertifikat</p>
                    <p className="text-sm text-slate-600">
                      Cek apakah sertifikat asli via kode unik atau upload file PDF · Terverifikasi di Ethereum Blockchain
                    </p>
                  </div>
                </div>
                <span className="px-4 py-2 bg-white text-[#2878b8] font-semibold border border-slate-200 rounded-md text-sm flex-shrink-0">
                  Verifikasi Sekarang →
                </span>
              </div>
            </Link>
          </div>

          {/* Help Section */}
          <div className="mt-12 text-center">
            <div className="inline-block bg-pink-light border-2 border-black px-6 py-4 rotate-playful-2">
              <p className="font-bold mb-2">💡 Butuh Bantuan?</p>
              <p className="text-sm text-black/70">
                Hubungi bimbel kamu untuk mendapatkan kode unik
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t-3 border-black bg-white mt-20">
        <div className="container-brutal py-6">
          <div className="text-center">
            <p className="font-semibold text-sm text-black/60">
              © 2026 SertifChain - Platform Sertifikat Digital 
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
