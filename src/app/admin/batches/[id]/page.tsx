"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Users,
  Trash2,
  CheckCircle,
  XCircle,
  Download,
  FileArchive,
} from "lucide-react";
import Link from "next/link";
import { BulkUploadStudents } from "@/components/admin/BulkUploadStudents";

interface Student {
  id: string;
  name: string;
  unique_code: string;
  status: string;
  claimed_at: string | null;
}

interface Batch {
  id: string;
  name: string;
  description: string | null;
  total_students: number;
  claimed_count: number;
  created_at: string;
  certificate_templates: { id: string; name: string } | null;
}

// ── Tipe filter download ──
type DownloadFilter = "all" | "claimed" | "unclaimed";

export default function BatchDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const batchId = params.id as string;

  const [batch, setBatch] = useState<Batch | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Download state
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFilter, setDownloadFilter] = useState<DownloadFilter>("all");
  const [downloadProgress, setDownloadProgress] = useState<string>("");

  const fetchBatch = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/batches/${batchId}`);
      if (!res.ok) throw new Error("Failed to fetch batch");
      const data = await res.json();
      setBatch(data.batch);
    } catch {
      toast.error("Gagal memuat data batch");
      router.push("/admin/batches");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setIsLoadingStudents(true);
      const res = await fetch(`/api/students?batch_id=${batchId}`);
      if (!res.ok) throw new Error("Failed to fetch students");
      const data = await res.json();
      setStudents(data.students || []);
    } catch {
      // silent
    } finally {
      setIsLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchBatch();
    fetchStudents();
  }, [batchId]);

  const handleUploadSuccess = () => {
    fetchBatch();
    fetchStudents();
  };

  const handleDelete = async () => {
    if (!batch) return;
    const ok = confirm(
      `Hapus batch "${batch.name}"?\n\n⚠️ Semua data siswa (${batch.total_students} siswa) dalam batch ini juga akan ikut terhapus permanen.\n\nLanjutkan?`
    );
    if (!ok) return;
    try {
      const res = await fetch(`/api/batches/${batchId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete batch");
      toast.success(
        `Batch "${batch.name}" berhasil dihapus${data.deleted_students > 0 ? ` beserta ${data.deleted_students} siswa` : ""}`
      );
      router.push("/admin/batches");
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus batch");
    }
  };

  // ── Download semua sertifikat sebagai ZIP ──
  const handleDownloadAll = async (filter: DownloadFilter = downloadFilter) => {
    if (!batch) return;

    const filterCount = {
      all:       batch.total_students,
      claimed:   batch.claimed_count,
      unclaimed: batch.total_students - batch.claimed_count,
    }[filter];

    if (filterCount === 0) {
      toast.error(`Tidak ada siswa dengan filter "${filter}" untuk didownload`);
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(
      `Membuat ${filterCount} PDF sertifikat... Mohon tunggu, proses ini bisa memakan beberapa detik.`
    );

    try {
      const url = `/api/batches/${batchId}/download?status=${filter}`;
      const res = await fetch(url, { method: "GET" });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Gagal download" }));
        throw new Error(errData.error || "Gagal generate sertifikat");
      }

      // Info dari header
      const totalStudents = res.headers.get("X-Total-Students");
      const errCount      = res.headers.get("X-Errors");

      // Stream blob
      const blob = await res.blob();

      // Trigger download
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeName = batch.name.replace(/[^a-zA-Z0-9\s-_]/g, "").replace(/\s+/g, "-");
      const filterSuffix = filter === "all" ? "" : `-${filter}`;
      a.href     = downloadUrl;
      a.download = `Sertifikat-${safeName}${filterSuffix}.zip`;
      a.click();
      URL.revokeObjectURL(downloadUrl);

      const successMsg = errCount && Number(errCount) > 0
        ? `${totalStudents} sertifikat berhasil, ${errCount} gagal`
        : `${totalStudents} sertifikat berhasil di-generate!`;

      toast.success(successMsg + " 📦");
      setDownloadProgress("");
    } catch (err: any) {
      console.error("Download error:", err);
      toast.error(err.message || "Gagal download sertifikat");
      setDownloadProgress("");
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-12 h-12 border-3 border-black border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 font-semibold text-black/60">Memuat data...</p>
      </div>
    );
  }

  if (!batch) {
    return (
      <Card variant="white">
        <CardContent>
          <div className="text-center py-12">
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h3 className="heading-brutal text-2xl mb-2">Batch Tidak Ditemukan</h3>
            <p className="text-black/60 mb-6">Batch tidak ada atau sudah dihapus.</p>
            <Link href="/admin/batches">
              <Button variant="yellow">Kembali ke Daftar Batch</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const claimPercentage = batch.total_students > 0
    ? Math.round((batch.claimed_count / batch.total_students) * 100)
    : 0;
  const unclaimedCount = batch.total_students - batch.claimed_count;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/admin/batches">
        <Button variant="white" leftIcon={<ArrowLeft className="w-5 h-5" />}>
          Kembali
        </Button>
      </Link>

      {/* Batch Header */}
      <Card variant="yellow">
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1">
              <CardTitle as="h2" className="text-3xl mb-2">{batch.name}</CardTitle>
              {batch.description && (
                <CardDescription className="text-base">{batch.description}</CardDescription>
              )}
              {batch.certificate_templates && (
                <div className="mt-2">
                  <Badge variant="black">🎨 Template: {batch.certificate_templates.name}</Badge>
                </div>
              )}
            </div>
            <Button variant="white" onClick={handleDelete}
              leftIcon={<Trash2 className="w-5 h-5" />}>
              Hapus Batch
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white border-2 border-black">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5" />
                <span className="font-bold text-sm">Total Siswa</span>
              </div>
              <p className="heading-brutal text-3xl">{batch.total_students}</p>
            </div>
            <div className="p-4 bg-white border-2 border-black">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-bold text-sm">Sudah Diklaim</span>
              </div>
              <p className="heading-brutal text-3xl">{batch.claimed_count}</p>
            </div>
            <div className="p-4 bg-white border-2 border-black">
              <div className="flex items-center gap-3 mb-2">
                <XCircle className="w-5 h-5" />
                <span className="font-bold text-sm">Belum Diklaim</span>
              </div>
              <p className="heading-brutal text-3xl">{unclaimedCount}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold">Tingkat Klaim</span>
              <span className="text-lg font-bold">{claimPercentage}%</span>
            </div>
            <div className="h-4 bg-white border-2 border-black overflow-hidden">
              <div className="h-full bg-mint transition-all duration-500"
                style={{ width: `${claimPercentage}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Download Sertifikat Massal ── */}
      {batch.total_students > 0 && (
        <Card variant="white">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-mint border-2 border-black">
                <FileArchive className="w-6 h-6" />
              </div>
              <div>
                <CardTitle as="h3">Download Sertifikat Massal</CardTitle>
                <CardDescription>
                  Generate dan download semua sertifikat batch ini dalam 1 file ZIP
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Progress indicator */}
            {isDownloading && downloadProgress && (
              <div className="mb-4 p-4 bg-yellow/30 border-2 border-black flex items-center gap-3">
                <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <p className="text-sm font-bold">{downloadProgress}</p>
              </div>
            )}

            {/* Filter pilihan */}
            <div className="mb-4">
              <p className="text-sm font-bold text-black/60 uppercase mb-2">
                Filter Sertifikat
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Semua */}
                <button
                  onClick={() => setDownloadFilter("all")}
                  className={`p-4 border-3 border-black text-left transition-all
                    ${downloadFilter === "all" ? "bg-yellow shadow-brutal-sm translate-x-0.5 translate-y-0.5" : "bg-white shadow-brutal hover:shadow-brutal-sm"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-5 h-5" />
                    <span className="font-bold">Semua Siswa</span>
                  </div>
                  <p className="heading-brutal text-2xl">{batch.total_students}</p>
                  <p className="text-xs text-black/60 mt-1">sertifikat</p>
                </button>

                {/* Sudah diklaim */}
                <button
                  onClick={() => setDownloadFilter("claimed")}
                  className={`p-4 border-3 border-black text-left transition-all
                    ${downloadFilter === "claimed" ? "bg-mint shadow-brutal-sm translate-x-0.5 translate-y-0.5" : "bg-white shadow-brutal hover:shadow-brutal-sm"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-bold">Sudah Diklaim</span>
                  </div>
                  <p className="heading-brutal text-2xl">{batch.claimed_count}</p>
                  <p className="text-xs text-black/60 mt-1">sertifikat</p>
                </button>

                {/* Belum diklaim */}
                <button
                  onClick={() => setDownloadFilter("unclaimed")}
                  className={`p-4 border-3 border-black text-left transition-all
                    ${downloadFilter === "unclaimed" ? "bg-orange shadow-brutal-sm translate-x-0.5 translate-y-0.5" : "bg-white shadow-brutal hover:shadow-brutal-sm"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="w-5 h-5" />
                    <span className="font-bold">Belum Diklaim</span>
                  </div>
                  <p className="heading-brutal text-2xl">{unclaimedCount}</p>
                  <p className="text-xs text-black/60 mt-1">sertifikat</p>
                </button>
              </div>
            </div>

            {/* Info batas */}
            <div className="mb-4 p-3 bg-pink-light border-2 border-black text-xs font-semibold">
              ⚠️ Maksimal <strong>200 sertifikat</strong> per download karena batasan server.
              Jika lebih dari 200 siswa, download akan mengambil 200 pertama (diurutkan berdasarkan nama).
            </div>

            {/* Tombol download */}
            <Button
              variant="mint"
              className="w-full"
              onClick={() => handleDownloadAll(downloadFilter)}
              isLoading={isDownloading}
              leftIcon={<Download className="w-5 h-5" />}
              disabled={isDownloading}
            >
              {isDownloading
                ? "Sedang Generate PDF..."
                : `Download ${
                    downloadFilter === "all"
                      ? `Semua (${batch.total_students})`
                      : downloadFilter === "claimed"
                      ? `Diklaim (${batch.claimed_count})`
                      : `Belum Diklaim (${unclaimedCount})`
                  } Sertifikat sebagai ZIP`}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upload Students */}
      <BulkUploadStudents batchId={batchId} onSuccess={handleUploadSuccess} />

      {/* Students List */}
      <Card variant="white">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle as="h3">Daftar Siswa</CardTitle>
              <CardDescription>
                {batch.total_students === 0
                  ? "Belum ada siswa"
                  : `${batch.total_students} siswa · ${batch.claimed_count} diklaim`}
              </CardDescription>
            </div>
            {students.length > 0 && (
              <Button
                variant="white"
                onClick={() => {
                  // Export CSV kode unik
                  const csv = [
                    "No,Nama,Kode Unik,Status",
                    ...students.map((s, i) =>
                      `${i + 1},"${s.name}",${s.unique_code},${s.status}`
                    ),
                  ].join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url  = URL.createObjectURL(blob);
                  const a    = document.createElement("a");
                  a.href     = url;
                  a.download = `${batch.name}-kode-unik.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("CSV kode unik berhasil diexport");
                }}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Export Kode Unik (CSV)
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingStudents ? (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin" />
              <p className="mt-2 text-sm font-semibold text-black/60">Memuat data...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-black/60">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-semibold">Upload CSV/Excel untuk menambahkan siswa</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-black bg-cream">
                    <th className="text-left py-3 px-4 font-bold">#</th>
                    <th className="text-left py-3 px-4 font-bold">Nama Siswa</th>
                    <th className="text-left py-3 px-4 font-bold">Kode Unik</th>
                    <th className="text-left py-3 px-4 font-bold">Status</th>
                    <th className="text-left py-3 px-4 font-bold">Diklaim</th>
                    <th className="text-left py-3 px-4 font-bold">Download</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => (
                    <tr key={student.id} className="border-b border-black/10 hover:bg-cream transition-colors">
                      <td className="py-3 px-4 text-sm font-semibold text-black/60">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 font-bold">{student.name}</td>
                      <td className="py-3 px-4">
                        <code className="px-2 py-1 bg-yellow border-2 border-black text-sm font-bold">
                          {student.unique_code}
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        {student.status === "claimed" ? (
                          <Badge variant="success">Diklaim</Badge>
                        ) : (
                          <Badge variant="yellow">Belum Diklaim</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-black/60">
                        {student.claimed_at
                          ? new Date(student.claimed_at).toLocaleDateString("id-ID", {
                              day: "numeric", month: "short", year: "numeric",
                            })
                          : "-"}
                      </td>
                      <td className="py-3 px-4">
                        {/* Download sertifikat individual */}
                        <button
                          onClick={() => {
                            window.open(`/api/certificate/${student.id}/download-admin`, "_blank");
                          }}
                          className="p-2 bg-white border-2 border-black hover:bg-yellow shadow-brutal-sm hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                          title="Download sertifikat"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
