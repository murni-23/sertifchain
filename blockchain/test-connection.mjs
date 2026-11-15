/**
 * Test koneksi blockchain — jalankan dengan:
 * node blockchain/test-connection.mjs
 *
 * Pastikan .env.local sudah diisi sebelum run.
 */

import { ethers } from "ethers";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manual (node tidak auto-load .env)
const envFile = readFileSync(join(__dirname, "../.env.local"), "utf-8");
const env = {};
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const [key, ...rest] = trimmed.split("=");
  if (key && rest.length) env[key.trim()] = rest.join("=").trim();
}

const RPC_URL          = env.SEPOLIA_RPC_URL;
const PRIVATE_KEY      = env.RELAYER_PRIVATE_KEY;
const CONTRACT_ADDRESS = env.NEXT_PUBLIC_CONTRACT_ADDRESS;

// Load ABI
const ABI = JSON.parse(
  readFileSync(join(__dirname, "abi/SertifChain.json"), "utf-8")
);

console.log("=".repeat(50));
console.log("  SertifChain Blockchain Connection Test");
console.log("=".repeat(50));
console.log(`RPC URL      : ${RPC_URL?.slice(0, 40)}...`);
console.log(`Contract     : ${CONTRACT_ADDRESS}`);
console.log(`Relayer Key  : ${PRIVATE_KEY?.slice(0, 10)}...`);
console.log("=".repeat(50));

async function main() {
  // 1. Cek koneksi ke Sepolia
  console.log("\n[1] Cek koneksi RPC...");
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const network  = await provider.getNetwork();
  const block    = await provider.getBlockNumber();
  console.log(`    ✅ Terhubung ke ${network.name} (chainId: ${network.chainId})`);
  console.log(`    ✅ Block terbaru: #${block}`);

  // 2. Cek saldo relayer
  console.log("\n[2] Cek saldo wallet relayer...");
  const wallet  = new ethers.Wallet(PRIVATE_KEY, provider);
  const balance = await provider.getBalance(wallet.address);
  console.log(`    Address : ${wallet.address}`);
  console.log(`    Saldo   : ${ethers.formatEther(balance)} ETH`);
  if (balance === 0n) {
    console.log("    ⚠️  SALDO NOL — minta ETH Sepolia dari faucet!");
  } else {
    console.log(`    ✅ Saldo cukup untuk transaksi`);
  }

  // 3. Cek contract
  console.log("\n[3] Cek smart contract...");
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

  const owner       = await contract.owner();
  const relayer     = await contract.relayer();
  const totalIssued = await contract.totalIssued();

  console.log(`    Owner        : ${owner}`);
  console.log(`    Relayer      : ${relayer}`);
  console.log(`    Total Issued : ${totalIssued}`);
  console.log(`    ✅ Contract bisa dibaca`);

  // 4. Test read — verifyCertificate dengan kode dummy
  console.log("\n[4] Test read function (verifyCertificate)...");
  const result = await contract.verifyCertificate("TESTCODE");
  console.log(`    isValid     : ${result[0]}`);
  console.log(`    ✅ Read function berfungsi`);

  // 5. Test computeHash
  console.log("\n[5] Test computeHash...");
  const hash = await contract.computeHash(
    "Budi Santoso",
    "ABC12345",
    "Batch Test",
    Math.floor(Date.now() / 1000)
  );
  console.log(`    Hash : ${hash}`);
  console.log(`    ✅ computeHash berfungsi`);

  console.log("\n" + "=".repeat(50));
  console.log("  ✅ SEMUA TEST BERHASIL — Blockchain siap digunakan!");
  console.log("=".repeat(50));
}

main().catch((err) => {
  console.error("\n❌ ERROR:", err.message);
  process.exit(1);
});
