import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { generateCertificatePDF, TemplateConfig } from "@/lib/pdf/generateCertificate";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient();

    const { data: student, error } = await supabase
      .from("students")
      .select(`
        id, name, unique_code, status, claimed_at,
        batches (
          name,
          template_id,
          certificate_templates (
            id, name, config,
            background_image_url,
            text_positions,
            page_orientation
          )
        )
      `)
      .eq("id", params.id)
      .single();

    if (error || !student) {
      return NextResponse.json({ error: "Sertifikat tidak ditemukan" }, { status: 404 });
    }

    const s = student as any;

    if (s.status !== "claimed") {
      return NextResponse.json({ error: "Sertifikat belum diklaim" }, { status: 400 });
    }

    const tmpl          = s.batches?.certificate_templates ?? null;
    const templateConfig: TemplateConfig | null = tmpl?.config ?? null;

    // Generate PDF
    const pdfUint8 = await generateCertificatePDF({
      studentName:        s.name,
      batchName:          s.batches?.name || "Batch",
      uniqueCode:         s.unique_code,
      claimedDate:        s.claimed_at,
      templateConfig,
      backgroundImageUrl: tmpl?.background_image_url ?? null,
      textPositions:      tmpl?.text_positions ?? null,
      pageOrientation:    tmpl?.page_orientation ?? "landscape",
    });

    const safeName = s.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .trim();

    return new NextResponse(pdfUint8 as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="Sertifikat-${safeName}-${s.unique_code}.pdf"`,
        "Content-Length":      pdfUint8.length.toString(),
      },
    });
  } catch (err) {
    console.error("GET /api/certificate/[id]/download error:", err);
    return NextResponse.json({ error: "Gagal generate sertifikat" }, { status: 500 });
  }
}
