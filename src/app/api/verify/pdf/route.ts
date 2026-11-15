import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { verifyCertificateByCode } from "@/lib/certificate/verify";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

/**
 * POST /api/verify/pdf
 * Terima upload file PDF → baca metadata → verifikasi ke database + blockchain
 * Public endpoint — tidak butuh auth
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File PDF tidak ditemukan" }, { status: 400 });
    }

    // Validasi tipe file
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "File harus berformat PDF" },
        { status: 400 }
      );
    }

    // Validasi ukuran
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Ukuran file maksimal 20MB" },
        { status: 400 }
      );
    }

    // Baca file sebagai ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Parse PDF dengan pdf-lib
    let pdfDoc: PDFDocument;
    try {
      pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    } catch (parseErr) {
      return NextResponse.json(
        { error: "File PDF tidak valid atau rusak" },
        { status: 400 }
      );
    }

    // ── Baca metadata ─────────────────────────────────────────────
    const producer  = pdfDoc.getProducer()  || "";
    const keywords  = pdfDoc.getKeywords()  || "";
    const subject   = pdfDoc.getSubject()   || "";
    const title     = pdfDoc.getTitle()     || "";
    const creator   = pdfDoc.getCreator()   || "";

    // Debug log untuk diagnosa
    console.log("[verify/pdf] metadata:", { producer, keywords: keywords.slice(0, 80), subject, creator });

    // Cek apakah ini PDF dari SertifChain
    // creator = "SertifChain v1.0" (reliable)
    // subject = "SERTIFCHAIN|KODE|NAMA|BATCH" (primary)
    // keywords berisi "SertifChain" (fallback)
    const isSertifChain =
      creator.includes("SertifChain") ||
      subject.startsWith("SERTIFCHAIN|") ||
      keywords.includes("SertifChain");

    if (!isSertifChain) {
      return NextResponse.json({
        valid:  false,
        source: "unknown",
        error:  "File ini bukan sertifikat SertifChain yang valid",
        debug:  { producer, keywords: keywords.slice(0, 100), subject, creator },
      }, { status: 200 });
    }

    // ── Ekstrak uniqueCode dari metadata ─────────────────────────
    let uniqueCode  = "";
    let studentName = "";
    let batchName   = "";

    // Metode 1: dari Subject (format: SERTIFCHAIN|KODE|NAMA|BATCH) — PALING RELIABLE
    if (subject.startsWith("SERTIFCHAIN|")) {
      const parts = subject.split("|");
      uniqueCode  = parts[1]?.trim() || "";
      studentName = parts[2]?.trim() || "";
      batchName   = parts[3]?.trim() || "";
    }

    // Metode 2: dari Keywords (spasi-separated, bukan koma)
    if (!uniqueCode && keywords) {
      // keywords tersimpan sebagai "SertifChain UNIQUE_CODE:ABC STUDENT_NAME:Budi BATCH_NAME:X"
      const kwList = keywords.split(" ").map((k: string) => k.trim());
      for (const kw of kwList) {
        if (kw.startsWith("UNIQUE_CODE:"))  uniqueCode  = kw.replace("UNIQUE_CODE:", "").trim();
        if (kw.startsWith("STUDENT_NAME:")) studentName = kw.replace("STUDENT_NAME:", "").trim();
        if (kw.startsWith("BATCH_NAME:"))   batchName   = kw.replace("BATCH_NAME:", "").trim();
      }
    }

    // Metode 3: dari Subject format lama (fallback)
    if (!uniqueCode && subject.includes("Kode:")) {
      const match = subject.match(/Kode:\s*([A-Z0-9]+)/);
      if (match) uniqueCode = match[1];
    }

    console.log("[verify/pdf] extracted:", { uniqueCode, studentName, batchName });

    if (!uniqueCode) {
      return NextResponse.json({
        valid:  false,
        source: "sertifchain",
        error:  "Kode unik tidak ditemukan dalam metadata PDF. Kemungkinan PDF sudah dimodifikasi.",
        debug:  { producer, subject },
      }, { status: 200 });
    }

    const verification = await verifyCertificateByCode(uniqueCode);
    if (!verification) {
      return NextResponse.json({
        valid:      false,
        source:     "sertifchain",
        uniqueCode,
        error:      "Kode unik dari PDF tidak ditemukan di database maupun blockchain.",
      }, { status: 200 });
    }

    const nameMatch =
      !studentName ||
      studentName.trim().toLowerCase() ===
        (verification.student?.name || "").trim().toLowerCase();
    const batchMatch =
      !batchName ||
      batchName.trim().toLowerCase() ===
        (verification.student?.batchName || "").trim().toLowerCase();

    return NextResponse.json({
      ...verification,
      valid: verification.valid && nameMatch && batchMatch,
      source:      "sertifchain",
      nameMatch,
      batchMatch,
      pdfMetadata: { uniqueCode, studentName, batchName },
    });
  } catch (err) {
    console.error("POST /api/verify/pdf error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
