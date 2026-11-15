"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, MotionConfig } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Confetti } from "@/components/decorations/Confetti";
import toast from "react-hot-toast";
import {
  Award, Download, CheckCircle, ArrowLeft, XCircle, ShieldCheck,
  Calendar, Hash, FolderKanban, Sparkles, Star,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface TextPositionData {
  field: "name" | "batch" | "code" | "date";
  x: number;
  y: number;
  fontSize: number;
  fontWeight: "bold" | "normal";
  fontFamily?: string;
  color: string;
  align: "center" | "left" | "right";
  label: string;
}

interface TemplateData {
  id: string;
  name: string;
  config: any;
  background_image_url: string | null;
  text_positions: TextPositionData[] | null;
  page_orientation: string | null;
}

interface Student {
  id: string;
  name: string;
  unique_code: string;
  status: string;
  claimed_at: string | null;
  batches: {
    name: string;
    description?: string;
    certificate_templates?: TemplateData | null;
  };
}

// ── Preview Sertifikat ─────────────────────────────────────────────────────────

function CertificatePreview({ student, template }: { student: Student; template: TemplateData | null }) {
  const hasImage = !!template?.background_image_url;

  if (hasImage && template) {
    // ── Preview Template Upload Gambar ──
    const isPortrait = template.page_orientation === "portrait";
    const positions = template.text_positions || [];

    // Nilai yang dioverlay
    const fieldValues: Record<string, string> = {
      name:  student.name,
      batch: student.batches.name,
      code:  student.unique_code,
      date:  student.claimed_at
        ? new Date(student.claimed_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
        : new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
    };

    return (
      <div className="w-full">
        <div
          className="certificate-preview relative w-full border-3 border-black overflow-hidden bg-gray-100 shadow-brutal"
          style={{ aspectRatio: isPortrait ? "595/842" : "842/595" }}
        >
          {/* Background gambar */}
          <img
            src={template.background_image_url!}
            alt={`Template ${template.name}`}
            className="w-full h-full object-fill"
          />

          {/* Overlay teks */}
          {positions.map((pos, idx) => {
            const value = fieldValues[pos.field];
            if (!value) return null;

            // CSS: top = 100 - y (karena PDF y=0 di bawah, CSS top=0 di atas)
            const topPct  = 100 - pos.y;
            const leftPct = pos.x;

            // Estimasi font size relatif untuk preview (sertifikat = 842px lebar di PDF)
            // Preview container bisa berapa saja, jadi kita skala relatif
            const pdfRefWidth = isPortrait ? 595 : 842;
            const fontSizePct = (pos.fontSize / pdfRefWidth) * 100;

            return (
              <div
                key={idx}
                className="absolute pointer-events-none"
                style={{
                  left:   `${leftPct}%`,
                  top:    `${topPct}%`,
                  transform: `translateY(-50%) ${
                    pos.align === "center" ? "translateX(-50%)" :
                    pos.align === "right"  ? "translateX(-100%)" : "translateX(0)"
                  }`,
                  // Font size sebagai % container width agar proporsional
                  fontSize:   `${fontSizePct}vw`,
                  fontWeight: pos.fontWeight === "bold" ? "bold" : "normal",
                  color:      pos.color || "#000000",
                  whiteSpace: "nowrap",
                  lineHeight: 1.2,
                  // Text shadow tipis agar terbaca di semua background
                  textShadow: "0 1px 3px rgba(0,0,0,0.15)",
                }}
              >
                {value}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-black/50 text-center mt-2 font-semibold">
          Preview sertifikat · Template: {template.name}
        </p>
      </div>
    );
  }

  // ── Preview Template Generated (Klasik / Kids / Default) ──
  const cfg = template?.config;
  const isKids = cfg?.style === "kids";

  const primary   = cfg?.primaryColor   ? toCssRgb(cfg.primaryColor)   : "#152066";
  const secondary = cfg?.secondaryColor ? toCssRgb(cfg.secondaryColor) : "#d9a520";
  const bgColor   = cfg?.bgColor        ? toCssRgb(cfg.bgColor)        : "#faf7ee";
  const mint      = "#3ecfa8";

  return (
    <div className="w-full">
      <div
        className="certificate-preview w-full border-3 border-black shadow-brutal p-0 overflow-hidden"
        style={{ background: bgColor, aspectRatio: "842/595" }}
      >
        {/* Outer border */}
        <div className="absolute inset-2 pointer-events-none"
          style={{ border: `4px solid ${primary}`, position: "absolute" }} />

        <div className="w-full h-full flex flex-col relative">
          {/* Header */}
          <div className="flex-shrink-0 py-3 px-6 flex items-center justify-center"
            style={{ background: primary }}>
            <h2 className="font-bold text-lg md:text-2xl tracking-wider text-center"
              style={{ color: secondary, fontFamily: "serif" }}>
              {cfg?.titleText || "SERTIFIKAT PENGHARGAAN"}
            </h2>
            {isKids && (
              <>
                <Star className="absolute left-4 h-4 w-4" style={{ color: secondary }} fill="currentColor" />
                <Star className="absolute right-4 h-4 w-4" style={{ color: secondary }} fill="currentColor" />
              </>
            )}
          </div>

          {/* Subtitle */}
          <div className="text-center py-1.5">
            {isKids ? (
              <span className="inline-block px-4 py-1 text-sm font-bold text-white"
                style={{ background: secondary }}>
                {cfg?.subtitleText || "Selamat! Kamu Berhasil!"}
              </span>
            ) : (
              <p className="text-xs italic" style={{ color: primary }}>
                {cfg?.subtitleText || "Certificate of Achievement"}
              </p>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-2 gap-1">
            <p className="text-xs text-gray-500">Diberikan kepada:</p>

            {/* Nama siswa */}
            <div className="px-6 py-2 text-center"
              style={{ background: isKids ? mint : undefined, border: `2px solid ${isKids ? "#0a0a0a" : secondary}` }}>
              <p className="font-bold text-lg md:text-2xl" style={{ color: isKids ? "#0a0a0a" : primary, fontFamily: "serif" }}>
                {student.name}
              </p>
            </div>

            <p className="text-xs text-gray-500 mt-1">
              Atas keberhasilan menyelesaikan program
            </p>
            <p className="font-bold text-sm" style={{ color: secondary }}>
              {student.batches.name}
            </p>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 py-1.5 px-6 flex items-center justify-between text-xs"
            style={{ background: primary, color: "white" }}>
            <span className="font-bold" style={{ color: secondary }}>
              Kode: {student.unique_code}
            </span>
            <span>{cfg?.footerText || "SertifChain · Sertifikat Digital"}</span>
          </div>
        </div>
      </div>
      <p className="text-xs text-black/50 text-center mt-2 font-semibold">
        Preview sertifikat · {template ? `Template: ${template.name}` : "Template Default"}
      </p>
    </div>
  );
}

// Helper: [r,g,b] 0-1 → css rgb string
function toCssRgb(arr: number[]): string {
  return `rgb(${Math.round(arr[0]*255)},${Math.round(arr[1]*255)},${Math.round(arr[2]*255)})`;
}

// ── Halaman Utama ──────────────────────────────────────────────────────────────

export default function ClaimPage() {
  const params   = useParams();
  const router   = useRouter();
  const studentId = params.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => { fetchStudentData(); }, [studentId]);

  const fetchStudentData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/certificate/${studentId}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setStudent(data.student);

      if (data.student.status === "claimed") {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    } catch (error) {
      console.error("Fetch student error:", error);
      toast.error("Gagal memuat data sertifikat");
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!student) return;
    setIsClaiming(true);
    try {
      const response = await fetch(`/api/claim/${studentId}`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) { toast.error(data.error || "Gagal mengklaim"); return; }

      toast.success("Sertifikat berhasil diklaim");
      setStudent(data.student);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3500);
    } catch {
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsClaiming(false);
    }
  };

  const handleDownload = () => {
    window.open(`/api/certificate/${studentId}/download`, "_blank");
    toast.success("Download dimulai...");
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbfaff]">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-2 border-[#5b2b82] border-t-transparent" />
          <p className="font-medium text-[#81788a]">Memuat sertifikat...</p>
        </div>
      </div>
    );
  }

  // ── Not found ──
  if (!student) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbfaff] p-4">
        <Card variant="white" className="!rounded-3xl !border-[#eee9f3] !shadow-[0_12px_36px_rgba(54,34,72,0.06)]">
          <CardContent>
            <div className="text-center py-12">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <XCircle className="h-7 w-7" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-[#30243b]">Sertifikat tidak ditemukan</h2>
              <p className="mb-6 text-[#81788a]">Data tidak ditemukan atau sudah dihapus.</p>
              <Link href="/">
                <Button variant="black" className="!rounded-xl !bg-[#5b2b82] hover:!bg-[#472064]">
                  Kembali ke beranda
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isClaimed = student.status === "claimed";
  const template  = (student.batches as any)?.certificate_templates ?? null;

  return (
    <MotionConfig reducedMotion="user">
    <div className="relative min-h-screen bg-[#fbfaff] text-[#292333]">
      {showConfetti && <Confetti count={35} />}

      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-[#eee9f3] bg-white/95">
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
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#5b2b82] transition-colors hover:bg-[#f5effa]"
          >
            <ArrowLeft className="h-4 w-4" />
            Beranda
          </Link>
        </nav>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl space-y-6"
        >

          {/* Status Banner */}
          {isClaimed ? (
            <Card variant="mint" className="!rounded-2xl !border-emerald-200 !bg-emerald-50 !shadow-none">
              <CardContent>
                <div className="flex items-center gap-4 py-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="mb-0.5 text-lg font-bold text-emerald-900">Sertifikat sudah diklaim</h3>
                    <p className="text-sm text-emerald-800">
                      Diklaim pada{" "}
                      {student.claimed_at &&
                        new Date(student.claimed_at).toLocaleDateString("id-ID", {
                          day: "numeric", month: "long", year: "numeric",
                        })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card variant="yellow" className="!rounded-2xl !border-amber-200 !bg-amber-50 !shadow-none">
              <CardContent>
                <div className="flex items-center gap-4 py-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white text-amber-700">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="mb-0.5 text-lg font-bold text-amber-950">Sertifikat ditemukan</h3>
                    <p className="text-sm text-amber-900">
                      Klaim sertifikat Anda untuk mengunduh salinannya.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview Sertifikat — gambar asli atau generated */}
          <Card variant="white" className="!rounded-2xl !border-[#eee9f3] !shadow-[0_12px_36px_rgba(54,34,72,0.06)]">
            <CardHeader>
              <CardTitle as="h2">Preview Sertifikat</CardTitle>
              <CardDescription>Tampilan sertifikat yang akan Anda terima</CardDescription>
            </CardHeader>
            <CardContent>
              <CertificatePreview student={student} template={template} />
            </CardContent>
          </Card>

          {/* Detail info */}
          <Card variant="white" className="!rounded-2xl !border-[#eee9f3] !shadow-[0_12px_36px_rgba(54,34,72,0.06)]">
            <CardHeader>
              <CardTitle as="h3">Detail Sertifikat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl border border-[#eee9f3] bg-[#faf8fc] p-4">
                  <Hash className="h-5 w-5 flex-shrink-0 text-[#896da0]" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase text-[#81788a]">Kode unik</p>
                    <code className="text-lg font-semibold text-[#30243b]">{student.unique_code}</code>
                  </div>
                  <Badge variant="yellow">Terverifikasi</Badge>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-[#eee9f3] bg-[#faf8fc] p-4">
                  <FolderKanban className="h-5 w-5 flex-shrink-0 text-[#896da0]" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase text-[#81788a]">Batch / program</p>
                    <p className="font-semibold text-[#30243b]">{student.batches.name}</p>
                    {student.batches.description && (
                      <p className="text-sm text-[#81788a]">{student.batches.description}</p>
                    )}
                  </div>
                </div>

                {isClaimed && student.claimed_at && (
                  <div className="flex items-center gap-3 rounded-xl border border-[#eee9f3] bg-[#faf8fc] p-4">
                    <Calendar className="h-5 w-5 flex-shrink-0 text-[#896da0]" />
                    <div>
                      <p className="text-xs font-semibold uppercase text-[#81788a]">Tanggal klaim</p>
                      <p className="font-semibold text-[#30243b]">
                        {new Date(student.claimed_at).toLocaleDateString("id-ID", {
                          day: "numeric", month: "long", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Tombol aksi */}
              <div className="mt-6 space-y-3">
                {!isClaimed ? (
                  <Button variant="black" className="!w-full !rounded-xl !bg-[#5b2b82] hover:!bg-[#472064]" onClick={handleClaim}
                    isLoading={isClaiming} rightIcon={<CheckCircle className="w-5 h-5" />}>
                    Klaim Sertifikat
                  </Button>
                ) : (
                  <>
                    <Button variant="black" className="!w-full !rounded-xl !bg-[#5b2b82] hover:!bg-[#472064]" onClick={handleDownload}
                      rightIcon={<Download className="w-5 h-5" />}>
                      Download Sertifikat PDF
                    </Button>
                    {/* Tombol verifikasi keaslian */}
                    <Link href={`/verify?code=${student.unique_code}`} target="_blank">
                      <Button variant="white" className="!w-full !rounded-xl !border-[#e8e2ed] !shadow-none"
                        leftIcon={<ShieldCheck className="h-4 w-4" />}>
                        Verifikasi Keaslian di Blockchain
                      </Button>
                    </Link>
                  </>
                )}
                <Link href="/">
                  <Button variant="white" className="!w-full !rounded-xl !border-[#e8e2ed] !shadow-none">Kembali ke Beranda</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Info card */}
          <Card variant="pink" className="!rounded-2xl !border-[#eee9f3] !bg-[#f7f3fa] !shadow-none">
            <CardContent>
              <div className="py-3">
                <h4 className="font-bold mb-2 flex items-center gap-2">
                  <Award className="w-5 h-5" /> Tentang Sertifikat Digital
                </h4>
                <ul className="space-y-2 text-sm font-medium text-[#6e6478]">
                  <li>• Sertifikat dapat didownload dalam format PDF setelah diklaim</li>
                  <li>• Sertifikat yang sudah diklaim tidak bisa diklaim ulang</li>
                  <li>• Simpan file PDF untuk keperluan masa depan</li>
                  <li>• Kode unik digunakan untuk verifikasi keaslian</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
    </MotionConfig>
  );
}
