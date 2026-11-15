import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// POST - Search for certificate by name and unique code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, unique_code } = body;

    // Validation
    if (!name || !unique_code) {
      return NextResponse.json(
        { error: "Nama dan kode unik wajib diisi" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Search for student with matching name and code
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
      .eq("unique_code", unique_code.trim().toUpperCase())
      .ilike("name", name.trim())
      .single();

    if (error || !student) {
      return NextResponse.json(
        { error: "Sertifikat tidak ditemukan. Periksa kembali nama dan kode unik Anda." },
        { status: 404 }
      );
    }

    // Return student data (without claiming yet)
    return NextResponse.json({ student });
  } catch (error) {
    console.error("POST /api/claim error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
