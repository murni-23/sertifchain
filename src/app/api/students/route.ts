import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { getOwnedBatchIds } from "@/lib/admin/ownership";

// GET - List students
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get("batch_id");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const supabase = createServiceClient();
    const ownedBatchIds = await getOwnedBatchIds(supabase, session.user.id);

    if (batchId && !ownedBatchIds.includes(batchId)) {
      return NextResponse.json({ error: "Batch tidak ditemukan" }, { status: 404 });
    }
    if (ownedBatchIds.length === 0) {
      return NextResponse.json({ students: [] });
    }

    let query = supabase
      .from("students")
      .select(
        `
        *,
        batches (
          id,
          name
        )
      `
      )
      .in("batch_id", ownedBatchIds)
      .order("created_at", { ascending: false });

    // Filter by batch
    if (batchId) {
      query = query.eq("batch_id", batchId);
    }

    // Filter by status
    if (status) {
      query = query.eq("status", status);
    }

    // Search by name
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data: students, error } = await query;

    if (error) {
      console.error("Error fetching students:", error);
      return NextResponse.json(
        { error: "Failed to fetch students" },
        { status: 500 }
      );
    }

    return NextResponse.json({ students });
  } catch (error) {
    console.error("GET /api/students error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create single student
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, batch_id, unique_code } = body;

    if (!name || !batch_id) {
      return NextResponse.json(
        { error: "Name and batch_id are required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const ownedBatchIds = await getOwnedBatchIds(supabase, session.user.id);
    if (!ownedBatchIds.includes(batch_id)) {
      return NextResponse.json({ error: "Batch tidak ditemukan" }, { status: 404 });
    }

    // Generate unique code if not provided
    const code = unique_code || generateUniqueCode();

    const { data: student, error } = await supabase
      .from("students")
      .insert({
        name: name.trim(),
        batch_id,
        unique_code: code,
        status: "unclaimed",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating student:", error);
      return NextResponse.json(
        { error: "Failed to create student" },
        { status: 500 }
      );
    }

    // Update batch total_students count
    const { error: countError } = await supabase.rpc("increment_batch_students", { batch_id });
    if (countError) {
      console.error("Error updating batch student count:", countError);
    }

    return NextResponse.json({ student }, { status: 201 });
  } catch (error) {
    console.error("POST /api/students error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to generate unique code
function generateUniqueCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude confusing chars
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
