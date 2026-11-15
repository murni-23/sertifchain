import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

// GET - List all batches
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();

    const { data: batches, error } = await supabase
      .from("batches")
      .select(
        `
        *,
        certificate_templates (
          id,
          name
        )
      `
      )
      .eq("admin_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching batches:", error);
      return NextResponse.json(
        { error: "Failed to fetch batches" },
        { status: 500 }
      );
    }

    return NextResponse.json({ batches });
  } catch (error) {
    console.error("GET /api/batches error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new batch
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, template_id } = body;

    // Validation
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Nama batch wajib diisi" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Get admin ID from session
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

    // Create batch
    const { data: batch, error } = await supabase
      .from("batches")
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        template_id: template_id || null,
        admin_id: session.user.id,
        total_students: 0,
        claimed_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating batch:", error);
      return NextResponse.json(
        { error: "Failed to create batch" },
        { status: 500 }
      );
    }

    return NextResponse.json({ batch }, { status: 201 });
  } catch (error) {
    console.error("POST /api/batches error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
