import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { getOwnedBatchIds } from "@/lib/admin/ownership";

// GET - Get single student
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
    if (ownedBatchIds.length === 0) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const { data: student, error } = await supabase
      .from("students")
      .select(
        `
        *,
        batches (
          id,
          name,
          description
        )
      `
      )
      .eq("id", params.id)
      .in("batch_id", ownedBatchIds)
      .single();

    if (error) {
      console.error("Error fetching student:", error);
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ student });
  } catch (error) {
    console.error("GET /api/students/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update student
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
    const { name, unique_code, status } = body;

    const supabase = createServiceClient();
    const ownedBatchIds = await getOwnedBatchIds(supabase, session.user.id);
    if (ownedBatchIds.length === 0) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const updateData: any = {};

    if (name !== undefined) updateData.name = name.trim();
    if (unique_code !== undefined) updateData.unique_code = unique_code;
    if (status !== undefined) updateData.status = status;

    const { data: student, error } = await supabase
      .from("students")
      .update(updateData)
      .eq("id", params.id)
      .in("batch_id", ownedBatchIds)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Student not found" }, { status: 404 });
      }
      console.error("Error updating student:", error);
      return NextResponse.json(
        { error: "Failed to update student" },
        { status: 500 }
      );
    }

    return NextResponse.json({ student });
  } catch (error) {
    console.error("PATCH /api/students/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete student
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
    const ownedBatchIds = await getOwnedBatchIds(supabase, session.user.id);
    if (ownedBatchIds.length === 0) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get student to get batch_id
    const { data: student } = await supabase
      .from("students")
      .select("batch_id")
      .eq("id", params.id)
      .in("batch_id", ownedBatchIds)
      .single();

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("students")
      .delete()
      .eq("id", params.id)
      .in("batch_id", ownedBatchIds);

    if (error) {
      console.error("Error deleting student:", error);
      return NextResponse.json(
        { error: "Failed to delete student" },
        { status: 500 }
      );
    }

    // Update batch count
    if (student?.batch_id) {
      const { count } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("batch_id", student.batch_id);

      await supabase
        .from("batches")
        .update({ total_students: count || 0 })
        .eq("id", student.batch_id)
        .eq("admin_id", session.user.id);
    }

    return NextResponse.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/students/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
