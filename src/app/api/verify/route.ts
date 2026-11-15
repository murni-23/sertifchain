import { NextRequest, NextResponse } from "next/server";
import { verifyCertificateByCode } from "@/lib/certificate/verify";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
};

export async function GET(request: NextRequest) {
  try {
    const code = new URL(request.url).searchParams.get("code")?.trim().toUpperCase();

    if (!code) {
      return NextResponse.json(
        { error: "Kode unik wajib diisi" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const verification = await verifyCertificateByCode(code);
    if (!verification) {
      return NextResponse.json(
        { error: "Sertifikat tidak ditemukan di database maupun blockchain" },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    return NextResponse.json(verification, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("GET /api/verify error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memverifikasi sertifikat" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
