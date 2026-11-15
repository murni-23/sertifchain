import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export const dynamic = "force-dynamic";

/**
 * POST /api/verify/pdf/debug
 * Debug endpoint — tampilkan semua metadata yang ada di PDF
 * Hapus endpoint ini setelah debugging selesai
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  const producer = pdfDoc.getProducer()  || "(empty)";
  const keywords = pdfDoc.getKeywords()  || "(empty)";
  const subject  = pdfDoc.getSubject()   || "(empty)";
  const title    = pdfDoc.getTitle()     || "(empty)";
  const creator  = pdfDoc.getCreator()   || "(empty)";
  const author   = pdfDoc.getAuthor()    || "(empty)";

  return NextResponse.json({
    producer,
    keywords,
    subject,
    title,
    creator,
    author,
    pageCount: pdfDoc.getPageCount(),
    isSertifChain:
      creator.includes("SertifChain") ||
      producer.startsWith("SertifChain|") ||
      keywords.includes("SertifChain"),
  });
}
