"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { TemplatePreviewCard } from "@/components/admin/TemplatePreviewCard";
import type { TemplateItem } from "@/components/admin/TemplatePreviewCard";
import toast from "react-hot-toast";
import { Plus, FileImage } from "lucide-react";

interface CreateBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateBatchModal({ isOpen, onClose, onSuccess }: CreateBatchModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch templates saat modal dibuka
  useEffect(() => {
    if (isOpen && step === 2) {
      fetchTemplates();
    }
  }, [isOpen, step]);

  const fetchTemplates = async () => {
    try {
      setIsLoadingTemplates(true);
      const res = await fetch("/api/templates");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTemplates(data.templates || []);
      // Auto-select template pertama jika belum ada pilihan
      if (!selectedTemplateId && data.templates?.length > 0) {
        setSelectedTemplateId(data.templates[0].id);
      }
    } catch {
      toast.error("Gagal memuat template");
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = "Nama batch wajib diisi";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          template_id: selectedTemplateId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat batch");

      toast.success("Batch berhasil dibuat! 🎉");
      handleClose();
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat batch");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setStep(1);
    setFormData({ name: "", description: "" });
    setErrors({});
    setSelectedTemplateId(null);
    onClose();
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Buat Batch Baru" size="xl">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 border-2 border-black flex items-center justify-center font-bold text-sm
              ${step === s ? "bg-yellow" : step > s ? "bg-mint" : "bg-cream"}`}>
              {step > s ? "✓" : s}
            </div>
            <span className="text-sm font-semibold hidden sm:block">
              {s === 1 ? "Info Batch" : "Pilih Template"}
            </span>
            {s < 2 && <div className="w-8 h-0.5 bg-slate-200" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* STEP 1 — Info batch */}
        {step === 1 && (
          <div className="space-y-4">
            <Input
              label="Nama Batch"
              name="name"
              placeholder="Contoh: Batch Agustus 2026"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
            />

            <div>
              <label className="block mb-2 text-sm font-bold text-black uppercase tracking-wide">
                Deskripsi (Opsional)
              </label>
              <textarea
                name="description"
                placeholder="Deskripsi batch, kelas, atau periode..."
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 text-lg font-semibold bg-white border-3 border-black shadow-brutal focus:outline-none focus:shadow-brutal-sm transition-shadow resize-none placeholder:text-black/40"
              />
            </div>

            <Button type="button" variant="yellow" className="w-full" onClick={handleNext}>
              Lanjut: Pilih Template →
            </Button>
          </div>
        )}

        {/* STEP 2 — Pilih template */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            {/* Summary step 1 */}
            <div className="p-3 bg-cream border-2 border-black flex items-center justify-between flex-shrink-0">
              <div>
                <span className="text-xs font-bold text-black/60 uppercase">Batch:</span>
                <span className="font-bold ml-2">{formData.name}</span>
              </div>
              <button type="button" onClick={() => setStep(1)} className="text-xs font-bold underline hover:no-underline">
                Ubah
              </button>
            </div>

            {/* Template pilihan — area scroll */}
            <div className="flex-1 min-h-0">
              {isLoadingTemplates ? (
                <div className="text-center py-8">
                  <div className="inline-block w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin" />
                  <p className="mt-2 text-sm font-semibold text-black/60">Memuat template...</p>
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8 border-3 border-dashed border-black bg-cream">
                  <FileImage className="w-10 h-10 mx-auto mb-2 text-black/40" />
                  <p className="font-semibold text-black/60">Belum ada template.</p>
                  <p className="text-sm text-black/50">Buat dulu di menu Template Sertifikat.</p>
                </div>
              ) : (
                <>
                  <p className="text-sm font-bold text-black/60 mb-3">
                    Pilih desain sertifikat untuk batch ini:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-72 overflow-y-auto pr-1 pb-1">
                    {templates.map(t => (
                      <TemplatePreviewCard
                        key={t.id}
                        template={t}
                        isSelected={selectedTemplateId === t.id}
                        onSelect={setSelectedTemplateId}
                        selectable
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Opsi tanpa template */}
            <button
              type="button"
              onClick={() => setSelectedTemplateId(null)}
              className={`w-full py-2 border-2 border-black text-sm font-bold transition-all flex-shrink-0
                ${!selectedTemplateId ? "bg-yellow" : "bg-white hover:bg-cream"}`}
            >
              {!selectedTemplateId ? "✓ Tanpa Template (pakai default)" : "Gunakan Template Default"}
            </button>

            {/* Info template terpilih */}
            <div className={`px-3 py-2 border-2 border-black text-sm font-bold flex-shrink-0 transition-colors
              ${selectedTemplate ? "bg-mint/30" : "bg-cream text-black/50"}`}>
              {selectedTemplate
                ? <>✓ Template dipilih: <span className="underline">{selectedTemplate.name}</span></>
                : "Tidak ada template dipilih — akan pakai desain default"}
            </div>

            {/* Tombol aksi — selalu terlihat di bawah */}
            <div className="flex gap-3 flex-shrink-0 pt-1 border-t-2 border-black">
              <Button
                type="button"
                variant="white"
                onClick={() => setStep(1)}
                disabled={isLoading}
                className="flex-1"
              >
                ← Kembali
              </Button>
              <Button
                type="submit"
                variant="yellow"
                isLoading={isLoading}
                rightIcon={<Plus className="w-5 h-5" />}
                className="flex-1"
              >
                Buat Batch Sekarang
              </Button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
