import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (name.length < 2 || name.length > 80) {
      return NextResponse.json(
        { error: "Nama harus terdiri dari 2 sampai 80 karakter." },
        { status: 400 }
      );
    }

    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        { error: "Format email tidak valid." },
        { status: 400 }
      );
    }

    if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
      return NextResponse.json(
        { error: "Password harus 8 sampai 72 byte." },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const passwordHash = await bcrypt.hash(password, 12);
    const { data: admin, error } = await supabase
      .from("admins")
      .insert({ name, email, password_hash: passwordHash })
      .select("id, name, email")
      .single();

    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "Email sudah terdaftar." },
        { status: 409 }
      );
    }

    if (error || !admin) {
      console.error("Admin registration failed:", error);
      return NextResponse.json(
        { error: "Pendaftaran gagal. Silakan coba lagi." },
        { status: 500 }
      );
    }

    return NextResponse.json({ admin }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/register failed:", error);
    return NextResponse.json(
      { error: "Pendaftaran gagal. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
