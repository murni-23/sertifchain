import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { generateCertificatePDF, TemplateConfig } from "@/lib/pdf/generateCertificate";
import JSZip from "jszip";

const MAX_PER_REQUEST = 200;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") || "all";

    const supabase = createServiceClient();

    // 1. Fetch batch + template
    const { data: batchRaw, error: batchError } = await supabase
      .from("batches")
      .select(`id, name, certificate_templates (id, name, config, background_image_url, text_positions, page_orientation)`)
      .eq("id", params.id)
      .eq("admin_id", session.user.id)
      .single();

    if (batchError || !batchRaw) {
      return NextResponse.json({ error: "Batch tidak ditemukan" }, { status: 404 });
    }

    const batch = batchRaw as any;

    // 2. Fetch students
    let studentsQuery = supabase
      .from("students")
      .select("id, name, unique_code, status, claimed_at")
      .eq("batch_id", params.id)
      .order("name", { ascending: true })
      .limit(MAX_PER_REQUEST);

    if (statusFilter === "claimed")   studentsQuery = studentsQuery.eq("status", "claimed");
    if (statusFilter === "unclaimed") studentsQuery = studentsQuery.neq("status", "claimed");

    const { data: studentsRaw, error: studentsError } = await studentsQuery;

    if (studentsError) {
      return NextResponse.json({ error: "Gagal memuat data siswa" }, { status: 500 });
    }

    const students = (studentsRaw || []) as any[];

    if (students.length === 0) {
      return NextResponse.json({ error: "Tidak ada siswa yang sesuai filter" }, { status: 404 });
    }

    // 3. Template config
    const tmpl          = batch.certificate_templates ?? null;
    const templateConfig: TemplateConfig | null = tmpl?.config ?? null;
    const backgroundImageUrl: string | null     = tmpl?.background_image_url ?? null;
    const textPositions: any[] | null           = tmpl?.text_positions ?? null;
    const pageOrientation: string | null        = tmpl?.page_orientation ?? "landscape";

    // 4. Generate semua PDF → ZIP
    const zip        = new JSZip();
    const errors:    string[] = [];
    const folderName = (batch.name || "Batch").replace(/[^a-zA-Z0-9\s\-_]/g, "").trim();
    const folder     = zip.folder(folderName)!;

    await Promise.allSettled(
      students.map(async (student: any) => {
        try {
          const pdfUint8 = await generateCertificatePDF({
            studentName:        student.name,
            batchName:          batch.name,
            uniqueCode:         student.unique_code,
            claimedDate:        student.claimed_at,
            templateConfig,
            backgroundImageUrl,
            textPositions,
            pageOrientation: pageOrientation as "landscape" | "portrait",
          });

          const safeName = student.name
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9\s]/g, "")
            .replace(/\s+/g, "-")
            .trim();

          folder.file(`${safeName}-${student.unique_code}.pdf`, pdfUint8);
        } catch (err) {
          console.error(`Error generating PDF for ${student.name}:`, err);
          errors.push(student.name);
        }
      })
    );

    // 5. Buat ZIP
    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    const safeFolder   = folderName.replace(/\s+/g, "-");
    const filterSuffix = statusFilter === "all" ? "" : `-${statusFilter}`;
    const zipFilename  = `Sertifikat-${safeFolder}${filterSuffix}.zip`;

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":        "application/zip",
        "Content-Disposition": `attachment; filename="${zipFilename}"`,
        "X-Total-Students":    students.length.toString(),
        "X-Errors":            errors.length.toString(),
      },
    });
  } catch (err) {
    console.error("GET /api/batches/[id]/download error:", err);
    return NextResponse.json({ error: "Gagal generate sertifikat massal" }, { status: 500 });
  }
}
