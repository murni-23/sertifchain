/**
 * Pemeriksaan baca-saja status klaim sertifikat di Supabase dan Ethereum Sepolia.
 *
 * Cara pakai:
 *   node blockchain/check-claim-status.mjs KODE_UNIK
 */

import { ethers } from "ethers";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const code = process.argv[2]?.trim().toUpperCase();

if (!code) {
  console.error("Pemakaian: node blockchain/check-claim-status.mjs KODE_UNIK");
  process.exit(1);
}

function loadEnv() {
  const contents = readFileSync(join(__dirname, "../.env.local"), "utf8");
  const values = {};

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator > 0) {
      values[trimmed.slice(0, separator).trim()] =
        trimmed.slice(separator + 1).trim();
    }
  }

  return values;
}

async function main() {
  const env = loadEnv();
  const { createClient } = await import("@supabase/supabase-js");
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Konfigurasi Supabase tidak lengkap di .env.local");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: student, error: databaseError } = await supabase
    .from("students")
    .select("status, claimed_at")
    .eq("unique_code", code)
    .maybeSingle();

  if (databaseError) {
    throw new Error(`Pemeriksaan database gagal: ${databaseError.message}`);
  }

  console.log(`Kode sertifikat : ${code}`);
  console.log(
    `Status database : ${
      !student
        ? "TIDAK DITEMUKAN"
        : student.status === "claimed"
          ? "SUDAH DIKLAIM"
          : "BELUM DIKLAIM"
    }`
  );
  if (student?.claimed_at) {
    console.log(`Waktu klaim DB  : ${new Date(student.claimed_at).toLocaleString("id-ID")}`);
  }

  const rpcUrl = env.SEPOLIA_RPC_URL;
  const contractAddress =
    env.CONTRACT_ADDRESS || env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!rpcUrl || !contractAddress) {
    console.log("Status blockchain: TIDAK DIKONFIGURASI");
    return;
  }

  const abi = JSON.parse(
    readFileSync(join(__dirname, "abi/SertifChain.json"), "utf8")
  );
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  if (network.chainId !== 11155111n) {
    throw new Error(`RPC bukan Sepolia (chainId: ${network.chainId})`);
  }

  const contract = new ethers.Contract(contractAddress, abi, provider);
  const result = await contract.verifyCertificate(code);
  const registered = result[1] !== ethers.ZeroHash;

  console.log(
    `Status blockchain: ${
      !registered ? "TIDAK DITEMUKAN" : result[0] ? "VALID" : "DICABUT"
    }`
  );
  if (registered) {
    console.log(`Hash on-chain    : ${result[1]}`);
    console.log(
      `Waktu terbit     : ${new Date(Number(result[4]) * 1000).toLocaleString("id-ID")}`
    );
  }

  if (student?.status === "claimed" && result[0]) {
    console.log("Kesimpulan       : KLAIM TERCATAT DI DB DAN SERTIFIKAT AKTIF DI BLOCKCHAIN");
  } else if (student?.status === "claimed") {
    console.log("Kesimpulan       : DB MENANDAI SUDAH DIKLAIM, TETAPI BLOCKCHAIN BELUM MEMBUKTIKAN SERTIFIKAT AKTIF");
  } else if (!student && result[0]) {
    console.log("Kesimpulan       : SERTIFIKAT AKTIF DI BLOCKCHAIN, TETAPI TIDAK ADA DI DATABASE");
  } else if (student && result[0]) {
    console.log("Kesimpulan       : SERTIFIKAT AKTIF DI BLOCKCHAIN, TETAPI DATABASE BELUM MENANDAI SUDAH DIKLAIM");
  } else {
    console.log("Kesimpulan       : STATUS KLAIM BELUM TERVERIFIKASI DI KEDUA SUMBER");
  }
}

main().catch((error) => {
  console.error("Pemeriksaan gagal:", error.message);
  process.exit(1);
});
