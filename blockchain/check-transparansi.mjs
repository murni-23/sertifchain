import { ethers } from "ethers";
import { readFileSync } from "fs";

const ABI = JSON.parse(readFileSync("blockchain/abi/SertifChain.json", "utf-8"));
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const iface = new ethers.Interface(ABI);

async function checkTransaction(txHash) {
  try {
    const transaction = await provider.getTransaction(txHash);
    if (!transaction) {
      console.log("Transaksi tidak ditemukan. Periksa hash atau jaringan.");
      return;
    }
    const receipt = await provider.getTransactionReceipt(txHash);
    const decoded = iface.parseTransaction({ data: transaction.data });

    console.log("Detail Transaksi:");
    console.log("Pengirim (relayer)    :", transaction.from);
    console.log("Alamat smart contract :", transaction.to);
    console.log("Nomor blok            :", receipt.blockNumber);
    console.log("Status                :", receipt.status === 1 ? "Berhasil" : "Gagal");
    console.log("Gas terpakai          :", receipt.gasUsed.toString());
    console.log("Fungsi yang dipanggil :", decoded.name);
    console.log("Kode unik sertifikat  :", decoded.args[1]);
  } catch (error) {
    console.error("Error saat mencoba memeriksa transaksi:", error);
  }
}

const txHash = process.argv[2];
if (!txHash) {
  console.error("Gunakan: node blockchain/check-transparansi.mjs <HASH_TRANSAKSI>");
  process.exitCode = 1;
} else {
  checkTransaction(txHash);
}
