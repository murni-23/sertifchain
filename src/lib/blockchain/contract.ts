/**
 * SertifChain Blockchain Service
 * Integrasi dengan smart contract di Ethereum Sepolia Testnet
 */

import { ethers } from "ethers";
import ContractABI from "../../../blockchain/abi/SertifChain.json";

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Baca contract address — coba dari variabel server dulu,
 * fallback ke NEXT_PUBLIC_ agar compatible di keduanya.
 */
function getContractAddress(): string {
  const addr =
    process.env.CONTRACT_ADDRESS ||
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!addr) throw new Error("CONTRACT_ADDRESS env tidak dikonfigurasi");
  return addr;
}

function getRpcUrl(): string {
  const url = process.env.SEPOLIA_RPC_URL;
  if (!url) throw new Error("SEPOLIA_RPC_URL env tidak dikonfigurasi");
  return url;
}

function getPrivateKey(): string {
  const key = process.env.RELAYER_PRIVATE_KEY;
  if (!key) throw new Error("RELAYER_PRIVATE_KEY env tidak dikonfigurasi");
  return key;
}

// ── Providers ────────────────────────────────────────────────────────────────

function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(getRpcUrl());
}

function getRelayerSigner(): ethers.Wallet {
  return new ethers.Wallet(getPrivateKey(), getProvider());
}

function getContractReader(): ethers.Contract {
  return new ethers.Contract(getContractAddress(), ContractABI, getProvider());
}

function getContractWriter(): ethers.Contract {
  return new ethers.Contract(getContractAddress(), ContractABI, getRelayerSigner());
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface IssueResult {
  txHash:      string;
  certHash:    string;
  explorerUrl: string;
}

export interface VerifyResult {
  isValid:     boolean;
  certHash:    string;
  studentName: string;
  batchName:   string;
  issuedAt:    Date;
  explorerUrl: string;
}

// ── WRITE: Issue Certificate ─────────────────────────────────────────────────

export async function issueCertificateOnChain(
  studentName: string,
  uniqueCode:  string,
  batchName:   string,
  claimedAt:   Date
): Promise<IssueResult> {
  const contractAddress = getContractAddress();
  const contract        = getContractWriter();
  const issuedAt        = Math.floor(claimedAt.getTime() / 1000);

  // Cek apakah sudah di-issue sebelumnya
  const alreadyIssued = await contract.isCertificateIssued(uniqueCode);
  if (alreadyIssued) {
    console.log(`⚠️ Certificate already issued on-chain: ${uniqueCode}`);
    const existing = await contract.verifyCertificate(uniqueCode);
    return {
      txHash:      "already-issued",
      certHash:    existing[1],
      explorerUrl: `https://sepolia.etherscan.io/address/${contractAddress}`,
    };
  }

  // Estimasi gas aktual sebelum kirim — lebih akurat dari hardcode
  let gasEstimate: bigint;
  try {
    gasEstimate = await contract.issueCertificate.estimateGas(
      studentName, uniqueCode, batchName, issuedAt
    );
    console.log(`⛽ Gas estimate: ${gasEstimate.toString()}`);
  } catch (estimateErr) {
    console.error("Gas estimation failed, using fallback:", estimateErr);
    gasEstimate = BigInt(1_200_000); // fallback aman berdasarkan test
  }

  // Tambah 30% buffer di atas estimasi
  const gasLimit = (gasEstimate * BigInt(130)) / BigInt(100);

  // Kirim transaksi
  const tx = await contract.issueCertificate(
    studentName,
    uniqueCode,
    batchName,
    issuedAt,
    { gasLimit }
  );

  console.log(`📤 Tx sent: ${tx.hash}`);

  // Tunggu 1 konfirmasi
  const receipt = await tx.wait(1);
  console.log(`✅ Tx confirmed: block #${receipt.blockNumber}`);

  // Ambil certHash dari event log
  let certHash = "";
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog({
        topics: log.topics as string[],
        data:   log.data,
      });
      if (parsed?.name === "CertificateIssued") {
        certHash = parsed.args.certHash;
        break;
      }
    } catch {
      // log dari contract lain, skip
    }
  }

  return {
    txHash:      receipt.hash,
    certHash,
    explorerUrl: `https://sepolia.etherscan.io/tx/${receipt.hash}`,
  };
}

// ── READ: Verify Certificate ─────────────────────────────────────────────────

export async function verifyCertificateOnChain(
  uniqueCode: string
): Promise<VerifyResult> {
  const contractAddress = getContractAddress();
  const contract        = getContractReader();
  const result          = await contract.verifyCertificate(uniqueCode);

  return {
    isValid:     result[0] as boolean,
    certHash:    result[1] as string,
    studentName: result[2] as string,
    batchName:   result[3] as string,
    issuedAt:    new Date(Number(result[4]) * 1000),
    explorerUrl: `https://sepolia.etherscan.io/address/${contractAddress}`,
  };
}

// ── Helper: cek apakah blockchain aktif ─────────────────────────────────────

export function isBlockchainEnabled(): boolean {
  try {
    const addr = process.env.CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    const key  = process.env.RELAYER_PRIVATE_KEY;

    return isBlockchainReadEnabled() && !!key && key.length > 10;
  } catch {
    return false;
  }
}

export function isBlockchainReadEnabled(): boolean {
  const addr = process.env.CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const rpc = process.env.SEPOLIA_RPC_URL;
  return Boolean(
    addr &&
      addr.startsWith("0x") &&
      addr.length === 42 &&
      rpc &&
      rpc.startsWith("http")
  );
}
