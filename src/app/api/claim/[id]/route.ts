import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  issueCertificateOnChain,
  isBlockchainEnabled,
} from "@/lib/blockchain/contract";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient();

    // 1. Fetch student
    const { data: studentRaw, error: fetchError } = await supabase
      .from("students")
      .select("id, name, unique_code, status, claimed_at, batches(name)")
      .eq("id", params.id)
      .single();

    if (fetchError || !studentRaw) {
      return NextResponse.json({ error: "Sertifikat tidak ditemukan" }, { status: 404 });
    }

    const student = studentRaw as any;

    // 2. Cek sudah diklaim
    if (student.status === "claimed") {
      return NextResponse.json(
        { error: "Sertifikat sudah pernah diklaim", student },
        { status: 400 }
      );
    }

    // 3. IP
    const forwarded = request.headers.get("x-forwarded-for");
    const ip        = forwarded ? forwarded.split(",")[0] : "unknown";
    const claimedAt = new Date();

    // 4. Update status di database
    const { data: updatedRaw, error: updateError } = await supabase
      .from("students")
      .update({
        status:     "claimed",
        claimed_at: claimedAt.toISOString(),
        claimed_ip: ip,
      })
      .eq("id", params.id)
      .select("id, name, unique_code, status, claimed_at, batches(name)")
      .single();

    if (updateError || !updatedRaw) {
      console.error("Error claiming certificate:", updateError);
      return NextResponse.json({ error: "Gagal mengklaim sertifikat" }, { status: 500 });
    }

    const updatedStudent = updatedRaw as any;

    // 5. Issue ke blockchain (async background)
    if (isBlockchainEnabled()) {
      const batchName = updatedStudent.batches?.name || "Batch";

      issueCertificateOnChain(
        updatedStudent.name,
        updatedStudent.unique_code,
        batchName,
        claimedAt
      )
        .then(async ({ txHash, explorerUrl }) => {
          await supabase
            .from("students")
            .update({ tx_hash: txHash } as any)
            .eq("id", params.id);
          console.log(`✅ Blockchain issued: ${explorerUrl}`);
        })
        .catch((err) => {
          console.error("⚠️ Blockchain issue failed (non-critical):", err.message);
        });
    }

    return NextResponse.json({ success: true, student: updatedStudent });
  } catch (error) {
    console.error("POST /api/claim/[id] error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan. Silakan coba lagi." }, { status: 500 });
  }
}
