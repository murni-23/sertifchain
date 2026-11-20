"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Trash2,
  CheckCircle,
  Check,
  FileImage,
  Pencil,
  ImageIcon,
  GraduationCap,
  Sparkles,
  Star,
  Settings2,
} from "lucide-react";

export interface TemplateItem {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  background_image_url?: string | null;
  text_positions?: any[] | null;
  page_orientation?: string | null;
  config: {
    style: string;
    primaryColor: [number, number, number];
    secondaryColor: [number, number, number];
    bgColor: [number, number, number];
    titleText: string;
    subtitleText: string;
  } | null;
  created_at: string;
}

interface TemplatePreviewCardProps {
  template: TemplateItem;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onDelete?: (id: string, name: string) => void;
  onEdit?: (template: TemplateItem) => void;
  selectable?: boolean;
}

function toRgbCss(arr?: [number, number, number]): string {
  if (!arr) return "#ffffff";
  return `rgb(${Math.round(arr[0] * 255)},${Math.round(arr[1] * 255)},${Math.round(arr[2] * 255)})`;
}

function StyleBadge({ style, hasImage }: { style: string; hasImage?: boolean }) {
  if (hasImage) return <Badge variant="mint"><ImageIcon className="mr-1 h-3.5 w-3.5" />Upload Gambar</Badge>;
  if (style === "kids") return <Badge variant="pink"><Sparkles className="mr-1 h-3.5 w-3.5" />Ceria Kids</Badge>;
  if (style === "classic") return <Badge variant="black"><GraduationCap className="mr-1 h-3.5 w-3.5" />Klasik Elegan</Badge>;
  return <Badge variant="yellow"><Settings2 className="mr-1 h-3.5 w-3.5" />Custom</Badge>;
}

// Mini preview untuk template dengan background gambar
function ImageTemplateMiniPreview({
  imageUrl,
  positions,
  orientation,
}: {
  imageUrl: string;
  positions: any[];
  orientation?: string;
}) {
  const isPortrait = orientation === "portrait";
  return (
    <div
      className="w-full border-3 border-black shadow-brutal relative overflow-hidden bg-gray-100"
      style={{ aspectRatio: isPortrait ? "595/842" : "842/595" }}
    >
      <img src={imageUrl} alt="Template" className="w-full h-full object-fill" />
      {/* Overlay preview posisi teks */}
      {positions.map((pos: any, i: number) => {
        const topPct = 100 - pos.y;
        const leftPct = pos.x;
        const fieldLabels: Record<string, string> = {
          name: "Nama Siswa",
          batch: "Nama Batch",
          date: "Tanggal",
          code: "Kode",
        };
        return (
          <div
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${leftPct}%`, top: `${topPct}%` }}
          >
            <div
              className="px-1 py-0.5 text-white text-[7px] font-bold whitespace-nowrap border border-white/50"
              style={{
                background: pos.color || "#1a56db",
                fontSize: `${Math.max(6, Math.min(pos.fontSize * 0.18, 10))}px`,
                color: "white",
                textShadow: "0 0 3px rgba(0,0,0,0.8)",
              }}
            >
              {fieldLabels[pos.field] || pos.field}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Mini preview SVG untuk template generated (classic/kids)
function GeneratedTemplateMiniPreview({ config }: { config: TemplateItem["config"] }) {
  if (!config) return null;

  const bg = toRgbCss(config.bgColor);
  const primary = toRgbCss(config.primaryColor);
  const secondary = toRgbCss(config.secondaryColor);
  const isKids = config.style === "kids";

  return (
    <svg
      viewBox="0 0 280 198"
      className="w-full border-3 border-black shadow-brutal"
      style={{ background: bg }}
      aria-hidden="true"
    >
      <rect x="6" y="6" width="268" height="186" fill="none" stroke="#0a0a0a" strokeWidth={isKids ? "3" : "2.5"} />
      <rect x="10" y="10" width="260" height="178" fill="none" stroke={secondary} strokeWidth="1.5" />
      <rect x="14" y="14" width="252" height="44" fill={primary} />
      {!isKids && <rect x="14" y="56" width="252" height="2" fill={secondary} />}
      <text x="140" y="40" textAnchor="middle" fontSize="10" fontWeight="bold"
        fill={isKids ? "#0a0a0a" : secondary} fontFamily="sans-serif">
        {config.titleText.length > 24 ? config.titleText.slice(0, 22) + "…" : config.titleText}
      </text>
      {isKids && (
        <>
          <Star x="16" y="29" width="16" height="16" fill={secondary} stroke={secondary} />
          <Star x="244" y="29" width="16" height="16" fill={secondary} stroke={secondary} />
        </>
      )}
      {isKids ? (
        <>
          <rect x="74" y="60" width="132" height="18" fill={secondary} stroke="#0a0a0a" strokeWidth="1.5" />
          <text x="140" y="73" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white" fontFamily="sans-serif">
            {config.subtitleText.length > 26 ? config.subtitleText.slice(0, 24) + "…" : config.subtitleText}
          </text>
        </>
      ) : (
        <text x="140" y="72" textAnchor="middle" fontSize="7" fill={primary} fontFamily="sans-serif" fontStyle="italic">
          {config.subtitleText}
        </text>
      )}
      <text x="140" y="90" textAnchor="middle" fontSize="6.5" fill="#555" fontFamily="sans-serif">Diberikan kepada:</text>
      {isKids ? (
        <>
          <rect x="38" y="95" width="208" height="24" fill="#0a0a0a" />
          <rect x="35" y="93" width="208" height="24" fill="rgb(61,207,168)" stroke="#0a0a0a" strokeWidth="2" />
        </>
      ) : (
        <>
          <rect x="50" y="94" width="180" height="24" fill="rgb(250,240,204)" stroke={secondary} strokeWidth="1.5" />
          <rect x="53" y="97" width="174" height="18" fill="white" stroke={primary} strokeWidth="0.8" />
        </>
      )}
      <text x="140" y="109" textAnchor="middle" fontSize="10" fontWeight="bold" fill={isKids ? "#0a0a0a" : primary} fontFamily="sans-serif">Nama Siswa</text>
      <text x="140" y="128" textAnchor="middle" fontSize="6" fill="#555" fontFamily="sans-serif">Atas keberhasilan menyelesaikan program</text>
      <text x="140" y={isKids ? "142" : "140"} textAnchor="middle" fontSize="7" fontWeight="bold" fill={isKids ? "#0a0a0a" : secondary} fontFamily="sans-serif">Nama Batch</text>
      <rect x="28" y="156" width="70" height="28" fill="white" stroke={isKids ? "#0a0a0a" : primary} strokeWidth="1.2" />
      <rect x={280 - 28 - 70} y="156" width="70" height="28" fill="white" stroke={isKids ? "#0a0a0a" : primary} strokeWidth="1.2" />
      <text x="63" y="165" textAnchor="middle" fontSize="5.5" fill="#888" fontFamily="sans-serif">Kepala Bimbel</text>
      <text x={280 - 28 - 35} y="165" textAnchor="middle" fontSize="5.5" fill="#888" fontFamily="sans-serif">Pengajar</text>
      <rect x="14" y="185" width="252" height="13" fill={isKids ? "#0a0a0a" : primary} />
      <text x="140" y="194" textAnchor="middle" fontSize="5" fill="white" fontFamily="sans-serif">SertifChain · Sertifikat Digital</text>
      {!isKids && (
        <>
          <rect x="14" y="14" width="10" height="10" fill={secondary} />
          <rect x="256" y="14" width="10" height="10" fill={secondary} />
          <rect x="14" y="174" width="10" height="10" fill={secondary} />
          <rect x="256" y="174" width="10" height="10" fill={secondary} />
        </>
      )}
    </svg>
  );
}

const BUILT_IN_IDS = [
  "a1b2c3d4-0001-0001-0001-000000000001",
  "a1b2c3d4-0002-0002-0002-000000000002",
];

export function TemplatePreviewCard({
  template,
  isSelected = false,
  onSelect,
  onDelete,
  onEdit,
  selectable = false,
}: TemplatePreviewCardProps) {
  const isBuiltIn = BUILT_IN_IDS.includes(template.id);
  const hasImage = !!template.background_image_url;

  return (
    <div
      className={`relative flex flex-col border-3 border-black transition-all duration-150 bg-white
        ${isSelected ? "shadow-brutal-yellow translate-x-1 translate-y-1" : "shadow-brutal hover:shadow-brutal-lg"}
        ${selectable ? "cursor-pointer" : ""}
      `}
      onClick={selectable && onSelect ? () => onSelect(template.id) : undefined}
      role={selectable ? "button" : undefined}
      aria-pressed={selectable ? isSelected : undefined}
    >
      {/* Selected checkmark */}
      {isSelected && (
        <div className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-mint border-3 border-black flex items-center justify-center">
          <CheckCircle className="w-4 h-4" />
        </div>
      )}

      {/* Built-in badge */}
      {isBuiltIn && (
        <div className="absolute top-2 left-2 z-10">
          <span className="px-2 py-0.5 text-xs font-bold bg-yellow border-2 border-black">BAWAAN</span>
        </div>
      )}

      {/* Preview area */}
      <div className="p-4 pt-8 bg-cream border-b-3 border-black">
        {hasImage ? (
          <ImageTemplateMiniPreview
            imageUrl={template.background_image_url!}
            positions={template.text_positions || []}
            orientation={template.page_orientation || "landscape"}
          />
        ) : (
          <GeneratedTemplateMiniPreview config={template.config} />
        )}
      </div>

      {/* Info area */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg leading-tight break-words [overflow-wrap:anywhere]">{template.name}</h3>
            {template.description && (
            <p className="text-sm text-black/60 mt-1 line-clamp-2 break-words [overflow-wrap:anywhere]">
              {template.description}
            </p>
            )}
          </div>
          <StyleBadge style={template.config?.style || "custom"} hasImage={hasImage} />
        </div>

        <p className="text-xs text-black/50 font-semibold">
          Dibuat: {new Date(template.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
        </p>

        {/* Actions */}
        {!selectable && (
          <div className="flex gap-2 mt-auto">
            {onEdit && !isBuiltIn && (
              <Button
                variant="yellow"
                className="flex-1"
                onClick={(e) => { e.stopPropagation(); onEdit(template); }}
                leftIcon={<Pencil className="w-4 h-4" />}
              >
                Edit
              </Button>
            )}
            {onDelete && !isBuiltIn && (
              <Button
                variant="white"
                className="flex-1"
                onClick={(e) => { e.stopPropagation(); onDelete(template.id, template.name); }}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Hapus
              </Button>
            )}
          </div>
        )}

        {selectable && (
          <div className={`w-full py-2 border-2 border-black text-center font-bold text-sm transition-all
            ${isSelected ? "bg-mint" : "bg-cream hover:bg-yellow/50"}`}>
            {isSelected ? (
              <span className="inline-flex items-center gap-1">
                <Check className="h-4 w-4" />
                Dipilih
              </span>
            ) : "Pilih Template Ini"}
          </div>
        )}
      </div>
    </div>
  );
}
