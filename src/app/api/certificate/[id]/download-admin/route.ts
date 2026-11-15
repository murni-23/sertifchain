import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { getOwnedBatchIds } from "@/lib/admin/ownership";
import { generateCertificatePDF, TemplateConfig } from "@/lib/pdf/generateCertificate";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();
    const ownedBatchIds = await getOwnedBatchIds(supabase, session.user.id);

    const { data: student, error } = await supabase
      .from("students")
      .select(`
        id, name, unique_code, status, claimed_at,
        batches (
          id,
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

    if (error || !student || !ownedBatchIds.includes((student as any).batches?.id)) {
      return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 });
    }

    const s    = student as any;
    const tmpl = s.batches?.certificate_templates ?? null;
    const templateConfig: TemplateConfig | null = tmpl?.config ?? null;

    const pdfUint8 = await generateCertificatePDF({
      studentName:        s.name,
      batchName:          s.batches?.name || "Batch",
      uniqueCode:         s.unique_code,
      claimedDate:        s.claimed_at || new Date().toISOString(),
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
    console.error("GET /api/certificate/[id]/download-admin error:", err);
    return NextResponse.json({ error: "Gagal generate sertifikat" }, { status: 500 });
  }
}
