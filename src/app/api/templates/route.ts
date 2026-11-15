import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

// GET — List all active templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();

    const { data: templates, error } = await supabase
      .from("certificate_templates")
      .select("*")
      .or(`admin_id.is.null,admin_id.eq.${session.user.id}`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("GET /api/templates error:", error);
      if (error.code === "42703") {
        return NextResponse.json(
          {
            error:
              "Database belum diperbarui. Jalankan migration 007_admin_data_ownership.sql di Supabase.",
          },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
    }

    return NextResponse.json({ templates });
  } catch (err) {
    console.error("GET /api/templates exception:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — Create new template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, config } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Nama template wajib diisi" }, { status: 400 });
    }

    // Validasi style
    const validStyles = ["classic", "kids", "custom"];
    if (config?.style && !validStyles.includes(config.style)) {
      return NextResponse.json({ error: "Style tidak valid" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: template, error } = await supabase
      .from("certificate_templates")
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        is_active: true,
        admin_id: session.user.id,
        config: config || {},
        background_image_url: body.background_image_url || null,
        text_positions: body.text_positions || [],
        page_orientation: body.page_orientation || "landscape",
      })
      .select()
      .single();

    if (error) {
      console.error("POST /api/templates error:", error);
      return NextResponse.json({ error: "Gagal membuat template" }, { status: 500 });
    }

    return NextResponse.json({ template }, { status: 201 });
  } catch (err) {
    console.error("POST /api/templates exception:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
