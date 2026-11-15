import { ethers } from "ethers";
import { readFileSync } from "fs";

const ABI = JSON.parse(readFileSync("blockchain/abi/SertifChain.json", "utf-8"));
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);

// Dompet acak: bukan relayer dan bukan owner
const penyerang = ethers.Wallet.createRandom().connect(provider);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, ABI, penyerang);

async function coba(namaAksi, aksi) {
  try {
    await aksi();
    console.log(namaAksi, "-> BERHASIL (tidak seharusnya terjadi)");
  } catch (error) {
    console.log(namaAksi, "-> DITOLAK:", error.reason ?? error.shortMessage);
  }
}

async function checkAkses(uniqueCode) {
  console.log("Alamat penyerang:", penyerang.address);
  await coba("Menerbitkan sertifikat", () =>
    contract.issueCertificate.staticCall("Nama Palsu", "KODEBARU", "Batch Palsu", 1)
  );
  await coba("Membatalkan sertifikat", () =>
    contract.revokeCertificate.staticCall(uniqueCode)
  );
  await coba("Mengganti relayer    ", () =>
    contract.setRelayer.staticCall(penyerang.address)
  );
}

// Ganti dengan kode unik sertifikat yang sudah diklaim
checkAkses("<KODE_UNIK>");
