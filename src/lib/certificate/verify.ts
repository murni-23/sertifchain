import {
  isBlockchainReadEnabled,
  verifyCertificateOnChain,
} from "@/lib/blockchain/contract";
import { createServiceClient } from "@/lib/supabase/server";

type BlockchainStatus =
  | "valid"
  | "revoked"
  | "not_found"
  | "not_configured"
  | "unavailable";

interface StudentRecord {
  name: string;
  unique_code: string;
  status: string;
  claimed_at: string | null;
  tx_hash: string | null;
  batches: { name: string; description?: string } | null;
}

export interface CertificateVerification {
  valid: boolean;
  databaseFound: boolean;
  claimed: boolean;
  matchesDatabase: boolean | null;
  student: {
    name: string;
    uniqueCode: string;
    batchName: string;
    status: string;
    claimedAt: string | null;
  } | null;
  blockchain: {
    status: BlockchainStatus;
    verified: boolean;
    certHash: string | null;
    issuedAt: string | null;
    studentName: string | null;
    batchName: string | null;
    explorerUrl: string | null;
  };
}

export async function verifyCertificateByCode(
  uniqueCode: string
): Promise<CertificateVerification | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("students")
    .select("name, unique_code, status, claimed_at, tx_hash, batches(name, description)")
    .eq("unique_code", uniqueCode)
    .maybeSingle();

  if (error) {
    throw new Error(`Gagal membaca data sertifikat: ${error.message}`);
  }

  const record = data as StudentRecord | null;
  let blockchain: CertificateVerification["blockchain"] = {
    status: "not_configured",
    verified: false,
    certHash: null,
    issuedAt: null,
    studentName: null,
    batchName: null,
    explorerUrl: null,
  };

  if (isBlockchainReadEnabled()) {
    try {
      const onChain = await verifyCertificateOnChain(uniqueCode);
      const registered = onChain.certHash !== `0x${"0".repeat(64)}`;
      const status: BlockchainStatus = registered
        ? onChain.isValid
          ? "valid"
          : "revoked"
        : "not_found";

      blockchain = {
        status,
        verified: status === "valid",
        certHash: registered ? onChain.certHash : null,
        issuedAt: registered ? onChain.issuedAt.toISOString() : null,
        studentName: registered ? onChain.studentName : null,
        batchName: registered ? onChain.batchName : null,
        explorerUrl: onChain.explorerUrl,
      };
    } catch (error) {
      console.error("Certificate blockchain verification failed:", error);
      blockchain = { ...blockchain, status: "unavailable" };
    }
  }

  if (!record && blockchain.status !== "valid" && blockchain.status !== "revoked") {
    return null;
  }

  const student = record
    ? {
        name: record.name,
        uniqueCode: record.unique_code,
        batchName: record.batches?.name || "",
        status: record.status,
        claimedAt: record.claimed_at,
      }
    : blockchain.status === "valid" || blockchain.status === "revoked"
      ? {
          name: blockchain.studentName || "",
          uniqueCode,
          batchName: blockchain.batchName || "",
          status: "not_in_database",
          claimedAt: blockchain.issuedAt,
        }
      : null;

  const claimed = record?.status === "claimed";
  const matchesDatabase =
    record && blockchain.verified
      ? record.name.trim().toLowerCase() === blockchain.studentName?.trim().toLowerCase() &&
        (record.batches?.name || "").trim().toLowerCase() ===
          (blockchain.batchName || "").trim().toLowerCase()
      : null;

  return {
    valid: Boolean(claimed && blockchain.verified && matchesDatabase),
    databaseFound: Boolean(record),
    claimed,
    matchesDatabase,
    student,
    blockchain,
  };
}
