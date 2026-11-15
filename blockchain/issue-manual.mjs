/**
 * Issue sertifikat manual ke blockchain untuk kode yang sudah diklaim
 * tapi belum masuk blockchain (karena bug gas limit sebelumnya).
 *
 * Cara pakai:
 *   node blockchain/issue-manual.mjs <uniqueCode> <studentName> <batchName>
 *
 * Contoh:
 *   node blockchain/issue-manual.mjs 5OA7IPRT "Jane Smith" "Utah"
 */

import { ethers } from "ethers";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const envFile = readFileSync(join(__dirname, "../.env.local"), "utf-8");
const env = {};
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const [key, ...rest] = trimmed.split("=");
  if (key && rest.length) env[key.trim()] = rest.join("=").trim();
}

const ABI = JSON.parse(readFileSync(join(__dirname, "abi/SertifChain.json"), "utf-8"));

const uniqueCode  = process.argv[2];
const studentName = process.argv[3];
const batchName   = process.argv[4];

if (!uniqueCode || !studentName || !batchName) {
  console.error('Usage: node issue-manual.mjs <uniqueCode> "<studentName>" "<batchName>"');
  console.error('Contoh: node blockchain/issue-manual.mjs 5OA7IPRT "Jane Smith" "Utah"');
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(env.SEPOLIA_RPC_URL);
const wallet   = new ethers.Wallet(env.RELAYER_PRIVATE_KEY, provider);
const contract = new ethers.Contract(
  env.CONTRACT_ADDRESS || env.NEXT_PUBLIC_CONTRACT_ADDRESS,
  ABI, wallet
);

async function main() {
  console.log("=".repeat(55));
  console.log("  Issue Manual ke Blockchain");
  console.log("=".repeat(55));
  console.log(`  Kode   : ${uniqueCode}`);
  console.log(`  Nama   : ${studentName}`);
  console.log(`  Batch  : ${batchName}`);
  console.log("=".repeat(55));

  // Cek sudah ada atau belum
  const existing = await contract.isCertificateIssued(uniqueCode);
  if (existing) {
    console.log("\n⚠️  Kode ini sudah ada di blockchain.");
    const data = await contract.verifyCertificate(uniqueCode);
    console.log(`  isValid     : ${data[0]}`);
    console.log(`  studentName : ${data[2]}`);
    return;
  }

  const issuedAt = Math.floor(Date.now() / 1000);

  // Estimasi gas
  const gasEst = await contract.issueCertificate.estimateGas(
    studentName, uniqueCode, batchName, issuedAt
  );
  const gasLimit = (gasEst * 130n) / 100n;
  console.log(`\n⛽ Gas estimate: ${gasEst} → limit: ${gasLimit}`);

  // Kirim
  const tx = await contract.issueCertificate(
    studentName, uniqueCode, batchName, issuedAt, { gasLimit }
  );
  console.log(`📤 Tx: ${tx.hash}`);
  console.log("Menunggu konfirmasi...");

  const receipt = await tx.wait(1);
  console.log(`✅ Confirmed! Block #${receipt.blockNumber}`);
  console.log(`\n🔍 Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
  console.log("\nSetelah ini update tx_hash di Supabase:");
  console.log(`  UPDATE students SET tx_hash='${receipt.hash}' WHERE unique_code='${uniqueCode}';`);
}

main().catch(err => { console.error("❌ Error:", err.message); process.exit(1); });
