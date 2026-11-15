"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type StyleOption = "classic" | "kids";

const STYLE_OPTIONS: { value: StyleOption; label: string; desc: string; emoji: string }[] = [
  { value: "classic", label: "Klasik Elegan", desc: "Navy blue + emas, formal, cocok semua umur", emoji: "🎓" },
  { value: "kids", label: "Ceria Kids", desc: "Kuning + pink, playful, dekorasi bintang", emoji: "🎉" },
];

// Preset warna per style
const COLOR_PRESETS: Record<StyleOption, {
  primaryColor: [number, number, number];
  secondaryColor: [number, number, number];
  bgColor: [number, number, number];
  textColor: [number, number, number];
  titleText: string;
  subtitleText: string;
  footerText: string;
}> = {
  classic: {
    primaryColor: [0.08, 0.15, 0.40],
    secondaryColor: [0.85, 0.65, 0.13],
    bgColor: [0.98, 0.97, 0.93],
    textColor: [0.08, 0.08, 0.08],
    titleText: "SERTIFIKAT PENGHARGAAN",
    subtitleText: "Certificate of Achievement",
    footerText: "SertifChain · Sertifikat Digital Terverifikasi",
  },
  kids: {
    primaryColor: [1.0, 0.82, 0.0],
    secondaryColor: [1.0, 0.43, 0.71],
    bgColor: [1.0, 0.98, 0.94],
    textColor: [0.04, 0.04, 0.04],
    titleText: "SERTIFIKAT BINTANG",
    subtitleText: "Selamat! Kamu Berhasil! 🌟",
    footerText: "SertifChain · Sertifikat Digital Bimbel",
  },
};

export function CreateTemplateModal({ isOpen, onClose, onSuccess }: CreateTemplateModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedStyle, setSelectedStyle] = useState<StyleOption>("classic");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    titleText: COLOR_PRESETS.classic.titleText,
    subtitleText: COLOR_PRESETS.classic.subtitleText,
    footerText: COLOR_PRESETS.classic.footerText,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleStyleSelect = (style: StyleOption) => {
    setSelectedStyle(style);
    const preset = COLOR_PRESETS[style];
    setFormData(prev => ({
      ...prev,
      titleText: preset.titleText,
      subtitleText: preset.subtitleText,
      footerText: preset.footerText,
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = "Nama template wajib diisi";
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
      const preset = COLOR_PRESETS[selectedStyle];
      const config = {
        style: selectedStyle,
        primaryColor: preset.primaryColor,
        secondaryColor: preset.secondaryColor,
        bgColor: preset.bgColor,
        textColor: preset.textColor,
        titleText: formData.titleText.trim() || preset.titleText,
        subtitleText: formData.subtitleText.trim() || preset.subtitleText,
        accentBorder: true,
        showRibbon: selectedStyle === "classic",
        showStars: selectedStyle === "kids",
        footerText: formData.footerText.trim() || preset.footerText,
      };

      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          config,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat template");

      toast.success("Template berhasil dibuat! 🎨");
      handleClose();
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setStep(1);
    setSelectedStyle("classic");
    setFormData({
      name: "",
      description: "",
      titleText: COLOR_PRESETS.classic.titleText,
      subtitleText: COLOR_PRESETS.classic.subtitleText,
      footerText: COLOR_PRESETS.classic.footerText,
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Tambah Template Baru" size="lg">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 border-2 border-black flex items-center justify-center font-bold text-sm
              ${step === s ? "bg-yellow" : step > s ? "bg-mint" : "bg-cream"}`}>
              {step > s ? "✓" : s}
            </div>
            <span className="text-sm font-semibold hidden sm:block">
              {s === 1 ? "Info & Style" : "Teks Sertifikat"}
            </span>
            {s < 2 && <div className="w-8 h-0.5 bg-slate-200" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* STEP 1 — Info dasar + pilih style */}
        {step === 1 && (
          <div className="space-y-5">
            <Input
              label="Nama Template"
              name="name"
              placeholder="Contoh: Template Wisuda 2026"
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
                placeholder="Deskripsi singkat template..."
                value={formData.description}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-3 font-semibold bg-white border-3 border-black shadow-brutal focus:outline-none focus:shadow-brutal-sm transition-shadow resize-none placeholder:text-black/40"
              />
            </div>

            {/* Pilih style */}
            <div>
              <label className="block mb-3 text-sm font-bold text-black uppercase tracking-wide">
                Pilih Gaya Desain
              </label>
              <div className="grid grid-cols-2 gap-3">
                {STYLE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleStyleSelect(opt.value)}
                    className={`p-4 border-3 border-black text-left transition-all
                      ${selectedStyle === opt.value
                        ? "bg-yellow shadow-brutal translate-x-0.5 translate-y-0.5"
                        : "bg-white shadow-brutal hover:shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5"
                      }`}
                  >
                    <div className="text-3xl mb-2">{opt.emoji}</div>
                    <div className="font-bold">{opt.label}</div>
                    <div className="text-xs text-black/60 mt-1">{opt.desc}</div>
                    {selectedStyle === opt.value && (
                      <div className="mt-2 text-xs font-bold text-mint">✓ Dipilih</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Button type="button" variant="yellow" className="w-full" onClick={handleNext} rightIcon={<Plus className="w-4 h-4" />}>
              Lanjut →
            </Button>
          </div>
        )}

        {/* STEP 2 — Kustomisasi teks */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="p-3 bg-yellow/30 border-2 border-black">
              <p className="text-sm font-bold">
                {selectedStyle === "kids" ? "🎉" : "🎓"} Gaya: {selectedStyle === "kids" ? "Ceria Kids" : "Klasik Elegan"}
                {" — "}Template: <span className="underline">{formData.name}</span>
              </p>
            </div>

            <Input
              label="Judul Utama Sertifikat"
              name="titleText"
              placeholder="SERTIFIKAT PENGHARGAAN"
              value={formData.titleText}
              onChange={handleChange}
              helperText="Teks besar di header sertifikat"
            />

            <Input
              label="Subjudul"
              name="subtitleText"
              placeholder="Certificate of Achievement"
              value={formData.subtitleText}
              onChange={handleChange}
              helperText="Teks kecil di bawah judul"
            />

            <Input
              label="Teks Footer"
              name="footerText"
              placeholder="SertifChain · Sertifikat Digital"
              value={formData.footerText}
              onChange={handleChange}
              helperText="Teks di bagian bawah sertifikat"
            />

            <div className="p-3 bg-pink-light border-2 border-black text-sm font-semibold">
              💡 Warna, font, dan layout otomatis mengikuti gaya yang dipilih di langkah sebelumnya.
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="white" onClick={() => setStep(1)} className="flex-1" disabled={isLoading}>
                ← Kembali
              </Button>
              <Button type="submit" variant="mint" isLoading={isLoading} className="flex-1" rightIcon={<Plus className="w-4 h-4" />}>
                Buat Template
              </Button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
