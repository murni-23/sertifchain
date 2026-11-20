import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

// GET — Single template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServiceClient();
    const { data: template, error } = await supabase
      .from("certificate_templates")
      .select("*")
      .eq("id", params.id)
      .or(`admin_id.is.null,admin_id.eq.${session.user.id}`)
      .single();

    if (error || !template) {
      return NextResponse.json({ error: "Template tidak ditemukan" }, { status: 404 });
    }

    const { data: previewBatch, error: previewBatchError } = await supabase
      .from("batches")
      .select("name")
      .eq("template_id", params.id)
      .eq("admin_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (previewBatchError) {
      console.error("GET /api/templates/[id] preview batch error:", previewBatchError);
      return NextResponse.json({ error: "Gagal memuat contoh batch untuk preview" }, { status: 500 });
    }

    return NextResponse.json({ template, previewBatchName: previewBatch?.name || null });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH — Update template
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const {
      name,
      description,
      config,
      is_active,
      background_image_url,
      text_positions,
      page_orientation,
    } = body;

    const supabase = createServiceClient();

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (config !== undefined) updateData.config = config;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (background_image_url !== undefined) updateData.background_image_url = background_image_url;
    if (text_positions !== undefined) updateData.text_positions = text_positions;
    if (page_orientation !== undefined) updateData.page_orientation = page_orientation;

    const { data: template, error } = await supabase
      .from("certificate_templates")
      .update(updateData)
      .eq("id", params.id)
      .eq("admin_id", session.user.id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Template tidak ditemukan" }, { status: 404 });
      }
      return NextResponse.json({ error: "Gagal update template" }, { status: 500 });
    }
    if (!template) {
      return NextResponse.json({ error: "Template tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — Hapus template (hanya jika tidak dipakai batch)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServiceClient();

    // Cek apakah template sedang digunakan batch
    const { count } = await supabase
      .from("batches")
      .select("*", { count: "exact", head: true })
      .eq("template_id", params.id)
      .eq("admin_id", session.user.id);

    if (count && count > 0) {
      return NextResponse.json(
        { error: `Template digunakan oleh ${count} batch. Hapus atau ganti template batch terlebih dahulu.` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("certificate_templates")
      .delete()
      .eq("id", params.id)
      .eq("admin_id", session.user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "Gagal menghapus template" }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Template tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ message: "Template berhasil dihapus" });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
