"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Confetti } from "@/components/decorations/Confetti";
import toast from "react-hot-toast";
import {
  Award, Download, CheckCircle, ArrowLeft,
  Calendar, Hash, FolderKanban, Sparkles,
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
                <span className="absolute left-4 text-xl" style={{ color: secondary }}>★</span>
                <span className="absolute right-4 text-xl" style={{ color: secondary }}>★</span>
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

      toast.success("Sertifikat berhasil diklaim! 🎉");
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
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-3 border-black border-t-transparent rounded-full animate-spin mb-4" />
          <p className="font-semibold text-black/60">Memuat sertifikat...</p>
        </div>
      </div>
    );
  }

  // ── Not found ──
  if (!student) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <Card variant="white">
          <CardContent>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">❌</div>
              <h2 className="heading-brutal text-2xl mb-2">Sertifikat Tidak Ditemukan</h2>
              <p className="text-black/60 mb-6">Data tidak ditemukan atau sudah dihapus.</p>
              <Link href="/"><Button variant="yellow">Kembali ke Beranda</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isClaimed = student.status === "claimed";
  const template  = (student.batches as any)?.certificate_templates ?? null;

  return (
    <div className="min-h-screen bg-cream relative">
      {showConfetti && <Confetti count={35} />}

      {/* Nav */}
      <nav className="border-b-3 border-black bg-white sticky top-0 z-20">
        <div className="container-brutal py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow border-3 border-black shadow-brutal flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h1 className="heading-brutal text-xl leading-tight">SertifChain</h1>
              <p className="text-xs font-bold text-black/60">Sertifikat Digital</p>
            </div>
          </div>
          <Link href="/">
            <Button variant="white" leftIcon={<ArrowLeft className="w-4 h-4" />}>Beranda</Button>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="container-brutal py-10">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Status Banner */}
          {isClaimed ? (
            <Card variant="mint">
              <CardContent>
                <div className="flex items-center gap-4 py-3">
                  <div className="p-3 bg-mint border-3 border-black shadow-brutal flex-shrink-0">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="heading-brutal text-xl mb-0.5">Sertifikat Sudah Diklaim! 🎉</h3>
                    <p className="text-sm text-black/70 font-semibold">
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
            <Card variant="yellow">
              <CardContent>
                <div className="flex items-center gap-4 py-3">
                  <div className="p-3 bg-orange border-3 border-black shadow-brutal flex-shrink-0">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="heading-brutal text-xl mb-0.5">Sertifikat Ditemukan!</h3>
                    <p className="text-sm text-black/70 font-semibold">
                      Klik "Klaim Sertifikat" untuk mengambil sertifikat Anda
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview Sertifikat — gambar asli atau generated */}
          <Card variant="white">
            <CardHeader>
              <CardTitle as="h2">Preview Sertifikat</CardTitle>
              <CardDescription>Tampilan sertifikat yang akan Anda terima</CardDescription>
            </CardHeader>
            <CardContent>
              <CertificatePreview student={student} template={template} />
            </CardContent>
          </Card>

          {/* Detail info */}
          <Card variant="white">
            <CardHeader>
              <CardTitle as="h3">Detail Sertifikat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-cream border-2 border-black">
                  <Hash className="w-5 h-5 text-black/60 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-black/60 uppercase">Kode Unik</p>
                    <code className="text-lg font-bold">{student.unique_code}</code>
                  </div>
                  <Badge variant="yellow">Terverifikasi</Badge>
                </div>

                <div className="flex items-center gap-3 p-4 bg-cream border-2 border-black">
                  <FolderKanban className="w-5 h-5 text-black/60 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-black/60 uppercase">Batch / Program</p>
                    <p className="font-bold">{student.batches.name}</p>
                    {student.batches.description && (
                      <p className="text-sm text-black/60">{student.batches.description}</p>
                    )}
                  </div>
                </div>

                {isClaimed && student.claimed_at && (
                  <div className="flex items-center gap-3 p-4 bg-cream border-2 border-black">
                    <Calendar className="w-5 h-5 text-black/60 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-black/60 uppercase">Tanggal Klaim</p>
                      <p className="font-bold">
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
                  <Button variant="yellow" className="w-full" onClick={handleClaim}
                    isLoading={isClaiming} rightIcon={<CheckCircle className="w-5 h-5" />}>
                    Klaim Sertifikat
                  </Button>
                ) : (
                  <>
                    <Button variant="mint" className="w-full" onClick={handleDownload}
                      rightIcon={<Download className="w-5 h-5" />}>
                      Download Sertifikat PDF
                    </Button>
                    {/* Tombol verifikasi keaslian */}
                    <Link href={`/verify?code=${student.unique_code}`} target="_blank">
                      <Button variant="white" className="w-full"
                        leftIcon={<span>🔗</span>}>
                        Verifikasi Keaslian di Blockchain
                      </Button>
                    </Link>
                  </>
                )}
                <Link href="/">
                  <Button variant="white" className="w-full">Kembali ke Beranda</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Info card */}
          <Card variant="pink">
            <CardContent>
              <div className="py-3">
                <h4 className="font-bold mb-2 flex items-center gap-2">
                  <Award className="w-5 h-5" /> Tentang Sertifikat Digital
                </h4>
                <ul className="text-sm space-y-1 text-black/80 font-semibold">
                  <li>• Sertifikat dapat didownload dalam format PDF setelah diklaim</li>
                  <li>• Sertifikat yang sudah diklaim tidak bisa diklaim ulang</li>
                  <li>• Simpan file PDF untuk keperluan masa depan</li>
                  <li>• Kode unik digunakan untuk verifikasi keaslian</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
