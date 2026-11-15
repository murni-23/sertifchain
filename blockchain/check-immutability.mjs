import { ethers } from "ethers";
import { readFileSync } from "fs";

const ABI = JSON.parse(readFileSync("blockchain/abi/SertifChain.json", "utf-8"));
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, ABI, wallet);

async function checkImmutability(txHash, uniqueCode) {
  try {
    const transaction = await provider.getTransaction(txHash);
    if (!transaction) {
      console.log("Transaksi tidak ditemukan.");
      return;
    }
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt || receipt.status !== 1) {
      console.log("Transaksi tidak ditemukan receipt-nya atau gagal.");
      return;
    }
    console.log("TX ditemukan | Blok:", receipt.blockNumber, "| Status: Berhasil");

    const before = await contract.verifyCertificate(uniqueCode);
    console.log("\nData sertifikat sebelum percobaan:");
    console.log("Nama :", before[2], "| Hash :", before[1]);

    console.log("\nPercobaan Mengubah Data (menerbitkan ulang kode yang sama):");
    try {
      await contract.issueCertificate.staticCall("Nama Palsu", uniqueCode, "Batch Palsu", 1);
      console.log("HASIL: Data berhasil diubah (tidak seharusnya terjadi).");
    } catch (error) {
      console.log("Ditolak oleh smart contract:", error.reason ?? error.shortMessage);
    }

    const after = await contract.verifyCertificate(uniqueCode);
    console.log("\nData sertifikat sesudah percobaan:");
    console.log("Nama :", after[2], "| Hash :", after[1]);
    const unchanged = before[1] === after[1] &&
      before[2] === after[2] &&
      before[3] === after[3] &&
      before[4] === after[4] &&
      before[0] === after[0];
    console.log(
      unchanged
        ? "HASIL: Data sama sebelum dan sesudah simulasi; staticCall tidak mengubah blockchain."
        : "HASIL: Data berbeda; periksa perubahan state atau jaringan."
    );
  } catch (error) {
    console.error("Error saat mencoba memeriksa transaksi:", error);
  }
}

const [txHash, uniqueCode] = process.argv.slice(2);
if (!txHash || !uniqueCode) {
  console.error("Gunakan: node blockchain/check-immutability.mjs <HASH_TRANSAKSI> <KODE_UNIK>");
  process.exitCode = 1;
} else {
  checkImmutability(txHash, uniqueCode);
}
