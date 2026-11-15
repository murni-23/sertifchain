import { PDFDocument, rgb, StandardFonts, RGB } from "pdf-lib";

// =============================================
// Font options yang tersedia (StandardFonts pdf-lib)
// =============================================
export const FONT_OPTIONS = [
  { value: "Helvetica",       label: "Helvetica (Sans)" },
  { value: "HelveticaBold",   label: "Helvetica Bold" },
  { value: "Times",           label: "Times Roman (Serif)" },
  { value: "TimesBold",       label: "Times Bold" },
  { value: "TimesItalic",     label: "Times Italic" },
  { value: "Courier",         label: "Courier (Monospace)" },
  { value: "CourierBold",     label: "Courier Bold" },
] as const;

export type FontFamily = typeof FONT_OPTIONS[number]["value"];

// Map font name → StandardFonts enum
const FONT_MAP: Record<FontFamily, StandardFonts> = {
  Helvetica:     StandardFonts.Helvetica,
  HelveticaBold: StandardFonts.HelveticaBold,
  Times:         StandardFonts.TimesRoman,
  TimesBold:     StandardFonts.TimesRomanBold,
  TimesItalic:   StandardFonts.TimesRomanItalic,
  Courier:       StandardFonts.Courier,
  CourierBold:   StandardFonts.CourierBold,
};

// =============================================
// Types
// =============================================

export interface TextPosition {
  field: "name" | "batch" | "code" | "date";
  x: number;          // 0–100 (persen dari lebar halaman)
  y: number;          // 0–100 (persen dari tinggi halaman, 0=bawah, 100=atas)
  fontSize: number;
  fontWeight: "bold" | "normal";
  fontFamily: FontFamily;   // ← BARU
  color: string;            // hex, contoh: "#000000"
  align: "center" | "left" | "right";
  label: string;
}

export interface TemplateConfig {
  style: "classic" | "kids" | "custom";
  primaryColor: [number, number, number];
  secondaryColor: [number, number, number];
  bgColor: [number, number, number];
  textColor: [number, number, number];
  titleText: string;
  subtitleText: string;
  accentBorder: boolean;
  showRibbon: boolean;
  showStars?: boolean;
  showWatermark?: boolean;
  footerText: string;
}

export interface CertificateData {
  studentName: string;
  batchName: string;
  uniqueCode: string;
  claimedDate?: string | null;
  templateConfig?: TemplateConfig | null;
  // Untuk template custom (upload gambar)
  backgroundImageUrl?: string | null;
  textPositions?: TextPosition[] | null;
  pageOrientation?: "landscape" | "portrait" | null;
}

// =============================================
// Default config fallback (Template Klasik)
// =============================================
const DEFAULT_CONFIG: TemplateConfig = {
  style: "classic",
  primaryColor: [0.08, 0.15, 0.40],
  secondaryColor: [0.85, 0.65, 0.13],
  bgColor: [0.98, 0.97, 0.93],
  textColor: [0.08, 0.08, 0.08],
  titleText: "SERTIFIKAT PENGHARGAAN",
  subtitleText: "Certificate of Achievement",
  accentBorder: true,
  showRibbon: true,
  showWatermark: false,
  footerText: "SertifChain · Sertifikat Digital Terverifikasi",
};

// =============================================
// Helper: format tanggal Indonesia
// =============================================
function formatDate(dateStr?: string | null): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// =============================================
// Helper: clamp text width agar tidak overflow
// =============================================
function clampText(
  text: string,
  font: any,
  fontSize: number,
  maxWidth: number
): { text: string; size: number } {
  let size = fontSize;
  while (font.widthOfTextAtSize(text, size) > maxWidth && size > 10) {
    size -= 1;
  }
  return { text, size };
}

// =============================================
// TEMPLATE 1 — KLASIK ELEGAN
// Navy blue + gold, formal, corner ornaments
// =============================================
async function renderClassic(
  page: any,
  fonts: { bold: any; regular: any; italic: any },
  data: CertificateData,
  cfg: TemplateConfig
): Promise<void> {
  const { width, height } = page.getSize();
  const primary = rgb(...cfg.primaryColor);
  const secondary = rgb(...cfg.secondaryColor);
  const bg = rgb(...cfg.bgColor);
  const text = rgb(...cfg.textColor);
  const white = rgb(1, 1, 1);
  const lightGold = rgb(0.98, 0.94, 0.80);

  // Background
  page.drawRectangle({ x: 0, y: 0, width, height, color: bg });

  // Outer border — thick navy
  page.drawRectangle({
    x: 18, y: 18, width: width - 36, height: height - 36,
    borderColor: primary, borderWidth: 6, opacity: 1,
  });

  // Inner border — thin gold
  page.drawRectangle({
    x: 28, y: 28, width: width - 56, height: height - 56,
    borderColor: secondary, borderWidth: 2,
  });

  // Corner ornaments (4 sudut) — kotak kecil gold
  const cornerSize = 18;
  const cornerOffset = 22;
  for (const [cx, cy] of [
    [cornerOffset, cornerOffset],
    [width - cornerOffset - cornerSize, cornerOffset],
    [cornerOffset, height - cornerOffset - cornerSize],
    [width - cornerOffset - cornerSize, height - cornerOffset - cornerSize],
  ] as [number, number][]) {
    page.drawRectangle({ x: cx, y: cy, width: cornerSize, height: cornerSize, color: secondary });
    page.drawRectangle({ x: cx + 4, y: cy + 4, width: cornerSize - 8, height: cornerSize - 8, color: primary });
  }

  // Header ribbon — full width navy
  const ribbonH = 72;
  page.drawRectangle({ x: 36, y: height - 36 - ribbonH, width: width - 72, height: ribbonH, color: primary });
  // Gold line bawah ribbon
  page.drawRectangle({ x: 36, y: height - 36 - ribbonH, width: width - 72, height: 4, color: secondary });

  // Title text di dalam ribbon
  const titleClamped = clampText(cfg.titleText, fonts.bold, 30, width - 140);
  const titleW = fonts.bold.widthOfTextAtSize(titleClamped.text, titleClamped.size);
  page.drawText(titleClamped.text, {
    x: width / 2 - titleW / 2,
    y: height - 36 - ribbonH + 24,
    size: titleClamped.size,
    font: fonts.bold,
    color: secondary,
  });

  // Subtitle italic
  const subW = fonts.italic.widthOfTextAtSize(cfg.subtitleText, 13);
  page.drawText(cfg.subtitleText, {
    x: width / 2 - subW / 2,
    y: height - 36 - ribbonH - 28,
    size: 13,
    font: fonts.italic,
    color: primary,
  });

  // Garis pembatas halus di bawah subtitle
  page.drawRectangle({ x: width / 2 - 120, y: height - 36 - ribbonH - 38, width: 240, height: 1.5, color: secondary });

  // "Diberikan kepada:"
  const diW = fonts.regular.widthOfTextAtSize("Diberikan kepada:", 13);
  page.drawText("Diberikan kepada:", {
    x: width / 2 - diW / 2,
    y: height - 210,
    size: 13, font: fonts.regular, color: text,
  });

  // Kotak nama — rounded feel lewat berlapis
  const nameArea = height - 285;
  page.drawRectangle({ x: 100, y: nameArea, width: width - 200, height: 58, color: lightGold, borderColor: secondary, borderWidth: 2 });
  page.drawRectangle({ x: 104, y: nameArea + 4, width: width - 208, height: 50, color: rgb(1,1,1,), borderColor: primary, borderWidth: 1 });

  const nameClamped = clampText(data.studentName, fonts.bold, 34, width - 240);
  const nameW = fonts.bold.widthOfTextAtSize(nameClamped.text, nameClamped.size);
  page.drawText(nameClamped.text, {
    x: width / 2 - nameW / 2,
    y: nameArea + 14,
    size: nameClamped.size, font: fonts.bold, color: primary,
  });

  // Body teks
  const bodyLines = [
    "Telah berhasil menyelesaikan program pembelajaran",
  ];
  bodyLines.forEach((line, i) => {
    const lw = fonts.regular.widthOfTextAtSize(line, 13);
    page.drawText(line, { x: width / 2 - lw / 2, y: height - 305 - i * 20, size: 13, font: fonts.regular, color: text });
  });

  // Batch name — tebal
  const batchClamped = clampText(data.batchName, fonts.bold, 18, width - 200);
  const batchW = fonts.bold.widthOfTextAtSize(batchClamped.text, batchClamped.size);
  page.drawText(batchClamped.text, {
    x: width / 2 - batchW / 2,
    y: height - 340,
    size: batchClamped.size, font: fonts.bold, color: secondary,
  });

  // Tanggal
  const dateStr = `Jakarta, ${formatDate(data.claimedDate)}`;
  const dateW = fonts.italic.widthOfTextAtSize(dateStr, 11);
  page.drawText(dateStr, {
    x: width / 2 - dateW / 2,
    y: height - 370,
    size: 11, font: fonts.italic, color: rgb(0.4, 0.4, 0.4),
  });

  // ---- Signature boxes ----
  const sigY = 105;
  const sigW = 170;
  const sigH = 65;
  // Kiri
  page.drawRectangle({ x: 120, y: sigY, width: sigW, height: sigH, borderColor: primary, borderWidth: 1.5, color: rgb(1,1,1) });
  page.drawRectangle({ x: 120, y: sigY + sigH - 2, width: sigW, height: 2, color: secondary });
  const l1 = fonts.regular.widthOfTextAtSize("Kepala Bimbel", 10);
  page.drawText("Kepala Bimbel", { x: 120 + sigW / 2 - l1 / 2, y: sigY + sigH - 18, size: 10, font: fonts.regular, color: text });
  const l2 = fonts.italic.widthOfTextAtSize("( ________________________ )", 9);
  page.drawText("( ________________________ )", { x: 120 + sigW / 2 - l2 / 2, y: sigY + 18, size: 9, font: fonts.italic, color: rgb(0.5, 0.5, 0.5) });

  // Kanan
  page.drawRectangle({ x: width - 120 - sigW, y: sigY, width: sigW, height: sigH, borderColor: primary, borderWidth: 1.5, color: rgb(1,1,1) });
  page.drawRectangle({ x: width - 120 - sigW, y: sigY + sigH - 2, width: sigW, height: 2, color: secondary });
  const r1 = fonts.regular.widthOfTextAtSize("Pengajar", 10);
  page.drawText("Pengajar", { x: width - 120 - sigW + sigW / 2 - r1 / 2, y: sigY + sigH - 18, size: 10, font: fonts.regular, color: text });
  const r2 = fonts.italic.widthOfTextAtSize("( ________________________ )", 9);
  page.drawText("( ________________________ )", { x: width - 120 - sigW + sigW / 2 - r2 / 2, y: sigY + 18, size: 9, font: fonts.italic, color: rgb(0.5, 0.5, 0.5) });

  // ---- Footer bar ----
  page.drawRectangle({ x: 36, y: 36, width: width - 72, height: 28, color: primary });
  // Kode kiri
  page.drawText(`Kode: ${data.uniqueCode}`, { x: 50, y: 44, size: 9, font: fonts.bold, color: secondary });
  // Footer teks tengah
  const ftW = fonts.regular.widthOfTextAtSize(cfg.footerText, 9);
  page.drawText(cfg.footerText, { x: width / 2 - ftW / 2, y: 44, size: 9, font: fonts.regular, color: white });
  // Tanggal singkat kanan
  const shortDate = new Date(data.claimedDate || new Date()).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
  const sdW = fonts.regular.widthOfTextAtSize(shortDate, 9);
  page.drawText(shortDate, { x: width - 50 - sdW, y: 44, size: 9, font: fonts.regular, color: white });
}

// =============================================
// TEMPLATE 2 — CERIA KIDS
// Yellow + pink, bintang, border putus-putus, playful
// =============================================
async function renderKids(
  page: any,
  fonts: { bold: any; regular: any; italic: any },
  data: CertificateData,
  cfg: TemplateConfig
): Promise<void> {
  const { width, height } = page.getSize();
  const primary = rgb(...cfg.primaryColor);      // kuning
  const secondary = rgb(...cfg.secondaryColor);  // pink
  const bg = rgb(...cfg.bgColor);                // krem hangat
  const text = rgb(...cfg.textColor);
  const mint = rgb(0.24, 0.81, 0.66);
  const sky = rgb(0.31, 0.76, 0.97);
  const white = rgb(1, 1, 1);
  const purple = rgb(0.61, 0.37, 1.0);

  // Background
  page.drawRectangle({ x: 0, y: 0, width, height, color: bg });

  // Outer border — tebal hitam brutal
  page.drawRectangle({ x: 16, y: 16, width: width - 32, height: height - 32, borderColor: rgb(0.04, 0.04, 0.04), borderWidth: 5 });

  // Inner border — yellow putus-putus simulasi (3 garis tipis berjarak)
  for (let i = 0; i < 3; i++) {
    const off = 26 + i * 4;
    page.drawRectangle({ x: off, y: off, width: width - off * 2, height: height - off * 2, borderColor: i === 1 ? primary : secondary, borderWidth: i === 1 ? 2.5 : 1 });
  }

  // ---- HEADER AREA ----
  // Background blok kuning header
  page.drawRectangle({ x: 42, y: height - 42 - 80, width: width - 84, height: 80, color: primary, borderColor: rgb(0.04, 0.04, 0.04), borderWidth: 3 });
  // Hard shadow header
  page.drawRectangle({ x: 46, y: height - 46 - 80, width: width - 84, height: 80, color: rgb(0.04, 0.04, 0.04) });
  page.drawRectangle({ x: 42, y: height - 42 - 80, width: width - 84, height: 80, color: primary, borderColor: rgb(0.04, 0.04, 0.04), borderWidth: 3 });

  // Title teks
  const titleClamped = clampText(cfg.titleText, fonts.bold, 28, width - 160);
  const titleW = fonts.bold.widthOfTextAtSize(titleClamped.text, titleClamped.size);
  page.drawText(titleClamped.text, {
    x: width / 2 - titleW / 2, y: height - 42 - 80 + 34,
    size: titleClamped.size, font: fonts.bold, color: rgb(0.04, 0.04, 0.04),
  });

  // Bintang dekorasi di header (kiri dan kanan title)
  const starY = height - 42 - 80 + 36;
  page.drawText("★", { x: width / 2 - titleW / 2 - 30, y: starY, size: 20, font: fonts.bold, color: secondary });
  page.drawText("★", { x: width / 2 + titleW / 2 + 12, y: starY, size: 20, font: fonts.bold, color: secondary });

  // Subtitle — pink badge
  const subBadgeW = 280;
  const subBadgeX = width / 2 - subBadgeW / 2;
  const subBadgeY = height - 42 - 80 - 44;
  page.drawRectangle({ x: subBadgeX + 3, y: subBadgeY - 3, width: subBadgeW, height: 32, color: rgb(0.04, 0.04, 0.04) });
  page.drawRectangle({ x: subBadgeX, y: subBadgeY, width: subBadgeW, height: 32, color: secondary, borderColor: rgb(0.04, 0.04, 0.04), borderWidth: 2.5 });
  const subW = fonts.bold.widthOfTextAtSize(cfg.subtitleText, 13);
  page.drawText(cfg.subtitleText, { x: width / 2 - subW / 2, y: subBadgeY + 9, size: 13, font: fonts.bold, color: white });

  // "Diberikan kepada:"
  const diW = fonts.regular.widthOfTextAtSize("Diberikan kepada:", 12);
  page.drawText("Diberikan kepada:", { x: width / 2 - diW / 2, y: height - 210, size: 12, font: fonts.regular, color: text });

  // Kotak nama — mint dengan hard shadow brutal
  const nameBoxY = height - 285;
  const nameBoxW = width - 160;
  const nameBoxX = 80;
  const nameBoxH = 60;
  page.drawRectangle({ x: nameBoxX + 5, y: nameBoxY - 5, width: nameBoxW, height: nameBoxH, color: rgb(0.04, 0.04, 0.04) });
  page.drawRectangle({ x: nameBoxX, y: nameBoxY, width: nameBoxW, height: nameBoxH, color: mint, borderColor: rgb(0.04, 0.04, 0.04), borderWidth: 3 });

  const nameClamped = clampText(data.studentName, fonts.bold, 34, nameBoxW - 40);
  const nameW = fonts.bold.widthOfTextAtSize(nameClamped.text, nameClamped.size);
  page.drawText(nameClamped.text, {
    x: width / 2 - nameW / 2, y: nameBoxY + 14,
    size: nameClamped.size, font: fonts.bold, color: rgb(0.04, 0.04, 0.04),
  });

  // Body teks
  const body1 = "Atas semangat belajar dan keberhasilan menyelesaikan";
  const body1W = fonts.regular.widthOfTextAtSize(body1, 12);
  page.drawText(body1, { x: width / 2 - body1W / 2, y: height - 305, size: 12, font: fonts.regular, color: text });

  // Batch name — badge sky biru
  const batchBadgeY = height - 348;
  const batchClamped = clampText(data.batchName, fonts.bold, 17, width - 200);
  const batchBadgeW = fonts.bold.widthOfTextAtSize(batchClamped.text, batchClamped.size) + 48;
  const batchBadgeX = width / 2 - batchBadgeW / 2;
  page.drawRectangle({ x: batchBadgeX + 4, y: batchBadgeY - 4, width: batchBadgeW, height: 34, color: rgb(0.04, 0.04, 0.04) });
  page.drawRectangle({ x: batchBadgeX, y: batchBadgeY, width: batchBadgeW, height: 34, color: sky, borderColor: rgb(0.04, 0.04, 0.04), borderWidth: 2.5 });
  const batchW = fonts.bold.widthOfTextAtSize(batchClamped.text, batchClamped.size);
  page.drawText(batchClamped.text, {
    x: width / 2 - batchW / 2, y: batchBadgeY + 9,
    size: batchClamped.size, font: fonts.bold, color: rgb(0.04, 0.04, 0.04),
  });

  // Tanggal
  const dateStr = formatDate(data.claimedDate);
  const dateW = fonts.italic.widthOfTextAtSize(dateStr, 11);
  page.drawText(dateStr, { x: width / 2 - dateW / 2, y: height - 380, size: 11, font: fonts.italic, color: rgb(0.45, 0.45, 0.45) });

  // ---- Dekorasi sudut & tepi ----
  // Bintang 4 sudut
  const corners: [number, number, number, string][] = [
    [50, height - 80, 26, "★"],
    [width - 78, height - 80, 26, "★"],
    [50, 58, 22, "✦"],
    [width - 74, 58, 22, "✦"],
  ];
  const starColors = [secondary, primary, purple, mint];
  corners.forEach(([cx, cy, sz, ch], i) => {
    page.drawText(ch as string, { x: cx, y: cy, size: sz, font: fonts.bold, color: starColors[i] });
  });

  // Bintang kecil di tengah tepi kiri & kanan
  page.drawText("✦", { x: 38, y: height / 2, size: 18, font: fonts.bold, color: primary });
  page.drawText("✦", { x: width - 56, y: height / 2, size: 18, font: fonts.bold, color: secondary });

  // ---- Signature boxes ----
  const sigY = 108;
  const sigW = 165;
  const sigH = 60;

  // Kiri — mint
  page.drawRectangle({ x: 108, y: sigY - 4, width: sigW, height: sigH, color: rgb(0.04, 0.04, 0.04) });
  page.drawRectangle({ x: 104, y: sigY, width: sigW, height: sigH, color: white, borderColor: rgb(0.04, 0.04, 0.04), borderWidth: 2.5 });
  page.drawRectangle({ x: 104, y: sigY + sigH - 14, width: sigW, height: 14, color: mint });
  const l1 = fonts.bold.widthOfTextAtSize("Kepala Bimbel", 9);
  page.drawText("Kepala Bimbel", { x: 104 + sigW / 2 - l1 / 2, y: sigY + sigH - 11, size: 9, font: fonts.bold, color: rgb(0.04, 0.04, 0.04) });
  const l2 = fonts.italic.widthOfTextAtSize("( __________________ )", 9);
  page.drawText("( __________________ )", { x: 104 + sigW / 2 - l2 / 2, y: sigY + 14, size: 9, font: fonts.italic, color: rgb(0.6, 0.6, 0.6) });

  // Kanan — pink
  const rxBase = width - 104 - sigW;
  page.drawRectangle({ x: rxBase + 4, y: sigY - 4, width: sigW, height: sigH, color: rgb(0.04, 0.04, 0.04) });
  page.drawRectangle({ x: rxBase, y: sigY, width: sigW, height: sigH, color: white, borderColor: rgb(0.04, 0.04, 0.04), borderWidth: 2.5 });
  page.drawRectangle({ x: rxBase, y: sigY + sigH - 14, width: sigW, height: 14, color: secondary });
  const r1 = fonts.bold.widthOfTextAtSize("Pengajar", 9);
  page.drawText("Pengajar", { x: rxBase + sigW / 2 - r1 / 2, y: sigY + sigH - 11, size: 9, font: fonts.bold, color: white });
  const r2 = fonts.italic.widthOfTextAtSize("( __________________ )", 9);
  page.drawText("( __________________ )", { x: rxBase + sigW / 2 - r2 / 2, y: sigY + 14, size: 9, font: fonts.italic, color: rgb(0.6, 0.6, 0.6) });

  // ---- Footer bar — hitam ----
  page.drawRectangle({ x: 42, y: 42, width: width - 84, height: 30, color: rgb(0.04, 0.04, 0.04) });
  // Kode kiri — kuning
  page.drawText(`Kode: ${data.uniqueCode}`, { x: 56, y: 51, size: 9, font: fonts.bold, color: primary });
  // Footer teks tengah — putih
  const ftW = fonts.regular.widthOfTextAtSize(cfg.footerText, 9);
  page.drawText(cfg.footerText, { x: width / 2 - ftW / 2, y: 51, size: 9, font: fonts.regular, color: white });
  // Emoji bintang kanan
  const shortDate = new Date(data.claimedDate || new Date()).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
  const sdW = fonts.regular.widthOfTextAtSize(shortDate, 9);
  page.drawText(shortDate, { x: width - 56 - sdW, y: 51, size: 9, font: fonts.regular, color: white });
}

// =============================================
// MAIN EXPORT
// =============================================
export async function generateCertificatePDF(
  data: CertificateData
): Promise<Uint8Array> {

  // Jika ada background_image_url → pakai renderer custom upload
  if (data.backgroundImageUrl && data.textPositions && data.textPositions.length > 0) {
    return generateCustomImagePDF(data);
  }

  const cfg: TemplateConfig = data.templateConfig ?? DEFAULT_CONFIG;

  const pdfDoc = await PDFDocument.create();

  // A4 Landscape
  const page = pdfDoc.addPage([842, 595]);

  // Embed fonts (StandardFonts yang tersedia di pdf-lib)
  const boldFont    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const italicFont  = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const fonts = { bold: boldFont, regular: regularFont, italic: italicFont };

  // Dispatch ke renderer yang sesuai
  if (cfg.style === "kids") {
    await renderKids(page, fonts, data, cfg);
  } else {
    await renderClassic(page, fonts, data, cfg);
  }

  // ── Embed metadata untuk verifikasi upload ─────────────────────
  // Metadata ini dibaca saat user upload PDF ke halaman /verify
  embedCertificateMetadata(pdfDoc, data);

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

// =============================================
// Helper: embed metadata ke PDF properties
// =============================================
function embedCertificateMetadata(pdfDoc: PDFDocument, data: CertificateData): void {
  pdfDoc.setTitle(`Sertifikat - ${data.studentName}`);
  pdfDoc.setAuthor("SertifChain");
  // Subject sebagai primary storage — ini yang reliable dibaca kembali
  // Format: SERTIFCHAIN|KODE|NAMA|BATCH
  pdfDoc.setSubject(`SERTIFCHAIN|${data.uniqueCode}|${data.studentName}|${data.batchName}`);
  // Keywords sebagai fallback (tersimpan sebagai string spasi-separated)
  pdfDoc.setKeywords([
    "SertifChain",
    `UNIQUE_CODE:${data.uniqueCode}`,
    `STUDENT_NAME:${data.studentName}`,
    `BATCH_NAME:${data.batchName}`,
  ]);
  pdfDoc.setCreator("SertifChain v1.0");
  // Producer di-override oleh pdf-lib, jadi tidak diandalkan
}

// =============================================
// RENDERER: Custom Upload (background gambar)
// =============================================
async function generateCustomImagePDF(data: CertificateData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Tentukan ukuran halaman
  const isPortrait = data.pageOrientation === "portrait";
  const pageSize: [number, number] = isPortrait ? [595, 842] : [842, 595];
  const page = pdfDoc.addPage(pageSize);
  const { width, height } = page.getSize();

  // Pre-embed semua font yang mungkin dibutuhkan
  const fontCache: Partial<Record<FontFamily, any>> = {};
  const embedFont = async (family: FontFamily) => {
    if (!fontCache[family]) {
      fontCache[family] = await pdfDoc.embedFont(FONT_MAP[family] || StandardFonts.Helvetica);
    }
    return fontCache[family];
  };

  // Selalu embed default font sebagai fallback
  const defaultFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const defaultBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // ---- Download & embed background image ----
  try {
    const res = await fetch(data.backgroundImageUrl!);
    if (!res.ok) throw new Error("Gagal download gambar background");
    const imgBuffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/png";

    let bgImage;
    if (contentType.includes("jpeg") || contentType.includes("jpg")) {
      bgImage = await pdfDoc.embedJpg(imgBuffer);
    } else {
      bgImage = await pdfDoc.embedPng(imgBuffer);
    }
    page.drawImage(bgImage, { x: 0, y: 0, width, height });
  } catch (err) {
    console.error("Error embedding background image:", err);
    page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 1, 1) });
  }

  // ---- Overlay teks ----
  const positions = data.textPositions || [];

  const fieldValues: Record<string, string> = {
    name:  data.studentName,
    batch: data.batchName,
    code:  data.uniqueCode,
    date:  formatDate(data.claimedDate),
  };

  for (const pos of positions) {
    const value = fieldValues[pos.field];
    if (!value) continue;

    // Pilih font dari fontFamily, fallback ke fontWeight
    let font: any;
    if (pos.fontFamily && FONT_MAP[pos.fontFamily as FontFamily]) {
      font = await embedFont(pos.fontFamily as FontFamily);
    } else {
      font = pos.fontWeight === "bold" ? defaultBoldFont : defaultFont;
    }

    const fontSize = pos.fontSize || 24;
    const color = hexToRgb(pos.color || "#000000");

    // Hitung posisi absolut
    // x: % dari lebar → koordinat absolut titik referensi
    // y: % dari tinggi (0=bawah PDF, 100=atas) → koordinat absolut
    const refX = (pos.x / 100) * width;
    const refY = (pos.y / 100) * height;

    // Lebar teks aktual
    const textWidth = font.widthOfTextAtSize(value, fontSize);

    // Hitung drawX berdasarkan alignment
    // - left:   refX = titik kiri teks
    // - center: refX = titik tengah teks
    // - right:  refX = titik kanan teks
    let drawX: number;
    if (pos.align === "center") {
      drawX = refX - textWidth / 2;
    } else if (pos.align === "right") {
      drawX = refX - textWidth;
    } else {
      drawX = refX;
    }

    // Clamp agar tidak keluar batas halaman (padding 5px)
    drawX = Math.max(5, Math.min(drawX, width - textWidth - 5));

    page.drawText(value, {
      x: drawX,
      y: refY,
      size: fontSize,
      font,
      color,
    });
  }

  // Embed metadata untuk verifikasi upload
  embedCertificateMetadata(pdfDoc, data);

  return pdfDoc.save();
}

// =============================================
// Helper: hex color → pdf-lib RGB
// =============================================
function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return rgb(
    isNaN(r) ? 0 : r,
    isNaN(g) ? 0 : g,
    isNaN(b) ? 0 : b
  );
}
