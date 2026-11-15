"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Award, Search, CheckCircle, XCircle, ExternalLink,
  Shield, Hash, Calendar, FolderKanban, ArrowLeft,
  Copy, Check, AlertTriangle, Loader2, Upload,
  FileText, FileCheck, FileX,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────
interface BlockchainData {
  status: "valid" | "revoked" | "not_found" | "not_configured" | "unavailable";
  verified:    boolean;
  certHash:    string | null;
  issuedAt:    string | null;
  studentName: string | null;
  batchName:   string | null;
  explorerUrl: string | null;
}
interface StudentData {
  name: string; uniqueCode: string; batchName: string;
  status: string; claimedAt: string | null;
}
interface VerifyResult {
  valid: boolean;
  databaseFound: boolean;
  claimed: boolean;
  matchesDatabase: boolean | null;
  source?: string; nameMatch?: boolean; batchMatch?: boolean;
  pdfMetadata?: { uniqueCode: string; studentName: string; batchName: string };
  student: StudentData; blockchain: BlockchainData; error?: string;
}
type TabType = "code" | "pdf";

// ── CopyBtn ──────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 border-2 border-black bg-white hover:bg-yellow transition-colors flex-shrink-0" title="Copy">
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

// ── Result Panel ─────────────────────────────────────────────────
function ResultPanel({ result }: { result: VerifyResult }) {
  const hasBlockchain = result.blockchain?.status === "valid";
  const isClaimed = result.claimed;
  const dataMatches =
    result.matchesDatabase !== false &&
    result.nameMatch !== false &&
    result.batchMatch !== false;
  const fullyVerified = isClaimed && hasBlockchain && dataMatches;

  return (
    <div className="space-y-4">
      {/* Status */}
      {fullyVerified ? (
        <div className="border-3 border-black bg-mint p-5 shadow-brutal">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white border-3 border-black flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-7 h-7 text-mint" />
            </div>
            <div className="flex-1">
              <h3 className="heading-brutal text-2xl">✅ SERTIFIKAT ASLI</h3>
              <p className="text-sm font-semibold mt-0.5">
                Terverifikasi di database <strong>+</strong> Ethereum Blockchain
              </p>
            </div>
            <Badge variant="black">🔗 On-Chain</Badge>
          </div>
        </div>
      ) : !result.databaseFound && hasBlockchain ? (
        <div className="border-3 border-black bg-yellow p-5 shadow-brutal">
          <div className="flex items-center gap-4">
            <AlertTriangle className="w-10 h-10 flex-shrink-0" />
            <div>
              <h3 className="heading-brutal text-2xl">TERCATAT DI BLOCKCHAIN</h3>
              <p className="text-sm font-semibold mt-0.5">
                Data sertifikat tidak ditemukan di database aplikasi. Periksa sumber data sebelum menyatakan cocok.
              </p>
            </div>
          </div>
        </div>
      ) : isClaimed ? (
        <div className="border-3 border-black bg-yellow p-5 shadow-brutal">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white border-3 border-black flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="heading-brutal text-2xl">KLAIM TERCATAT DI DATABASE</h3>
              <p className="text-sm font-semibold mt-0.5">
                {result.matchesDatabase === false
                  ? "Data nama atau batch berbeda dengan catatan blockchain."
                  : result.blockchain.status === "unavailable"
                    ? "Blockchain tidak dapat dihubungi; validitas on-chain belum dipastikan."
                    : result.blockchain.status === "not_configured"
                      ? "Blockchain belum dikonfigurasi untuk pemeriksaan."
                      : result.blockchain.status === "revoked"
                        ? "Sertifikat pada blockchain sudah dicabut."
                        : "Sertifikat belum ditemukan atau belum terkonfirmasi di blockchain."}
              </p>
            </div>
          </div>
        </div>
      ) : hasBlockchain ? (
        <div className="border-3 border-black bg-orange p-5 shadow-brutal">
          <div className="flex items-center gap-4">
            <AlertTriangle className="w-10 h-10 flex-shrink-0" />
            <div>
              <h3 className="heading-brutal text-2xl">STATUS KLAIM TIDAK SELARAS</h3>
              <p className="text-sm font-semibold mt-0.5">
                Sertifikat aktif di blockchain, tetapi belum berstatus diklaim di database.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-3 border-black bg-orange p-5 shadow-brutal">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white border-3 border-black flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-7 h-7 text-orange" />
            </div>
            <div>
              <h3 className="heading-brutal text-2xl">
                {result.blockchain.status === "revoked"
                  ? "SERTIFIKAT DICABUT"
                  : result.databaseFound
                    ? "BELUM DIKLAIM"
                    : "TIDAK DITEMUKAN"}
              </h3>
              <p className="text-sm font-semibold mt-0.5">
                {result.blockchain.status === "revoked"
                  ? "Blockchain menunjukkan sertifikat ini sudah dicabut."
                  : result.databaseFound
                    ? "Sertifikat terdaftar di database tetapi belum diklaim siswa."
                    : "Sertifikat tidak ditemukan pada database dan blockchain."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Nama tidak cocok */}
      {(result.pdfMetadata &&
        (result.nameMatch === false || result.batchMatch === false)) ||
        result.matchesDatabase === false ? (
        <div className="border-2 border-orange bg-orange/20 p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-orange flex-shrink-0 mt-0.5" />
          <p className="text-sm font-bold">
            {result.nameMatch === false
              ? `Nama di PDF (${result.pdfMetadata?.studentName}) berbeda dengan data sertifikat (${result.student.name}).`
              : result.batchMatch === false
                ? `Batch di PDF (${result.pdfMetadata?.batchName}) berbeda dengan data sertifikat (${result.student.batchName}).`
                : "Nama atau batch di database berbeda dengan data blockchain. Sertifikat belum dapat dinyatakan cocok."}
          </p>
        </div>
      ) : null}

      {/* Detail */}
      <div className="border-3 border-black bg-white">
        <div className="px-5 py-3 border-b-3 border-black bg-cream">
          <p className="font-bold uppercase text-sm tracking-wide">Detail Sertifikat</p>
        </div>
        <div className="divide-y-2 divide-black/10">
          <div className="flex items-center gap-3 px-5 py-3">
            <Award className="w-4 h-4 text-black/40 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-black/50 uppercase font-bold">Nama Siswa</p>
              <p className="font-bold text-lg">{result.student.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-3">
            <Hash className="w-4 h-4 text-black/40 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-black/50 uppercase font-bold">Kode Unik</p>
              <code className="font-bold tracking-widest">{result.student.uniqueCode}</code>
            </div>
            <Badge variant={isClaimed ? "mint" : "yellow"}>
              {!result.databaseFound
                ? "Tidak ada di database"
                : isClaimed
                  ? "✓ Diklaim"
                  : "Belum Diklaim"}
            </Badge>
          </div>
          <div className="flex items-center gap-3 px-5 py-3">
            <FolderKanban className="w-4 h-4 text-black/40 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-black/50 uppercase font-bold">Program / Batch</p>
              <p className="font-bold">{result.student.batchName}</p>
            </div>
          </div>
          {result.student.claimedAt && (
            <div className="flex items-center gap-3 px-5 py-3">
              <Calendar className="w-4 h-4 text-black/40 flex-shrink-0" />
              <div>
                <p className="text-xs text-black/50 uppercase font-bold">Tanggal Klaim</p>
                <p className="font-bold">
                  {new Date(result.student.claimedAt).toLocaleDateString("id-ID", {
                    day: "numeric", month: "long", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Blockchain */}
      {result.blockchain && result.blockchain.status !== "not_configured" ? (
        <div className="border-3 border-black bg-white">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 text-slate-700 flex items-center justify-between">
            <p className="font-bold uppercase text-sm tracking-wide">🔗 Bukti Blockchain</p>
            <Badge variant="mint">Ethereum Sepolia</Badge>
          </div>
          <div className="p-5 space-y-3">
            <div className={`flex items-center gap-3 p-3 border-2 border-black ${
              hasBlockchain ? "bg-mint/20" : "bg-orange/20"
            }`}>
              {hasBlockchain
                ? <CheckCircle className="w-5 h-5 text-mint flex-shrink-0" />
                : <AlertTriangle className="w-5 h-5 text-orange flex-shrink-0" />}
              <div className="flex-1">
                <p className="font-bold text-sm">
                  {hasBlockchain
                    ? "Sertifikat valid dan aktif di blockchain"
                    : result.blockchain.status === "revoked"
                      ? "Sertifikat ditemukan tetapi sudah dicabut"
                      : result.blockchain.status === "unavailable"
                        ? "Blockchain tidak dapat dihubungi"
                        : "Kode tidak ditemukan di blockchain"}
                </p>
                <p className="text-xs text-black/60">
                  {hasBlockchain
                    ? "Data on-chain cocok dengan kode sertifikat"
                    : "Status ini tidak dianggap sebagai bukti sertifikat aktif"}
                </p>
              </div>
            </div>
            {result.blockchain.certHash && (
              <div className="p-3 bg-cream border-2 border-black">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold uppercase text-black/50">Certificate Hash (bytes32)</p>
                  <CopyBtn text={result.blockchain.certHash} />
                </div>
                <code className="text-xs break-all font-mono text-black/70 leading-relaxed">
                  {result.blockchain.certHash}
                </code>
              </div>
            )}
            {result.blockchain.explorerUrl && (
            <a href={result.blockchain.explorerUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-sky text-[#2878b8] border border-slate-200 rounded-lg hover:bg-yellow transition-colors shadow-sm">
              <ExternalLink className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-bold">Lihat di Sepolia Etherscan ↗</p>
                <p className="text-xs text-slate-600">Bukti permanen di Ethereum Sepolia Testnet</p>
              </div>
            </a>
            )}
          </div>
        </div>
      ) : isClaimed ? (
        <div className="border-3 border-black bg-yellow/30 p-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
          <div>
            <p className="font-bold text-sm">Blockchain sedang diproses...</p>
            <p className="text-xs text-black/60">Biasanya selesai 15-30 detik setelah klaim</p>
          </div>
        </div>
      ) : null}

      {/* Share */}
      <div className="border-3 border-black bg-white p-4">
        <p className="text-xs font-bold uppercase text-black/50 mb-2">Bagikan Link Verifikasi</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 bg-cream border-2 border-black text-xs font-mono truncate">
            {typeof window !== "undefined"
              ? `${window.location.origin}/verify?code=${result.student.uniqueCode}`
              : `/verify?code=${result.student.uniqueCode}`}
          </code>
          <CopyBtn text={typeof window !== "undefined"
            ? `${window.location.origin}/verify?code=${result.student.uniqueCode}`
            : `/verify?code=${result.student.uniqueCode}`} />
        </div>
      </div>
    </div>
  );
}

// ── Helper: fetch verify by code ──────────────────────────────────
async function fetchVerifyByCode(code: string): Promise<VerifyResult> {
  const res  = await fetch(`/api/verify?code=${encodeURIComponent(code)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Sertifikat tidak ditemukan");
  return data as VerifyResult;
}

// ── Helper: fetch verify by PDF ──────────────────────────────────
async function fetchVerifyByPdf(file: File): Promise<VerifyResult> {
  const fd = new FormData();
  fd.append("file", file);
  const res  = await fetch("/api/verify/pdf", { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Gagal memproses file");
  if (data.error && !data.student) throw new Error(data.error);
  return data as VerifyResult;
}

// ── Main Page Content ─────────────────────────────────────────────
function VerifyPageContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const inputRef     = useRef<HTMLInputElement>(null);
  const didInitRef   = useRef(false); // cegah double-call

  const [activeTab, setActiveTab] = useState<TabType>("code");
  const [result, setResult]       = useState<VerifyResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState("");
  const [code, setCode]           = useState(searchParams.get("code")?.toUpperCase() || "");
  const [pdfPreviewName, setPdfPreviewName] = useState("");

  // ── Verify by code ─────────────────────────────────────────────
  const doVerifyCode = useCallback(async (target: string) => {
    const clean = target.trim().toUpperCase();
    if (!clean) { setError("Masukkan kode unik sertifikat"); return; }

    setIsLoading(true);
    setResult(null);
    setError("");

    try {
      const data = await fetchVerifyByCode(clean);
      setResult(data);
      router.replace(`/verify?code=${clean}`, { scroll: false });
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // ── Auto-verify dari URL — hanya sekali ─────────────────────────
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const urlCode = searchParams.get("code");
    if (urlCode) {
      setCode(urlCode.toUpperCase());
      doVerifyCode(urlCode);
    } else {
      inputRef.current?.focus();
    }
  }, [doVerifyCode, searchParams]);

  // ── Verify by PDF ───────────────────────────────────────────────
  const doVerifyPdf = useCallback(async (file: File) => {
    setIsLoading(true);
    setResult(null);
    setError("");

    try {
      const data = await fetchVerifyByPdf(file);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Dropzone ────────────────────────────────────────────────────
  const onDrop = useCallback((accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;
    setPdfPreviewName(file.name);
    setResult(null);
    setError("");
    doVerifyPdf(file);
  }, [doVerifyPdf]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
    onDropRejected: () => setError("File harus PDF, maks 20MB"),
  });

  return (
    <div className="min-h-screen bg-cream">
      {/* Nav */}
      <nav className="border-b-3 border-black bg-white sticky top-0 z-20">
        <div className="container-brutal py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow border-3 border-black shadow-brutal flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h1 className="heading-brutal text-xl leading-tight">SertifChain</h1>
              <p className="text-xs font-bold text-black/60">Verifikasi Keaslian</p>
            </div>
          </div>
          <Link href="/"><Button variant="white" leftIcon={<ArrowLeft className="w-4 h-4" />}>Beranda</Button></Link>
        </div>
      </nav>

      <div className="container-brutal py-10">
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow border-3 border-black shadow-brutal mb-3">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="heading-brutal text-3xl mb-1">Cek Keaslian Sertifikat</h2>
            <p className="text-sm text-black/60 font-semibold">
              Masukkan kode unik <strong>atau</strong> upload file PDF sertifikat
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex border-3 border-black bg-white shadow-brutal">
            <button onClick={() => { setActiveTab("code"); setResult(null); setError(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 font-bold text-sm transition-all border-r-3 border-black
                ${activeTab === "code" ? "bg-yellow" : "bg-white hover:bg-yellow/30"}`}>
              <Hash className="w-4 h-4" /> Input Kode Unik
            </button>
            <button onClick={() => { setActiveTab("pdf"); setResult(null); setError(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 font-bold text-sm transition-all
                ${activeTab === "pdf" ? "bg-yellow" : "bg-white hover:bg-yellow/30"}`}>
              <Upload className="w-4 h-4" /> Upload File PDF
            </button>
          </div>

          {/* Tab: Input Kode */}
          {activeTab === "code" && (
            <div className="border-3 border-black bg-white shadow-brutal p-5">
              <label className="block text-xs font-bold uppercase tracking-wide mb-2">
                Kode Unik Sertifikat
              </label>
              <div className="flex gap-3">
                <input ref={inputRef} type="text" value={code}
                  onChange={e => { setCode(e.target.value.toUpperCase()); setError(""); setResult(null); }}
                  onKeyDown={e => e.key === "Enter" && doVerifyCode(code)}
                  placeholder="Contoh: ABC12345"
                  maxLength={12}
                  className="flex-1 px-4 py-3 text-lg font-bold border-3 border-black focus:outline-none bg-cream tracking-widest uppercase" />
                <Button variant="yellow" onClick={() => doVerifyCode(code)} isLoading={isLoading}
                  rightIcon={isLoading ? undefined : <Search className="w-5 h-5" />} className="flex-shrink-0">
                  {isLoading ? "Cek..." : "Verifikasi"}
                </Button>
              </div>
              {error && (
                <p className="mt-2 text-sm font-bold text-red-600 flex items-center gap-1">
                  <XCircle className="w-4 h-4" /> {error}
                </p>
              )}
              <p className="mt-2 text-xs text-black/50 font-semibold">
                Kode unik ada di bagian bawah sertifikat PDF
              </p>
            </div>
          )}

          {/* Tab: Upload PDF */}
          {activeTab === "pdf" && (
            <div className="border-3 border-black bg-white shadow-brutal p-5 space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wide">
                Upload File PDF Sertifikat
              </label>
              <div {...getRootProps()}
                className={`border-3 border-dashed border-black p-8 text-center cursor-pointer transition-all
                  ${isDragActive ? "bg-yellow/30 shadow-brutal" : "bg-cream hover:bg-yellow/10"}`}>
                <input {...getInputProps()} />
                {pdfPreviewName ? (
                  <div className="space-y-2">
                    {isLoading ? (
                      <><Loader2 className="w-10 h-10 animate-spin mx-auto" />
                        <p className="font-bold">Membaca metadata PDF...</p>
                        <p className="text-xs text-black/60">{pdfPreviewName}</p></>
                    ) : result ? (
                      <><FileCheck className="w-10 h-10 mx-auto text-mint" />
                        <p className="font-bold text-mint">PDF berhasil diverifikasi</p>
                        <p className="text-xs text-black/60">{pdfPreviewName}</p>
                        <p className="text-xs text-black/50">Klik untuk ganti file</p></>
                    ) : (
                      <><FileX className="w-10 h-10 mx-auto text-orange" />
                        <p className="font-bold">{pdfPreviewName}</p>
                        <p className="text-xs text-black/50">Klik untuk ganti file</p></>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-yellow border-3 border-black shadow-brutal mb-3">
                      <FileText className="w-7 h-7" />
                    </div>
                    <p className="font-bold mb-1">
                      {isDragActive ? "Drop file PDF di sini..." : "Drag & Drop atau Klik"}
                    </p>
                    <p className="text-sm text-black/60">File PDF sertifikat · Maks 20MB</p>
                  </>
                )}
              </div>
              {error && (
                <p className="text-sm font-bold text-red-600 flex items-center gap-1">
                  <XCircle className="w-4 h-4" /> {error}
                </p>
              )}
              {!result && !isLoading && (
                <div className="p-3 bg-sky/20 border-2 border-black text-xs font-semibold space-y-1">
                  <p className="font-bold">🔍 Cara kerja:</p>
                  <p>1. Sistem baca metadata tersembunyi di PDF</p>
                  <p>2. Ekstrak kode unik yang di-embed saat generate</p>
                  <p>3. Verifikasi ke database + blockchain Ethereum</p>
                  <p className="text-black/60 mt-1">⚠️ Hanya PDF asli dari SertifChain yang valid. PDF diedit/print ulang tidak bisa diverifikasi.</p>
                </div>
              )}
            </div>
          )}

          {/* Loading state untuk kode */}
          {isLoading && activeTab === "code" && (
            <div className="border-3 border-black bg-yellow/30 p-6 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="font-bold">Memeriksa database & blockchain...</p>
            </div>
          )}

          {/* Result */}
          {result && !isLoading && <ResultPanel result={result} />}

          {/* Info awal */}
          {!result && !isLoading && (
            <div className="border-3 border-black bg-white p-5">
              <p className="font-bold mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Kenapa verifikasi blockchain lebih terpercaya?
              </p>
              <div className="space-y-2 text-sm">
                {[
                  ["✓", "Database bisa diedit admin — blockchain tidak bisa diubah siapapun"],
                  ["✓", "Hash tersimpan di ribuan node Ethereum di seluruh dunia"],
                  ["✓", "Verifikasi mandiri langsung di Etherscan tanpa website ini"],
                  ["✓", "Siswa tidak perlu wallet — gas dibayar otomatis oleh sistem"],
                ].map(([icon, text], i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-mint font-bold flex-shrink-0">{icon}</span>
                    <p>{text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-12 h-12 border-3 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyPageContent />
    </Suspense>
  );
}
