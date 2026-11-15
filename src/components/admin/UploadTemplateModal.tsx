"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LayerEditor, DEFAULT_POSITIONS } from "@/components/admin/LayerEditor";
import toast from "react-hot-toast";
import { Upload, Plus, ImageIcon } from "lucide-react";
import type { TextPosition } from "@/lib/pdf/generateCertificate";

interface UploadTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadTemplateModal({ isOpen, onClose, onSuccess }: UploadTemplateModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1 — info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [orientation, setOrientation] = useState<"landscape" | "portrait">("landscape");

  // Step 2 — upload gambar
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [uploadedUrl, setUploadedUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  // Step 3 — posisi teks
  const [positions, setPositions] = useState<TextPosition[]>(DEFAULT_POSITIONS);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(0);

  // ---- Dropzone ----
  const onDrop = useCallback((accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setUploadedUrl("");
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"], "image/webp": [".webp"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onDropRejected: () => toast.error("Format tidak didukung atau file > 10MB"),
  });

  // ---- Upload ke storage ----
  const handleUploadImage = async () => {
    if (!imageFile) return;
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", imageFile);
      const res = await fetch("/api/templates/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal upload");
      setUploadedUrl(data.url);
      toast.success("Gambar berhasil diupload!");
      setStep(3);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // ---- Submit final ----
  const handleSubmit = async () => {
    if (!name.trim()) { toast.error("Nama template wajib diisi"); return; }
    if (!uploadedUrl)  { toast.error("Upload gambar terlebih dahulu"); return; }
    if (positions.length === 0) { toast.error("Tambahkan minimal 1 layer teks"); return; }

    setIsLoading(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          config: {
            style: "custom",
            primaryColor: [0, 0, 0], secondaryColor: [0, 0, 0],
            bgColor: [1, 1, 1], textColor: [0, 0, 0],
            titleText: name, subtitleText: "",
            accentBorder: false, showRibbon: false, footerText: "",
          },
          background_image_url: uploadedUrl,
          text_positions: positions,
          page_orientation: orientation,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal simpan template");
      toast.success("Template berhasil disimpan! 🎨");
      handleClose();
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading || isUploading) return;
    setStep(1);
    setName(""); setDescription(""); setOrientation("landscape");
    setImageFile(null); setImagePreviewUrl(""); setUploadedUrl("");
    setPositions(DEFAULT_POSITIONS); setSelectedIdx(0);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload Template Custom" size="xl">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6 flex-shrink-0">
        {([
          [1, "Info"],
          [2, "Upload Gambar"],
          [3, "Atur Teks"],
        ] as [number, string][]).map(([s, label]) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 border-2 border-black flex items-center justify-center font-bold text-sm
              ${step === s ? "bg-yellow" : step > s ? "bg-mint" : "bg-cream"}`}>
              {step > s ? "✓" : s}
            </div>
            <span className="text-sm font-semibold hidden sm:block">{label}</span>
            {s < 3 && <div className="w-6 h-0.5 bg-slate-200" />}
          </div>
        ))}
      </div>

      {/* ===== STEP 1: Info ===== */}
      {step === 1 && (
        <div className="space-y-4">
          <Input label="Nama Template" placeholder="Contoh: Sertifikat Wisuda 2026"
            value={name} onChange={e => setName(e.target.value)} required />

          <div>
            <label className="block mb-2 text-sm font-bold text-black uppercase tracking-wide">
              Deskripsi (Opsional)
            </label>
            <textarea placeholder="Deskripsi singkat..."
              value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full px-4 py-3 font-semibold bg-white border-3 border-black shadow-brutal
                focus:outline-none focus:shadow-brutal-sm resize-none placeholder:text-black/40" />
          </div>

          <div>
            <label className="block mb-2 text-sm font-bold text-black uppercase tracking-wide">
              Orientasi Halaman
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["landscape", "portrait"] as const).map(o => (
                <button key={o} type="button" onClick={() => setOrientation(o)}
                  className={`py-3 border-3 border-black font-bold transition-all text-sm
                    ${orientation === o ? "bg-yellow shadow-brutal translate-x-0.5 translate-y-0.5" : "bg-white shadow-brutal hover:shadow-brutal-sm"}`}>
                  {o === "landscape" ? "🖼 Landscape (Horisontal)" : "📄 Portrait (Vertikal)"}
                </button>
              ))}
            </div>
            <p className="text-xs text-black/60 font-semibold mt-2">
              💡 Sesuaikan dengan orientasi gambar desain Anda
            </p>
          </div>

          <Button type="button" variant="yellow" className="w-full"
            onClick={() => { if (!name.trim()) { toast.error("Nama template wajib diisi"); return; } setStep(2); }}>
            Lanjut: Upload Gambar →
          </Button>
        </div>
      )}

      {/* ===== STEP 2: Upload Gambar ===== */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="p-3 bg-sky/20 border-2 border-black text-sm font-semibold">
            <p className="font-bold mb-1">📐 Tips desain:</p>
            <ul className="space-y-0.5 text-black/70 text-xs">
              <li>• Buat di Canva, Word, Photoshop → export <strong>PNG atau JPG</strong></li>
              <li>• Biarkan area <strong>kosong</strong> di tempat nama siswa, tanggal, dll</li>
              <li>• Resolusi: <strong>2480×1754px</strong> (A4 landscape 300dpi) atau <strong>1754×2480px</strong> (portrait)</li>
              <li>• Maks file: <strong>10MB</strong></li>
            </ul>
          </div>

          <div {...getRootProps()} className={`border-3 border-dashed border-black p-8 text-center cursor-pointer transition-all
            ${isDragActive ? "bg-yellow/30 shadow-brutal" : "bg-cream hover:bg-yellow/10"}`}>
            <input {...getInputProps()} />
            {imagePreviewUrl ? (
              <div className="space-y-2">
                <img src={imagePreviewUrl} alt="Preview" className="max-h-48 mx-auto border-2 border-black object-contain" />
                <p className="text-sm font-bold text-black/60">{imageFile?.name}</p>
                <p className="text-xs text-black/50">Klik atau drag untuk ganti gambar</p>
              </div>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-sky border-3 border-black shadow-brutal mb-3">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <p className="font-bold mb-1">
                  {isDragActive ? "Drop gambar di sini..." : "Drag & Drop atau Klik"}
                </p>
                <p className="text-sm text-black/60">PNG, JPG, WebP · Maks 10MB</p>
              </>
            )}
          </div>

          {uploadedUrl && (
            <div className="p-3 bg-mint/30 border-2 border-black text-sm font-bold">
              ✓ Gambar sudah terupload — klik "Atur Posisi Teks" untuk lanjut
            </div>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="white" onClick={() => setStep(1)} className="flex-1">
              ← Kembali
            </Button>
            {!uploadedUrl ? (
              <Button type="button" variant="yellow" onClick={handleUploadImage}
                isLoading={isUploading} disabled={!imageFile}
                rightIcon={<Upload className="w-4 h-4" />} className="flex-1">
                Upload Gambar
              </Button>
            ) : (
              <Button type="button" variant="mint" onClick={() => setStep(3)} className="flex-1">
                Atur Posisi Teks →
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ===== STEP 3: Layer Editor ===== */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="p-2 bg-yellow/30 border-2 border-black text-xs font-bold">
            💡 Pilih layer di kiri → klik preview gambar atau pakai tombol ← → ↑ ↓ untuk pindahkan posisi
          </div>

          <LayerEditor
            positions={positions}
            selectedIdx={selectedIdx}
            imageUrl={imagePreviewUrl || uploadedUrl}
            orientation={orientation}
            onPositionsChange={setPositions}
            onSelectedIdxChange={setSelectedIdx}
          />

          <div className="flex gap-3 border-t-2 border-black pt-3 flex-shrink-0">
            <Button type="button" variant="white" onClick={() => setStep(2)} disabled={isLoading} className="flex-1">
              ← Kembali
            </Button>
            <Button type="button" variant="yellow" onClick={handleSubmit}
              isLoading={isLoading} rightIcon={<Plus className="w-4 h-4" />} className="flex-1">
              Simpan Template
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
