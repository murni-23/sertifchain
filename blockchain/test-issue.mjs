/**
 * Test kirim transaksi issueCertificate ke blockchain
 * Jalankan: node blockchain/test-issue.mjs
 */

import { ethers } from "ethers";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
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

const provider = new ethers.JsonRpcProvider(env.SEPOLIA_RPC_URL);
const wallet   = new ethers.Wallet(env.RELAYER_PRIVATE_KEY, provider);
const contract = new ethers.Contract(env.NEXT_PUBLIC_CONTRACT_ADDRESS, ABI, wallet);

// Data test siswa (dummy)
const TEST_STUDENT  = "Budi Santoso";
const TEST_CODE     = `TEST${Date.now().toString().slice(-4)}`; // kode unik random
const TEST_BATCH    = "Batch Test September 2026";
const TEST_TIME     = Math.floor(Date.now() / 1000);

console.log("=".repeat(55));
console.log("  Test issueCertificate → Sepolia Blockchain");
console.log("=".repeat(55));
console.log(`  Nama   : ${TEST_STUDENT}`);
console.log(`  Kode   : ${TEST_CODE}`);
console.log(`  Batch  : ${TEST_BATCH}`);
console.log(`  Time   : ${TEST_TIME}`);
console.log("=".repeat(55));

async function main() {
  // Cek saldo sebelum kirim
  const balance = await provider.getBalance(wallet.address);
  console.log(`\nSaldo relayer : ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    console.error("❌ Saldo nol, tidak bisa kirim transaksi");
    process.exit(1);
  }

  // Estimasi gas dulu
  console.log("\nEstimasi gas...");
  const gasEstimate = await contract.issueCertificate.estimateGas(
    TEST_STUDENT, TEST_CODE, TEST_BATCH, TEST_TIME
  );
  console.log(`Gas estimasi  : ${gasEstimate.toString()}`);

  // Kirim transaksi
  console.log("\nMengirim transaksi ke Sepolia...");
  const tx = await contract.issueCertificate(
    TEST_STUDENT,
    TEST_CODE,
    TEST_BATCH,
    TEST_TIME,
    { gasLimit: gasEstimate * 120n / 100n } // +20% buffer
  );

  console.log(`\nTx Hash       : ${tx.hash}`);
  console.log(`Etherscan     : https://sepolia.etherscan.io/tx/${tx.hash}`);
  console.log("\nMenunggu konfirmasi (~15 detik)...");

  // Tunggu 1 konfirmasi
  const receipt = await tx.wait(1);
  console.log(`\n✅ Confirmed! Block #${receipt.blockNumber}`);
  console.log(`Gas dipakai   : ${receipt.gasUsed.toString()}`);

  // Parse event dari log
  let certHash = "";
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog({
        topics: log.topics,
        data: log.data,
      });
      if (parsed?.name === "CertificateIssued") {
        certHash = parsed.args.certHash;
        break;
      }
    } catch {}
  }

  console.log(`CertHash      : ${certHash}`);

  // Verifikasi langsung dari contract
  console.log("\nVerifikasi dari contract...");
  const verify = await contract.verifyCertificate(TEST_CODE);
  console.log(`isValid       : ${verify[0]}`);
  console.log(`studentName   : ${verify[2]}`);
  console.log(`batchName     : ${verify[3]}`);

  console.log("\n" + "=".repeat(55));
  console.log("  ✅ BLOCKCHAIN INTEGRATION BERFUNGSI SEMPURNA!");
  console.log("  Sertifikat berhasil tersimpan on-chain.");
  console.log("=".repeat(55));
  console.log(`\n🔍 Cek di Etherscan:`);
  console.log(`   https://sepolia.etherscan.io/tx/${tx.hash}`);
  console.log(`\n📋 Contract:`);
  console.log(`   https://sepolia.etherscan.io/address/${env.NEXT_PUBLIC_CONTRACT_ADDRESS}`);
}

main().catch((err) => {
  console.error("\n❌ ERROR:", err.message);
  process.exit(1);
});
