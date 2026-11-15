"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TemplatePreviewCard } from "@/components/admin/TemplatePreviewCard";
import type { TemplateItem } from "@/components/admin/TemplatePreviewCard";
import { CreateTemplateModal } from "@/components/admin/CreateTemplateModal";
import { UploadTemplateModal } from "@/components/admin/UploadTemplateModal";
import { EditTemplateModal } from "@/components/admin/EditTemplateModal";
import toast from "react-hot-toast";
import {
  Plus,
  FileImage,
  RefreshCw,
  Upload,
  ImageIcon,
  Lightbulb,
  Paintbrush,
} from "lucide-react";

const BUILT_IN_IDS = [
  "a1b2c3d4-0001-0001-0001-000000000001",
  "a1b2c3d4-0002-0002-0002-000000000002",
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/templates");
      if (!res.ok) {
        const result = await res.json().catch(() => null);
        throw new Error(result?.error || "Gagal memuat template");
      }
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error("Fetch templates error:", error);
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat data template"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleDelete = async (id: string, name: string) => {
    const ok = confirm(`Hapus template "${name}"?\n\nTemplate yang sedang digunakan batch tidak bisa dihapus.`);
    if (!ok) return;
    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus");
      toast.success("Template berhasil dihapus");
      fetchTemplates();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEdit = (template: TemplateItem) => {
    setEditingTemplate(template);
  };

  const builtIn = templates.filter(t => BUILT_IN_IDS.includes(t.id));
  const customUpload = templates.filter(t => !BUILT_IN_IDS.includes(t.id) && t.background_image_url);
  const customGenerated = templates.filter(t => !BUILT_IN_IDS.includes(t.id) && !t.background_image_url);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="heading-brutal text-2xl mb-1">Template Sertifikat</h2>
          <p className="text-sm text-black/60 font-semibold">
            {templates.length} template tersedia · Pilih saat membuat batch
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="white" onClick={fetchTemplates} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Button variant="mint" onClick={() => setIsUploadModalOpen(true)} leftIcon={<Upload className="w-4 h-4" />}>
            Upload Gambar
          </Button>
          <Button variant="yellow" onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Buat Template
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card variant="yellow">
          <CardContent>
            <div className="flex items-start gap-3 py-2">
              <Lightbulb className="h-5 w-5 shrink-0 text-[#7650a1]" />
              <div>
                <p className="font-bold mb-1">Cara pakai template:</p>
                <ul className="text-sm space-y-1 text-black/80 font-semibold">
                  <li>• Pilih template saat buat <strong>Batch Baru</strong></li>
                  <li>• Semua siswa di batch mendapat PDF desain tersebut</li>
                  <li>• Klik <strong>Edit</strong> untuk ubah posisi teks</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="mint">
          <CardContent>
            <div className="flex items-start gap-3 py-2">
              <Paintbrush className="h-5 w-5 shrink-0 text-[#438167]" />
              <div>
                <p className="font-bold mb-1">Upload desain sendiri:</p>
                <ul className="text-sm space-y-1 text-black/80 font-semibold">
                  <li>• Desain di Canva, Word, Photoshop</li>
                  <li>• Export ke <strong>PNG atau JPG</strong></li>
                  <li>• Upload → atur posisi teks nama siswa</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block w-12 h-12 border-3 border-black border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 font-semibold text-black/60">Memuat template...</p>
        </div>
      )}

      {!isLoading && (
        <>
          {/* ── Template Bawaan ── */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="heading-brutal text-xl">Template Bawaan</h3>
              <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 rounded-full">
                {builtIn.length}
              </span>
            </div>
            {builtIn.length === 0 ? (
              <Card variant="white">
                <CardContent>
                  <div className="text-center py-8 text-black/60">
                    <p className="font-semibold">Template bawaan belum ada.</p>
                    <p className="text-sm mt-1">
                      Jalankan <code className="bg-cream px-1 font-bold">005_template_config.sql</code> di Supabase.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {builtIn.map(t => (
                  <TemplatePreviewCard
                    key={t.id}
                    template={t}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Template Upload Gambar ── */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="heading-brutal text-xl">Template Upload Gambar</h3>
              <span className="px-2 py-0.5 text-xs font-bold bg-mint border-2 border-black">
                {customUpload.length}
              </span>
            </div>
            {customUpload.length === 0 ? (
              <Card variant="white">
                <CardContent>
                  <div className="text-center py-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-mint/30 border-3 border-black shadow-brutal mb-4">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                    <h4 className="heading-brutal text-xl mb-2">Belum Ada Template Upload</h4>
                    <p className="text-black/60 mb-5 max-w-sm mx-auto text-sm">
                      Upload gambar desain sertifikat Anda dari Canva, Word, atau Photoshop.
                    </p>
                    <Button variant="mint" onClick={() => setIsUploadModalOpen(true)} leftIcon={<Upload className="w-4 h-4" />}>
                      Upload Template Sekarang
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customUpload.map(t => (
                  <TemplatePreviewCard
                    key={t.id}
                    template={t}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Template Custom Generated ── */}
          {customGenerated.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <h3 className="heading-brutal text-xl">Template Custom</h3>
                <span className="px-2 py-0.5 text-xs font-semibold bg-purple text-[#7059a0] border border-slate-200 rounded-full">
                  {customGenerated.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customGenerated.map(t => (
                  <TemplatePreviewCard
                    key={t.id}
                    template={t}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Modals */}
      <CreateTemplateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchTemplates}
      />
      <UploadTemplateModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={fetchTemplates}
      />
      <EditTemplateModal
        isOpen={!!editingTemplate}
        template={editingTemplate}
        onClose={() => setEditingTemplate(null)}
        onSuccess={fetchTemplates}
      />
    </div>
  );
}
