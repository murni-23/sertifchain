import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

/**
 * POST /api/templates/upload
 * Upload gambar background sertifikat ke Supabase Storage.
 * Menerima multipart/form-data dengan field "file".
 * Returns: { url: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    // Validasi tipe file
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Format file tidak didukung. Gunakan PNG, JPG, atau WebP." },
        { status: 400 }
      );
    }

    // Validasi ukuran
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Ukuran file maksimal 10MB" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Generate nama file unik
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    const fileName = `template-${timestamp}-${randomId}.${ext}`;
    const filePath = `admins/${session.user.id}/backgrounds/${fileName}`;

    // Convert File ke ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload ke Supabase Storage bucket "templates"
    const { data, error } = await supabase.storage
      .from("templates")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return NextResponse.json(
        { error: "Gagal mengupload gambar: " + error.message },
        { status: 500 }
      );
    }

    // Ambil public URL
    const { data: urlData } = supabase.storage
      .from("templates")
      .getPublicUrl(filePath);

    return NextResponse.json({
      url: urlData.publicUrl,
      path: filePath,
    });
  } catch (err) {
    console.error("POST /api/templates/upload error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat upload" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/templates/upload
 * Hapus gambar dari Supabase Storage (saat template dihapus).
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { path } = await request.json();
    if (
      typeof path !== "string" ||
      !path.startsWith(`admins/${session.user.id}/backgrounds/`)
    ) {
      return NextResponse.json({ error: "Path tidak ditemukan" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase.storage.from("templates").remove([path]);

    if (error) {
      return NextResponse.json({ error: "Gagal menghapus file" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
