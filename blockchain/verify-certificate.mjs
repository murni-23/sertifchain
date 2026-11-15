/**
 * Verifikasi keaslian sertifikat SertifChain
 *
 * Cara pakai:
 *   node blockchain/verify-certificate.mjs KODE_UNIK
 *
 * Contoh:
 *   node blockchain/verify-certificate.mjs ABC12345
 *
 * Script ini HANYA melakukan READ — tidak butuh wallet,
 * tidak butuh ETH, dan GRATIS.
 */

import { ethers } from "ethers";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load config
const envFile = readFileSync(join(__dirname, "../.env.local"), "utf-8");
const env = {};
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const [key, ...rest] = trimmed.split("=");
  if (key && rest.length) env[key.trim()] = rest.join("=").trim();
}

const ABI = JSON.parse(
  readFileSync(join(__dirname, "abi/SertifChain.json"), "utf-8")
);

// Ambil kode unik dari argument CLI
const uniqueCode = process.argv[2]?.toUpperCase();

if (!uniqueCode) {
  console.error("❌ Masukkan kode unik sebagai argument");
  console.error("   Contoh: node blockchain/verify-certificate.mjs ABC12345");
  process.exit(1);
}

async function main() {
  // Read-only provider — tidak butuh wallet
  const provider = new ethers.JsonRpcProvider(env.SEPOLIA_RPC_URL);
  const contract = new ethers.Contract(
    env.NEXT_PUBLIC_CONTRACT_ADDRESS,
    ABI,
    provider
  );

  console.log("\n" + "═".repeat(55));
  console.log("  🔍 SertifChain — Verifikasi Keaslian Sertifikat");
  console.log("═".repeat(55));
  console.log(`  Kode Unik    : ${uniqueCode}`);
  console.log(`  Contract     : ${env.NEXT_PUBLIC_CONTRACT_ADDRESS}`);
  console.log(`  Jaringan     : Ethereum Sepolia Testnet`);
  console.log("═".repeat(55));

  // Query langsung dari blockchain
  const result = await contract.verifyCertificate(uniqueCode);

  const isValid     = result[0];
  const certHash    = result[1];
  const studentName = result[2];
  const batchName   = result[3];
  const issuedAt    = result[4];

  if (!isValid && !studentName) {
    console.log("\n  ❌ SERTIFIKAT TIDAK DITEMUKAN");
    console.log("  Kode unik tidak terdaftar di blockchain.");
    console.log("  Kemungkinan: kode salah, atau sertifikat belum diklaim.\n");
    process.exit(1);
  }

  if (!isValid) {
    console.log("\n  ⚠️  SERTIFIKAT DICABUT (REVOKED)");
    console.log("  Sertifikat ini pernah terdaftar tapi telah dibatalkan.\n");
    process.exit(1);
  }

  // Format tanggal
  const claimedDate = new Date(Number(issuedAt) * 1000);
  const dateStr = claimedDate.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  console.log("\n  ✅ SERTIFIKAT VALID & ASLI");
  console.log("─".repeat(55));
  console.log(`  Nama Siswa   : ${studentName}`);
  console.log(`  Batch        : ${batchName}`);
  console.log(`  Diklaim Pada : ${dateStr}`);
  console.log(`  Kode Unik    : ${uniqueCode}`);
  console.log("─".repeat(55));
  console.log(`  Hash On-Chain:`);
  console.log(`  ${certHash}`);
  console.log("─".repeat(55));
  console.log(`\n  🔗 Bukti di Etherscan (tidak bisa dipalsukan):`);
  console.log(`  https://sepolia.etherscan.io/address/${env.NEXT_PUBLIC_CONTRACT_ADDRESS}#readContract`);
  console.log("\n  Hash ini disimpan permanen di Ethereum Sepolia.");
  console.log("  Tidak ada yang bisa mengubah atau menghapusnya.");
  console.log("═".repeat(55) + "\n");
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
