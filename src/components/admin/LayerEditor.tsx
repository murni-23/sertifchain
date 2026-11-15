"use client";

/**
 * LayerEditor — komponen reusable untuk mengelola daftar layer teks
 * di template sertifikat custom (upload gambar).
 *
 * Fitur:
 * - List layer + pilih layer aktif
 * - Edit field, font, ukuran, warna (dengan live preview warna teks)
 * - Tombol nudge (pindah sedikit) ← → ↑ ↓
 * - Alignment left/center/right
 * - Pilihan font dari FONT_OPTIONS
 * - Preview interaktif: klik gambar = pindah posisi layer aktif
 */

import { useRef } from "react";
import { Plus, Trash2, Move, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FONT_OPTIONS } from "@/lib/pdf/generateCertificate";
import type { TextPosition, FontFamily } from "@/lib/pdf/generateCertificate";

export const FIELD_OPTIONS: {
  value: TextPosition["field"];
  label: string;
  example: string;
  defaultColor: string;
}[] = [
  { value: "name",  label: "Nama Siswa",        example: "Budi Santoso",       defaultColor: "#1a56db" },
  { value: "batch", label: "Nama Batch/Program", example: "Batch Agustus 2026", defaultColor: "#9333ea" },
  { value: "date",  label: "Tanggal Klaim",      example: "1 September 2026",   defaultColor: "#16a34a" },
  { value: "code",  label: "Kode Unik",          example: "ABC12345",           defaultColor: "#ea580c" },
];

export const DEFAULT_POSITIONS: TextPosition[] = [
  { field: "name",  x: 50, y: 50, fontSize: 32, fontWeight: "bold",   fontFamily: "HelveticaBold", color: "#000000", align: "center", label: "Nama Siswa" },
  { field: "batch", x: 50, y: 38, fontSize: 18, fontWeight: "normal", fontFamily: "Helvetica",     color: "#333333", align: "center", label: "Nama Batch" },
  { field: "date",  x: 50, y: 28, fontSize: 13, fontWeight: "normal", fontFamily: "Helvetica",     color: "#555555", align: "center", label: "Tanggal" },
  { field: "code",  x: 10, y: 8,  fontSize: 10, fontWeight: "bold",   fontFamily: "HelveticaBold", color: "#000000", align: "left",   label: "Kode Unik" },
];

const NUDGE_STEP = 1; // persen per klik

interface LayerEditorProps {
  positions: TextPosition[];
  selectedIdx: number | null;
  imageUrl: string;
  orientation: "landscape" | "portrait";
  onPositionsChange: (positions: TextPosition[]) => void;
  onSelectedIdxChange: (idx: number | null) => void;
}

export function LayerEditor({
  positions,
  selectedIdx,
  imageUrl,
  orientation,
  onPositionsChange,
  onSelectedIdxChange,
}: LayerEditorProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  const updatePos = (idx: number, fields: Partial<TextPosition>) => {
    onPositionsChange(positions.map((p, i) => i === idx ? { ...p, ...fields } : p));
  };

  const addLayer = () => {
    const newPos: TextPosition = {
      field: "name", x: 50, y: 50, fontSize: 24,
      fontWeight: "bold", fontFamily: "HelveticaBold",
      color: "#000000", align: "center", label: "Teks Baru",
    };
    onPositionsChange([...positions, newPos]);
    onSelectedIdxChange(positions.length);
  };

  const removeLayer = (idx: number) => {
    onPositionsChange(positions.filter((_, i) => i !== idx));
    onSelectedIdxChange(null);
  };

  // Nudge: pindah sedikit
  const nudge = (dir: "left" | "right" | "up" | "down") => {
    if (selectedIdx === null || !positions[selectedIdx]) return;
    const p = positions[selectedIdx];
    const delta = NUDGE_STEP;
    const updates: Partial<TextPosition> = {
      left:  { x: Math.max(0,   Math.min(100, p.x - delta)) },
      right: { x: Math.max(0,   Math.min(100, p.x + delta)) },
      up:    { y: Math.max(0,   Math.min(100, p.y + delta)) },
      down:  { y: Math.max(0,   Math.min(100, p.y - delta)) },
    }[dir];
    updatePos(selectedIdx, updates);
  };

  // Klik preview → pindah layer aktif
  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedIdx === null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    // PDF: y=0 di bawah, y=100 di atas → invert dari CSS
    const yPct = Math.round(100 - ((e.clientY - rect.top) / rect.height) * 100);
    updatePos(selectedIdx, {
      x: Math.max(0, Math.min(100, xPct)),
      y: Math.max(0, Math.min(100, yPct)),
    });
  };

  const sel = selectedIdx !== null ? positions[selectedIdx] : null;

  return (
    <div className="border-3 border-black">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-100 text-slate-700">
        <p className="font-bold text-sm uppercase tracking-wide">Layer Teks Overlay</p>
        <Button type="button" variant="yellow" onClick={addLayer}
          leftIcon={<Plus className="w-3 h-3" />} className="py-1 px-3 text-xs">
          Tambah
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* ── Panel kiri: list + edit ── */}
        <div className="p-3 border-b-3 lg:border-b-0 lg:border-r-3 border-black space-y-3">

          {/* Daftar layer */}
          <div className="space-y-1 max-h-44 overflow-y-auto">
            {positions.length === 0 && (
              <p className="text-sm text-black/50 text-center py-3">Belum ada layer</p>
            )}
            {positions.map((pos, idx) => {
              const info = FIELD_OPTIONS.find(f => f.value === pos.field);
              const isSelected = selectedIdx === idx;
              return (
                <div key={idx} onClick={() => onSelectedIdxChange(idx)}
                  className={`flex items-center gap-2 p-2 border-2 border-black cursor-pointer transition-all select-none
                    ${isSelected ? "bg-yellow shadow-brutal-sm" : "bg-white hover:bg-cream"}`}>
                  {/* Dot warna AKTUAL dari pos.color */}
                  <div className="w-4 h-4 rounded-full flex-shrink-0 border-2 border-black/30"
                    style={{ background: pos.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{info?.label}</p>
                    <p className="text-xs text-black/50">
                      x:{pos.x}% y:{pos.y}% · {pos.fontSize}px ·{" "}
                      {FONT_OPTIONS.find(f => f.value === pos.fontFamily)?.label || pos.fontFamily}
                    </p>
                  </div>
                  <button type="button"
                    onClick={(e) => { e.stopPropagation(); removeLayer(idx); }}
                    className="p-1 hover:bg-red-100 rounded flex-shrink-0">
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* ── Edit panel layer terpilih ── */}
          {sel && selectedIdx !== null && (
            <div className="p-3 bg-cream border-2 border-black space-y-3">
              <p className="text-xs font-bold uppercase text-black/60">Edit Layer #{selectedIdx + 1}</p>

              {/* Field */}
              <div>
                <label className="text-xs font-bold text-black/60 uppercase">Field</label>
                <select value={sel.field}
                  onChange={e => updatePos(selectedIdx, { field: e.target.value as TextPosition["field"] })}
                  className="w-full mt-1 px-3 py-2 border-2 border-black bg-white font-semibold text-sm focus:outline-none">
                  {FIELD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {/* Font family */}
              <div>
                <label className="text-xs font-bold text-black/60 uppercase">Font</label>
                <select value={sel.fontFamily || "Helvetica"}
                  onChange={e => {
                    const fam = e.target.value as FontFamily;
                    // Auto-set fontWeight dari nama font
                    const isBold = fam.includes("Bold");
                    updatePos(selectedIdx, { fontFamily: fam, fontWeight: isBold ? "bold" : "normal" });
                  }}
                  className="w-full mt-1 px-3 py-2 border-2 border-black bg-white font-semibold text-sm focus:outline-none">
                  {FONT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {/* Font size + warna */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-black/60 uppercase">Ukuran (px)</label>
                  <input type="number" min={6} max={120}
                    value={sel.fontSize}
                    onChange={e => updatePos(selectedIdx, { fontSize: Math.max(6, Number(e.target.value)) })}
                    className="w-full mt-1 px-3 py-2 border-2 border-black bg-white font-semibold text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-black/60 uppercase">Warna Teks</label>
                  <div className="flex gap-1 mt-1">
                    <input type="color" value={sel.color}
                      onChange={e => updatePos(selectedIdx, { color: e.target.value })}
                      className="h-10 w-12 border-2 border-black cursor-pointer flex-shrink-0" />
                    <input type="text" value={sel.color}
                      onChange={e => {
                        // Validasi hex sebelum update
                        const v = e.target.value;
                        if (/^#[0-9a-fA-F]{0,6}$/.test(v)) {
                          updatePos(selectedIdx, { color: v });
                        }
                      }}
                      className="flex-1 px-2 border-2 border-black bg-white font-mono text-xs focus:outline-none min-w-0"
                      placeholder="#000000" maxLength={7} />
                  </div>
                  {/* Live preview warna — teks contoh dengan warna & font aktual */}
                  <div className="mt-2 p-2 border border-black/20 bg-white flex items-center justify-center min-h-8">
                    <span style={{
                      color: sel.color,
                      fontWeight: sel.fontWeight === "bold" ? "bold" : "normal",
                      fontSize: `${Math.max(10, Math.min(sel.fontSize * 0.5, 20))}px`,
                    }}>
                      {FIELD_OPTIONS.find(f => f.value === sel.field)?.example || "Preview"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Alignment */}
              <div>
                <label className="text-xs font-bold text-black/60 uppercase">Alignment</label>
                <div className="flex gap-1 mt-1">
                  {(["left", "center", "right"] as const).map(a => (
                    <button key={a} type="button"
                      onClick={() => updatePos(selectedIdx, { align: a })}
                      className={`flex-1 py-2 border-2 border-black text-sm font-bold transition-all
                        ${sel.align === a ? "bg-yellow shadow-brutal-sm" : "bg-white hover:bg-cream"}`}>
                      {a === "left" ? "Kiri" : a === "center" ? "Tengah" : "Kanan"}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-black/50 mt-1">
                  {sel.align === "left" && "Titik X = tepi KIRI teks"}
                  {sel.align === "center" && "Titik X = TENGAH teks"}
                  {sel.align === "right" && "Titik X = tepi KANAN teks"}
                </p>
              </div>

              {/* Koordinat X/Y manual */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-black/60 uppercase">X (%)</label>
                  <input type="number" min={0} max={100}
                    value={sel.x}
                    onChange={e => updatePos(selectedIdx, { x: Math.max(0, Math.min(100, Number(e.target.value))) })}
                    className="w-full mt-1 px-3 py-2 border-2 border-black bg-white font-semibold text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-black/60 uppercase">Y (% · 0=bawah)</label>
                  <input type="number" min={0} max={100}
                    value={sel.y}
                    onChange={e => updatePos(selectedIdx, { y: Math.max(0, Math.min(100, Number(e.target.value))) })}
                    className="w-full mt-1 px-3 py-2 border-2 border-black bg-white font-semibold text-sm focus:outline-none" />
                </div>
              </div>

              {/* Tombol nudge */}
              <div>
                <label className="text-xs font-bold text-black/60 uppercase">Geser Posisi (1% per klik)</label>
                <div className="mt-1 flex flex-col items-center gap-1">
                  {/* Atas */}
                  <button type="button" onClick={() => nudge("up")}
                    className="p-2 border-2 border-black bg-white hover:bg-yellow active:translate-y-0.5 transition-all shadow-brutal-sm hover:shadow-none">
                    <ChevronUp className="w-5 h-5" />
                  </button>
                  {/* Kiri / Kanan */}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => nudge("left")}
                      className="p-2 border-2 border-black bg-white hover:bg-yellow active:translate-x-0.5 transition-all shadow-brutal-sm hover:shadow-none">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 border-2 border-black bg-cream flex items-center justify-center">
                      <Move className="w-4 h-4 text-black/40" />
                    </div>
                    <button type="button" onClick={() => nudge("right")}
                      className="p-2 border-2 border-black bg-white hover:bg-yellow active:-translate-x-0.5 transition-all shadow-brutal-sm hover:shadow-none">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  {/* Bawah */}
                  <button type="button" onClick={() => nudge("down")}
                    className="p-2 border-2 border-black bg-white hover:bg-yellow active:-translate-y-0.5 transition-all shadow-brutal-sm hover:shadow-none">
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {!sel && (
            <p className="text-xs text-black/50 text-center py-2">
              Pilih layer di atas untuk mulai edit
            </p>
          )}
        </div>

        {/* ── Panel kanan: preview interaktif ── */}
        <div className="p-3 space-y-2">
          <p className="text-xs font-bold uppercase flex items-center gap-1 text-black/70">
            <Move className="w-3 h-3" />
            Klik gambar = pindah layer aktif · atau pakai tombol geser
          </p>

          <div
            ref={previewRef}
            className={`relative border-3 border-black overflow-hidden bg-gray-100
              ${selectedIdx !== null ? "cursor-crosshair" : "cursor-default"}`}
            style={{ aspectRatio: orientation === "landscape" ? "842/595" : "595/842" }}
            onClick={handlePreviewClick}
          >
            {imageUrl && (
              <img src={imageUrl} alt="Preview template" className="w-full h-full object-fill pointer-events-none" />
            )}

            {/* Render semua layer dengan warna & font aktual */}
            {positions.map((pos, idx) => {
              const info = FIELD_OPTIONS.find(f => f.value === pos.field);
              const isSelected = selectedIdx === idx;
              const topPct  = 100 - pos.y;   // CSS top: 0=atas, 100=bawah
              const leftPct = pos.x;

              return (
                <div
                  key={idx}
                  className={`absolute cursor-pointer z-10 transition-transform select-none
                    ${isSelected ? "scale-110" : "scale-100 hover:scale-105"}`}
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    // Alignment: translate CSS sesuai dengan alignment PDF
                    transform: `scale(${isSelected ? 1.1 : 1}) translateY(-50%) ${
                      pos.align === "center" ? "translateX(-50%)" :
                      pos.align === "right"  ? "translateX(-100%)" : "translateX(0)"
                    }`,
                  }}
                  onClick={(e) => { e.stopPropagation(); onSelectedIdxChange(idx); }}
                >
                  <div
                    className={`px-1.5 py-0.5 whitespace-nowrap border-2 shadow-md
                      ${isSelected ? "border-white ring-1 ring-black" : "border-transparent"}`}
                    style={{
                      // Warna background = warna teks (gelap/terang otomatis)
                      background: pos.color,
                      // Warna teks kontras otomatis
                      color: isLight(pos.color) ? "#000" : "#fff",
                      fontWeight: pos.fontWeight === "bold" ? "bold" : "normal",
                      // Skala font relatif ke preview
                      fontSize: `${Math.max(7, Math.min(pos.fontSize * 0.2, 14))}px`,
                      textShadow: "none",
                    }}
                  >
                    {info?.example || pos.label}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-black/50">
            Y: 0% = paling bawah sertifikat · 100% = paling atas
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Helper: cek apakah warna hex terang ──
function isLight(hex: string): boolean {
  const clean = hex.replace("#", "");
  if (clean.length < 6) return true;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  // Luminance sederhana
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}
