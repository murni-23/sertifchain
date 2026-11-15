import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { getOwnedBatchIds } from "@/lib/admin/ownership";
import { nanoid } from "nanoid";

// POST - Bulk create students from CSV/Excel
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { students, batch_id } = body;

    // Validation
    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        { error: "Students array is required" },
        { status: 400 }
      );
    }

    if (!batch_id) {
      return NextResponse.json(
        { error: "batch_id is required" },
        { status: 400 }
      );
    }

    if (students.length > 1000) {
      return NextResponse.json(
        { error: "Maximum 1000 students per upload" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const ownedBatchIds = await getOwnedBatchIds(supabase, session.user.id);

    // Verify batch exists
    const { data: batch, error: batchError } = await supabase
      .from("batches")
      .select("id")
      .eq("id", batch_id)
      .eq("admin_id", session.user.id)
      .single();

    if (batchError || !batch || !ownedBatchIds.includes(batch_id)) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    // Prepare student records with unique codes
    const studentRecords = students.map((student: any) => {
      const name = student.name || student.nama;
      
      if (!name || typeof name !== "string" || name.trim() === "") {
        throw new Error("Invalid student name");
      }

      return {
        name: name.trim(),
        batch_id,
        unique_code: generateUniqueCode(),
        status: "unclaimed" as const,
      };
    });

    // Insert students in batches to avoid timeout
    const batchSize = 100;
    const insertedStudents: any[] = [];
    const errors: any[] = [];

    for (let i = 0; i < studentRecords.length; i += batchSize) {
      const chunk = studentRecords.slice(i, i + batchSize);

      const { data, error } = await supabase
        .from("students")
        .insert(chunk as any)
        .select();

      if (error) {
        console.error("Error inserting batch:", error);
        errors.push({ chunk: i / batchSize, error: error.message } as any);
      } else if (data) {
        insertedStudents.push(...(data as any[]));
      }
    }

    // Update batch total_students count
    const { error: updateError } = await supabase
      .from("batches")
      .update({ total_students: insertedStudents.length })
      .eq("id", batch_id)
      .eq("admin_id", session.user.id);

    if (updateError) {
      console.error("Error updating batch count:", updateError);
    }

    return NextResponse.json(
      {
        success: true,
        total: studentRecords.length,
        inserted: insertedStudents.length,
        students: insertedStudents,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/students/bulk error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to generate unique code
function generateUniqueCode(): string {
  return nanoid(8).toUpperCase();
}
