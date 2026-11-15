import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/certificate/[id]
 * Public endpoint — tidak butuh auth admin.
 * Digunakan halaman /claim/[id] untuk fetch data sertifikat user.
 * Includes template data (background_image_url, text_positions) untuk preview.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient();

    const { data: student, error } = await supabase
      .from("students")
      .select(
        `
        id,
        name,
        unique_code,
        status,
        claimed_at,
        batches (
          name,
          description,
          certificate_templates (
            id,
            name,
            config,
            background_image_url,
            text_positions,
            page_orientation
          )
        )
      `
      )
      .eq("id", params.id)
      .single();

    if (error || !student) {
      return NextResponse.json(
        { error: "Sertifikat tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ student });
  } catch (err) {
    console.error("GET /api/certificate/[id] error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
