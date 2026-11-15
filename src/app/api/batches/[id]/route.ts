import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

// GET - Get single batch
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

    const { data: batch, error } = await supabase
      .from("batches")
      .select(
        `
        *,
        certificate_templates (
          id,
          name,
          thumbnail_url
        )
      `
      )
      .eq("id", params.id)
      .eq("admin_id", session.user.id)
      .single();

    if (error) {
      console.error("Error fetching batch:", error);
      return NextResponse.json(
        { error: "Batch not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ batch });
  } catch (error) {
    console.error("GET /api/batches/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update batch
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, template_id } = body;

    const supabase = createServiceClient();

    const updateData: any = {};

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (template_id !== undefined) updateData.template_id = template_id;

    if (template_id) {
      const { data: template, error: templateError } = await supabase
        .from("certificate_templates")
        .select("id")
        .eq("id", template_id)
        .or(`admin_id.is.null,admin_id.eq.${session.user.id}`)
        .maybeSingle();

      if (templateError) {
        console.error("Error validating batch template:", templateError);
        return NextResponse.json({ error: "Gagal memvalidasi template" }, { status: 500 });
      }
      if (!template) {
        return NextResponse.json({ error: "Template tidak ditemukan" }, { status: 404 });
      }
    }

    const { data: batch, error } = await supabase
      .from("batches")
      .update(updateData)
      .eq("id", params.id)
      .eq("admin_id", session.user.id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Batch tidak ditemukan" }, { status: 404 });
      }
      console.error("Error updating batch:", error);
      return NextResponse.json(
        { error: "Failed to update batch" },
        { status: 500 }
      );
    }

    return NextResponse.json({ batch });
  } catch (error) {
    console.error("PATCH /api/batches/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete batch beserta semua siswa di dalamnya (CASCADE)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();

    const { data: batch, error: batchError } = await supabase
      .from("batches")
      .select("id")
      .eq("id", params.id)
      .eq("admin_id", session.user.id)
      .maybeSingle();

    if (batchError) {
      console.error("Error checking batch ownership:", batchError);
      return NextResponse.json({ error: "Gagal memeriksa batch" }, { status: 500 });
    }
    if (!batch) {
      return NextResponse.json({ error: "Batch tidak ditemukan" }, { status: 404 });
    }

    // Ambil jumlah siswa untuk info di response
    const { count: studentCount } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("batch_id", params.id);

    // Hapus batch — siswa otomatis terhapus via ON DELETE CASCADE
    const { error } = await supabase
      .from("batches")
      .delete()
      .eq("id", params.id)
      .eq("admin_id", session.user.id);

    if (error) {
      console.error("Error deleting batch:", error);
      return NextResponse.json(
        { error: "Gagal menghapus batch" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Batch berhasil dihapus",
      deleted_students: studentCount || 0,
    });
  } catch (error) {
    console.error("DELETE /api/batches/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
