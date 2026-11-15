"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CreateBatchModal } from "@/components/admin/CreateBatchModal";
import toast from "react-hot-toast";
import {
  Plus,
  FolderKanban,
  Users,
  CheckCircle,
  Calendar,
  ChevronRight,
  Trash2,
} from "lucide-react";

interface Batch {
  id: string;
  name: string;
  description: string | null;
  total_students: number;
  claimed_count: number;
  created_at: string;
  certificate_templates: {
    id: string;
    name: string;
  } | null;
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchBatches = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/batches");
      if (!response.ok) throw new Error("Failed to fetch batches");
      const data = await response.json();
      setBatches(data.batches || []);
    } catch (error) {
      console.error("Fetch batches error:", error);
      toast.error("Gagal memuat data batch");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchBatches(); }, []);

  const getClaimPercentage = (batch: Batch) => {
    if (batch.total_students === 0) return 0;
    return Math.round((batch.claimed_count / batch.total_students) * 100);
  };

  const handleDelete = async (batch: Batch, e: React.MouseEvent) => {
    e.preventDefault(); // cegah link navigasi ke detail
    e.stopPropagation();

    const ok = confirm(
      `Hapus batch "${batch.name}"?\n\nSeluruh data ${batch.total_students} siswa dalam batch ini juga akan ikut terhapus permanen.\n\nLanjutkan?`
    );
    if (!ok) return;

    setDeletingId(batch.id);
    try {
      const res = await fetch(`/api/batches/${batch.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus batch");
      toast.success(
        `Batch "${batch.name}" berhasil dihapus${data.deleted_students > 0 ? ` beserta ${data.deleted_students} siswa` : ""}`
      );
      fetchBatches();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus batch");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="heading-brutal text-2xl mb-1">Kelola Batch Siswa</h2>
          <p className="text-sm text-black/60 font-semibold">
            Total {batches.length} batch terdaftar
          </p>
        </div>
        <Button
          variant="yellow"
          leftIcon={<Plus className="w-5 h-5" />}
          onClick={() => setIsModalOpen(true)}
        >
          Buat Batch Baru
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block w-12 h-12 border-3 border-black border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 font-semibold text-black/60">Memuat data...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && batches.length === 0 && (
        <Card variant="white">
          <CardContent>
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow border-3 border-black shadow-brutal mb-4 rotate-playful-2">
                <FolderKanban className="w-10 h-10" />
              </div>
              <h3 className="heading-brutal text-2xl mb-2">
                Belum Ada Batch
              </h3>
              <p className="text-black/60 mb-6 max-w-md mx-auto">
                Mulai dengan membuat batch pertama Anda untuk mengelompokkan
                siswa dan sertifikat.
              </p>
              <Button
                variant="yellow"
                leftIcon={<Plus className="w-5 h-5" />}
                onClick={() => setIsModalOpen(true)}
              >
                Buat Batch Pertama
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Batches Grid */}
      {!isLoading && batches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((batch) => {
            const claimPercentage = getClaimPercentage(batch);

            return (
              <Card key={batch.id} variant="white" className="hover:shadow-brutal-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-3 bg-yellow border-2 border-black">
                      <FolderKanban className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="mint">{batch.total_students} siswa</Badge>
                      {/* Tombol hapus langsung dari card */}
                      <button
                        onClick={(e) => handleDelete(batch, e)}
                        disabled={deletingId === batch.id}
                        className="p-2 bg-white border-2 border-black hover:bg-red-50 shadow-brutal-sm hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
                        title="Hapus batch"
                        aria-label={`Hapus batch ${batch.name}`}
                      >
                        {deletingId === batch.id ? (
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-red-600" />
                        )}
                      </button>
                    </div>
                  </div>
                  <CardTitle as="h3" className="text-xl">
                    {batch.name}
                  </CardTitle>
                  {batch.description && (
                    <CardDescription className="line-clamp-2">
                      {batch.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent>
                  {/* Stats */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between p-3 bg-cream border-2 border-black">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-black/60" />
                        <span className="text-sm font-bold">Total Siswa</span>
                      </div>
                      <span className="font-bold">{batch.total_students}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-cream border-2 border-black">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-black/60" />
                        <span className="text-sm font-bold">Diklaim</span>
                      </div>
                      <span className="font-bold">{batch.claimed_count}</span>
                    </div>

                    {/* Claim Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-black/60">
                          Tingkat Klaim
                        </span>
                        <span className="text-sm font-bold">
                          {claimPercentage}%
                        </span>
                      </div>
                      <div className="h-3 bg-cream border-2 border-black overflow-hidden">
                        <div
                          className="h-full bg-mint transition-all duration-500"
                          style={{ width: `${claimPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Created Date */}
                    <div className="flex items-center gap-2 text-xs text-black/60 pt-2">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Dibuat:{" "}
                        {new Date(batch.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <Link href={`/admin/batches/${batch.id}`}>
                    <Button
                      variant="black"
                      className="w-full"
                      rightIcon={<ChevronRight className="w-5 h-5" />}
                    >
                      Kelola Batch
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Batch Modal */}
      <CreateBatchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchBatches}
      />
    </div>
  );
}
