"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
import { motion, MotionConfig } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Award, Search, CheckCircle, XCircle, ExternalLink,
  Shield, Hash, Calendar, FolderKanban, ArrowLeft,
  Copy, Check, AlertTriangle, Loader2, Upload,
  FileText, FileCheck, FileX, LockKeyhole,
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
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-[#e8e2ed] bg-white text-[#68408b] transition-colors hover:bg-[#f5effa]"
      title="Salin"
      aria-label={copied ? "Tersalin" : "Salin"}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
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
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-emerald-900">Sertifikat asli</h3>
              <p className="mt-0.5 text-sm text-emerald-800">
                Terverifikasi di database <strong>+</strong> Ethereum Blockchain
              </p>
            </div>
            <Badge variant="mint">On-Chain</Badge>
          </div>
        </div>
      ) : !result.databaseFound && hasBlockchain ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-4">
            <AlertTriangle className="h-8 w-8 flex-shrink-0 text-amber-700" />
            <div>
              <h3 className="text-lg font-bold text-amber-950">Tercatat di blockchain</h3>
              <p className="mt-0.5 text-sm text-amber-900">
                Data sertifikat tidak ditemukan di database aplikasi. Periksa sumber data sebelum menyatakan cocok.
              </p>
            </div>
          </div>
        </div>
      ) : isClaimed ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white text-amber-700">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-950">Klaim tercatat di database</h3>
              <p className="mt-0.5 text-sm text-amber-900">
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
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-4">
            <AlertTriangle className="h-8 w-8 flex-shrink-0 text-amber-700" />
            <div>
              <h3 className="text-lg font-bold text-amber-950">Status klaim tidak selaras</h3>
              <p className="mt-0.5 text-sm text-amber-900">
                Sertifikat aktif di blockchain, tetapi belum berstatus diklaim di database.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white text-rose-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-rose-900">
                {result.blockchain.status === "revoked"
                  ? "SERTIFIKAT DICABUT"
                  : result.databaseFound
                    ? "BELUM DIKLAIM"
                    : "TIDAK DITEMUKAN"}
              </h3>
              <p className="mt-0.5 text-sm text-rose-800">
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
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700" />
          <p className="text-sm font-medium text-amber-950">
            {result.nameMatch === false
              ? `Nama di PDF (${result.pdfMetadata?.studentName}) berbeda dengan data sertifikat (${result.student.name}).`
              : result.batchMatch === false
                ? `Batch di PDF (${result.pdfMetadata?.batchName}) berbeda dengan data sertifikat (${result.student.batchName}).`
                : "Nama atau batch di database berbeda dengan data blockchain. Sertifikat belum dapat dinyatakan cocok."}
          </p>
        </div>
      ) : null}

      {/* Detail */}
      <div className="overflow-hidden rounded-2xl border border-[#eee9f3] bg-white">
        <div className="border-b border-[#eee9f3] bg-[#faf8fc] px-5 py-3">
          <p className="text-sm font-bold tracking-wide text-[#49365b]">Detail sertifikat</p>
        </div>
        <div className="divide-y divide-[#f0ecf3]">
          <div className="flex items-center gap-3 px-5 py-3.5">
            <Award className="h-4 w-4 flex-shrink-0 text-[#896da0]" />
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase text-[#81788a]">Nama siswa</p>
              <p className="text-base font-semibold text-[#30243b]">{result.student.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-3.5">
            <Hash className="h-4 w-4 flex-shrink-0 text-[#896da0]" />
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase text-[#81788a]">Kode unik</p>
              <code className="font-semibold tracking-widest text-[#30243b]">{result.student.uniqueCode}</code>
            </div>
            <Badge variant={isClaimed ? "mint" : "yellow"}>
              {!result.databaseFound
                ? "Tidak ada di database"
                : isClaimed
                  ? "Diklaim"
                  : "Belum diklaim"}
            </Badge>
          </div>
          <div className="flex items-center gap-3 px-5 py-3.5">
            <FolderKanban className="h-4 w-4 flex-shrink-0 text-[#896da0]" />
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase text-[#81788a]">Program / batch</p>
              <p className="font-semibold text-[#30243b]">{result.student.batchName}</p>
            </div>
          </div>
          {result.student.claimedAt && (
            <div className="flex items-center gap-3 px-5 py-3.5">
              <Calendar className="h-4 w-4 flex-shrink-0 text-[#896da0]" />
              <div>
                <p className="text-xs font-semibold uppercase text-[#81788a]">Tanggal klaim</p>
                <p className="font-semibold text-[#30243b]">
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
        <div className="overflow-hidden rounded-2xl border border-[#eee9f3] bg-white">
          <div className="flex items-center justify-between border-b border-[#eee9f3] bg-[#faf8fc] px-5 py-3 text-[#49365b]">
            <p className="flex items-center gap-2 text-sm font-bold tracking-wide">
              <Shield className="h-4 w-4" /> Bukti blockchain
            </p>
            <Badge variant="mint">Ethereum Sepolia</Badge>
          </div>
          <div className="p-5 space-y-3">
            <div className={`flex items-center gap-3 rounded-xl border p-3 ${
              hasBlockchain ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
            }`}>
              {hasBlockchain
                ? <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                : <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-700" />}
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
                <p className="text-xs text-[#81788a]">
                  {hasBlockchain
                    ? "Data on-chain cocok dengan kode sertifikat"
                    : "Status ini tidak dianggap sebagai bukti sertifikat aktif"}
                </p>
              </div>
            </div>
            {result.blockchain.certHash && (
              <div className="rounded-xl border border-[#eee9f3] bg-[#faf8fc] p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold uppercase text-[#81788a]">Certificate Hash (bytes32)</p>
                  <CopyBtn text={result.blockchain.certHash} />
                </div>
                <code className="break-all font-mono text-xs leading-relaxed text-[#5f5668]">
                  {result.blockchain.certHash}
                </code>
              </div>
            )}
            {result.blockchain.explorerUrl && (
            <a href={result.blockchain.explorerUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-[#e6d9f0] bg-[#f7f2fa] p-4 text-[#68408b] transition-colors hover:bg-[#f0e7f7]">
              <ExternalLink className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-bold">Lihat di Sepolia Etherscan ↗</p>
                <p className="text-xs text-[#81788a]">Bukti permanen di Ethereum Sepolia Testnet</p>
              </div>
            </a>
            )}
          </div>
        </div>
      ) : isClaimed ? (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin text-amber-700" />
          <div>
            <p className="font-bold text-sm">Blockchain sedang diproses...</p>
            <p className="text-xs text-[#81788a]">Biasanya selesai 15-30 detik setelah klaim</p>
          </div>
        </div>
      ) : null}

      {/* Share */}
      <div className="rounded-2xl border border-[#eee9f3] bg-white p-4">
        <p className="mb-2 text-xs font-bold uppercase text-[#81788a]">Bagikan link verifikasi</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-lg border border-[#eee9f3] bg-[#faf8fc] px-3 py-2 font-mono text-xs text-[#5f5668]">
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
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-[#fbfaff] text-[#292333]">
      {/* Nav */}
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
                VERIFIKASI KEASLIAN
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

      <main className="mx-auto max-w-6xl px-5 pb-14 pt-8 sm:px-8 sm:pt-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl space-y-6"
        >

          {/* Header */}
          <div className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#4c246c] via-[#693795] to-[#8856b4] px-6 py-8 text-center text-white shadow-[0_20px_56px_rgba(86,45,120,0.18)] sm:px-10 sm:py-10">
            <div className="absolute -right-16 -top-24 -z-10 h-64 w-64 rounded-full bg-[#c89cf1]/20 blur-3xl" />
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
              <Shield className="h-7 w-7 text-[#ffdb68]" />
            </div>
            <p className="mb-2 text-xs font-bold tracking-[0.16em] text-[#f3e8ff]">
              SERTIFIKAT DIGITAL TERPERCAYA
            </p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Cek keaslian sertifikat</h1>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-white/80">
              Masukkan kode unik <strong>atau</strong> upload file PDF sertifikat
            </p>
          </div>

          {/* Tab switcher */}
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[#eee9f3] bg-white p-2 shadow-[0_10px_28px_rgba(54,34,72,0.05)]">
            <button onClick={() => { setActiveTab("code"); setResult(null); setError(""); }}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-colors
                ${activeTab === "code" ? "bg-[#5b2b82] text-white shadow-sm" : "text-[#6e6478] hover:bg-[#f7f3fa]"}`}>
              <Hash className="h-4 w-4" /> Input kode unik
            </button>
            <button onClick={() => { setActiveTab("pdf"); setResult(null); setError(""); }}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-colors
                ${activeTab === "pdf" ? "bg-[#5b2b82] text-white shadow-sm" : "text-[#6e6478] hover:bg-[#f7f3fa]"}`}>
              <Upload className="h-4 w-4" /> Upload PDF
            </button>
          </div>

          {/* Tab: Input Kode */}
          {activeTab === "code" && (
            <div className="rounded-2xl border border-[#eee9f3] bg-white p-5 shadow-[0_12px_36px_rgba(54,34,72,0.06)] sm:p-7">
              <label className="mb-2 block text-sm font-semibold text-[#49365b]">
                Kode unik sertifikat
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input ref={inputRef} type="text" value={code}
                  onChange={e => { setCode(e.target.value.toUpperCase()); setError(""); setResult(null); }}
                  onKeyDown={e => e.key === "Enter" && doVerifyCode(code)}
                  placeholder="Contoh: ABC12345"
                  maxLength={12}
                  className="min-w-0 flex-1 rounded-xl border border-[#e8e2ed] bg-[#fbfaff] px-4 py-3 text-base font-semibold uppercase tracking-widest text-[#30243b] outline-none transition focus:border-[#8253a6] focus:ring-4 focus:ring-[#8253a6]/10" />
                <Button variant="black" onClick={() => doVerifyCode(code)} isLoading={isLoading}
                  rightIcon={isLoading ? undefined : <Search className="h-4 w-4" />}
                  className="!w-full !rounded-xl !bg-[#5b2b82] sm:!w-auto hover:!bg-[#472064]">
                  {isLoading ? "Cek..." : "Verifikasi"}
                </Button>
              </div>
              {error && (
                <p className="mt-3 flex items-center gap-2 text-sm font-medium text-rose-700">
                  <XCircle className="h-4 w-4" /> {error}
                </p>
              )}
              <p className="mt-3 flex items-center gap-2 text-xs text-[#81788a]">
                <LockKeyhole className="h-3.5 w-3.5" />
                Kode unik ada di bagian bawah sertifikat PDF
              </p>
            </div>
          )}

          {/* Tab: Upload PDF */}
          {activeTab === "pdf" && (
            <div className="space-y-4 rounded-2xl border border-[#eee9f3] bg-white p-5 shadow-[0_12px_36px_rgba(54,34,72,0.06)] sm:p-7">
              <label className="block text-sm font-semibold text-[#49365b]">
                Upload file PDF sertifikat
              </label>
              <div {...getRootProps()}
                className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors
                  ${isDragActive ? "border-[#74479b] bg-[#f3ecf8]" : "border-[#d9cce6] bg-[#fbfaff] hover:border-[#9b79b5] hover:bg-[#f8f4fb]"}`}>
                <input {...getInputProps()} />
                {pdfPreviewName ? (
                  <div className="space-y-2">
                    {isLoading ? (
                      <><Loader2 className="w-10 h-10 animate-spin mx-auto" />
                        <p className="font-bold">Membaca metadata PDF...</p>
                        <p className="text-xs text-black/60">{pdfPreviewName}</p></>
                    ) : result ? (
                      <><FileCheck className="w-10 h-10 mx-auto text-mint" />
                        <p className="font-semibold text-emerald-700">PDF berhasil diverifikasi</p>
                        <p className="text-xs text-[#81788a]">{pdfPreviewName}</p>
                        <p className="text-xs text-[#81788a]">Klik untuk ganti file</p></>
                    ) : (
                      <><FileX className="w-10 h-10 mx-auto text-orange" />
                        <p className="font-semibold text-[#49365b]">{pdfPreviewName}</p>
                        <p className="text-xs text-[#81788a]">Klik untuk ganti file</p></>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1e9f8] text-[#68408b]">
                      <FileText className="h-7 w-7" />
                    </div>
                    <p className="mb-1 font-semibold text-[#49365b]">
                      {isDragActive ? "Drop file PDF di sini..." : "Drag & Drop atau Klik"}
                    </p>
                    <p className="text-sm text-[#81788a]">File PDF sertifikat · Maks 20MB</p>
                  </>
                )}
              </div>
              {error && (
                <p className="flex items-center gap-2 text-sm font-medium text-rose-700">
                  <XCircle className="h-4 w-4" /> {error}
                </p>
              )}
              {!result && !isLoading && (
                <div className="space-y-1 rounded-xl border border-[#eee9f3] bg-[#faf8fc] p-4 text-xs leading-5 text-[#6e6478]">
                  <p className="mb-2 flex items-center gap-2 font-semibold text-[#49365b]">
                    <Shield className="h-4 w-4 text-[#7650a1]" /> Cara kerja verifikasi
                  </p>
                  <p>1. Sistem membaca metadata pada PDF.</p>
                  <p>2. Kode unik diekstrak dari file sertifikat.</p>
                  <p>3. Data diperiksa pada database dan blockchain Ethereum.</p>
                  <p className="mt-2 border-t border-[#eee9f3] pt-2 text-[#81788a]">
                    Hanya PDF asli dari SertifChain yang dapat diverifikasi. PDF yang diedit atau dicetak ulang mungkin tidak valid.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Loading state untuk kode */}
          {isLoading && activeTab === "code" && (
            <div className="rounded-2xl border border-[#eee9f3] bg-white p-6 text-center">
              <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-[#68408b]" />
              <p className="font-semibold text-[#49365b]">Memeriksa database &amp; blockchain...</p>
            </div>
          )}

          {/* Result */}
          {result && !isLoading && <ResultPanel result={result} />}

          {/* Info awal */}
          {!result && !isLoading && (
            <div className="rounded-2xl border border-[#eee9f3] bg-white p-5 sm:p-6">
              <p className="mb-4 flex items-center gap-2 font-bold text-[#3d2c4d]">
                <Shield className="h-4 w-4 text-[#7650a1]" /> Kenapa verifikasi blockchain lebih terpercaya?
              </p>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                {[
                  "Database bisa diedit admin — blockchain tidak bisa diubah siapapun",
                  "Hash tercatat pada jaringan Ethereum",
                  "Verifikasi dapat dilihat langsung di Etherscan",
                  "Siswa tidak perlu menyiapkan wallet sendiri",
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-xl bg-[#faf8fc] p-3">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                    <p className="text-[#6e6478]">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </motion.div>
      </main>
    </div>
    </MotionConfig>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#fbfaff]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#5b2b82] border-t-transparent" />
      </div>
    }>
      <VerifyPageContent />
    </Suspense>
  );
}
