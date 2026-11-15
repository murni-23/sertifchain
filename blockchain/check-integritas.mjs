import { ethers } from "ethers";
import { readFileSync } from "fs";

const ABI = JSON.parse(readFileSync("blockchain/abi/SertifChain.json", "utf-8"));
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, ABI, provider);

const hitungHash = (nama, kode, batch, waktu) =>
  ethers.solidityPackedKeccak256(
    ["string", "string", "string", "uint256"],
    [nama, kode, batch, waktu]
  );

async function checkIntegritas(uniqueCode) {
  try {
    const data = await contract.verifyCertificate(uniqueCode);
    const [isValid, certHash, nama, batch, waktu] = data;
    if (!isValid) {
      console.log("Sertifikat tidak ditemukan atau sudah dibatalkan.");
      return;
    }
    console.log("Hash tersimpan di blockchain :", certHash);

    const hashAsli = hitungHash(nama, uniqueCode, batch, waktu);
    console.log("Hash dari data asli          :", hashAsli);
    console.log("Cocok?                       :", hashAsli === certHash);

    const hashPalsu = hitungHash(nama + " X", uniqueCode, batch, waktu);
    console.log("\nHash dari data yang diubah   :", hashPalsu);
    console.log("Cocok?                       :", hashPalsu === certHash);
    console.log("HASIL: Perubahan data terdeteksi karena hash tidak cocok.");
  } catch (error) {
    console.error("Error saat memeriksa integritas:", error);
  }
}

// Ganti dengan kode unik sertifikat yang sudah diklaim
checkIntegritas("<KODE_UNIK>");
