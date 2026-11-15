"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LayerEditor } from "@/components/admin/LayerEditor";
import toast from "react-hot-toast";
import { Upload, Save, ImageIcon } from "lucide-react";
import type { TextPosition } from "@/lib/pdf/generateCertificate";
import type { TemplateItem } from "@/components/admin/TemplatePreviewCard";

interface EditTemplateModalProps {
  isOpen: boolean;
  template: TemplateItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditTemplateModal({ isOpen, template, onClose, onSuccess }: EditTemplateModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [orientation, setOrientation] = useState<"landscape" | "portrait">("landscape");
  const [positions, setPositions] = useState<TextPosition[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // Gambar
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("");
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreviewUrl, setNewImagePreviewUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  // Isi form saat template berubah
  useEffect(() => {
    if (!template || !isOpen) return;
    setName(template.name);
    setDescription(template.description || "");
    setOrientation((template.page_orientation as "landscape" | "portrait") || "landscape");
    setPositions(
      Array.isArray(template.text_positions) && template.text_positions.length > 0
        ? template.text_positions
        : []
    );
    setCurrentImageUrl(template.background_image_url || "");
    setNewImageFile(null);
    setNewImagePreviewUrl("");
    setSelectedIdx(null);
  }, [template, isOpen]);

  // ── Dropzone ganti gambar ──
  const onDrop = useCallback((accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;
    setNewImageFile(file);
    setNewImagePreviewUrl(URL.createObjectURL(file));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"], "image/webp": [".webp"] },
    maxFiles: 1, maxSize: 10 * 1024 * 1024,
    onDropRejected: () => toast.error("Format tidak didukung atau file > 10MB"),
  });

  const handleUploadNewImage = async () => {
    if (!newImageFile) return;
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", newImageFile);
      const res = await fetch("/api/templates/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal upload");
      setCurrentImageUrl(data.url);
      setNewImageFile(null);
      setNewImagePreviewUrl("");
      toast.success("Gambar berhasil diganti!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!template) return;
    if (!name.trim()) { toast.error("Nama template wajib diisi"); return; }

    setIsLoading(true);
    try {
      const body: any = {
        name: name.trim(),
        description: description.trim() || null,
        text_positions: positions,
        page_orientation: orientation,
      };

      // Upload gambar baru dulu jika ada
      if (newImageFile) {
        const fd = new FormData();
        fd.append("file", newImageFile);
        const uploadRes = await fetch("/api/templates/upload", { method: "POST", body: fd });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Gagal upload gambar");
        body.background_image_url = uploadData.url;
      } else if (currentImageUrl) {
        body.background_image_url = currentImageUrl;
      }

      const res = await fetch(`/api/templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan");

      toast.success("Template berhasil diperbarui! ✅");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!template) return null;

  const isImageTemplate = !!(template.background_image_url || newImagePreviewUrl);
  const previewImage = newImagePreviewUrl || currentImageUrl;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit: ${template.name}`} size="xl">
      <div className="space-y-5">

        {/* ── Info dasar ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nama Template" value={name} onChange={e => setName(e.target.value)} />
          <div>
            <label className="block mb-2 text-sm font-bold text-black uppercase tracking-wide">
              Deskripsi
            </label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full px-3 py-2 font-semibold bg-white border-3 border-black focus:outline-none
                focus:shadow-brutal-sm resize-none placeholder:text-black/40 text-sm"
              placeholder="Deskripsi singkat..." />
          </div>
        </div>

        {/* ── Orientasi ── */}
        {isImageTemplate && (
          <div>
            <label className="block mb-2 text-sm font-bold text-black uppercase tracking-wide">
              Orientasi
            </label>
            <div className="flex gap-3">
              {(["landscape", "portrait"] as const).map(o => (
                <button key={o} type="button" onClick={() => setOrientation(o)}
                  className={`flex-1 py-2 border-2 border-black font-bold text-sm transition-all
                    ${orientation === o ? "bg-yellow shadow-brutal-sm" : "bg-white hover:bg-cream"}`}>
                  {o === "landscape" ? "🖼 Landscape" : "📄 Portrait"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Ganti gambar background ── */}
        {isImageTemplate && (
          <div className="border-3 border-black">
            <div className="px-3 py-2 bg-slate-100 text-slate-700">
              <p className="font-bold text-sm uppercase">Ganti Gambar Background</p>
            </div>
            <div className="p-3 space-y-3">
              <div {...getRootProps()} className={`border-2 border-dashed border-black p-4 text-center cursor-pointer transition-all
                ${isDragActive ? "bg-yellow/30" : "hover:bg-yellow/10 bg-cream"}`}>
                <input {...getInputProps()} />
                {newImagePreviewUrl ? (
                  <div>
                    <img src={newImagePreviewUrl} alt="Preview baru"
                      className="max-h-28 mx-auto border border-black mb-2 object-contain" />
                    <p className="text-xs font-bold text-black/60">{newImageFile?.name}</p>
                  </div>
                ) : currentImageUrl ? (
                  <div>
                    <img src={currentImageUrl} alt="Gambar aktif"
                      className="max-h-20 mx-auto border border-black mb-1 object-contain opacity-60" />
                    <p className="text-xs text-black/50">Klik atau drag untuk ganti gambar</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-black/60 py-4">
                    <ImageIcon className="w-5 h-5" />
                    <span className="text-sm font-semibold">Drag atau klik untuk upload gambar</span>
                  </div>
                )}
              </div>

              {newImageFile && (
                <Button type="button" variant="mint" onClick={handleUploadNewImage}
                  isLoading={isUploading} leftIcon={<Upload className="w-4 h-4" />} className="w-full">
                  Upload Gambar Baru
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ── Layer Editor (hanya template gambar) ── */}
        {isImageTemplate && (
          <LayerEditor
            positions={positions}
            selectedIdx={selectedIdx}
            imageUrl={previewImage}
            orientation={orientation}
            onPositionsChange={setPositions}
            onSelectedIdxChange={setSelectedIdx}
          />
        )}

        {/* ── Info untuk template non-gambar ── */}
        {!isImageTemplate && (
          <div className="p-4 bg-cream border-2 border-black text-sm">
            <p className="font-bold mb-1">ℹ️ Template Generated</p>
            <p className="text-black/60">
              Template ini menggunakan desain yang di-generate otomatis (bukan upload gambar).
              Hanya nama dan deskripsi yang bisa diubah.
            </p>
          </div>
        )}

        {/* ── Tombol simpan ── */}
        <div className="flex gap-3 pt-2 border-t-2 border-black">
          <Button type="button" variant="white" onClick={onClose} disabled={isLoading} className="flex-1">
            Batal
          </Button>
          <Button type="button" variant="yellow" onClick={handleSave}
            isLoading={isLoading} rightIcon={<Save className="w-4 h-4" />} className="flex-1">
            Simpan Perubahan
          </Button>
        </div>
      </div>
    </Modal>
  );
}
