# 🔗 Panduan Integrasi Blockchain — SertifChain Fase 2

**Jaringan:** Ethereum Sepolia Testnet  
**Pendekatan:** Hash-based verification (bukan NFT)  
**User tidak perlu wallet** — gas dibayar oleh wallet backend (relayer)

---

## 📋 Ringkasan Cara Kerja

```
Siswa klaim sertifikat di web
        ↓
Backend Next.js hitung hash(nama + kode + batch + timestamp)
        ↓
Backend kirim transaksi ke smart contract Sepolia
        ↓
Hash tersimpan permanen on-chain
        ↓
Siapapun bisa verifikasi keaslian via kode unik / hash
        ↓
Link ke Sepolia Etherscan ditampilkan di sertifikat
```

---

## 🛠️ Tools yang Dibutuhkan

| Tool | Kegunaan | Link |
|------|----------|------|
| **MetaMask** | Wallet untuk deploy & relayer | https://metamask.io |
| **Remix IDE** | Deploy smart contract (browser, tanpa install) | https://remix.ethereum.org |
| **Sepolia Faucet** | Dapat ETH testnet gratis | https://sepoliafaucet.com |
| **Alchemy / Infura** | RPC provider untuk backend Next.js | https://alchemy.com |
| **Sepolia Etherscan** | Explorer untuk cek transaksi | https://sepolia.etherscan.io |
| **ethers.js v6** | Library untuk interaksi dari Next.js | `npm install ethers` |

---

## BAGIAN 1 — Setup Wallet & Sepolia ETH

### Step 1: Install MetaMask

1. Buka **https://metamask.io/download** → Install extension Chrome/Firefox
2. Buat wallet baru → **simpan seed phrase di tempat aman**
3. Tambah jaringan Sepolia:
   - Buka MetaMask → klik nama jaringan (atas) → "Add Network"
   - Atau langsung kunjungi **https://chainlist.org** → search "Sepolia" → "Add to MetaMask"

> Detail manual Sepolia:
> - Network Name: `Sepolia`
> - RPC URL: `https://rpc.sepolia.org`
> - Chain ID: `11155111`
> - Symbol: `ETH`
> - Explorer: `https://sepolia.etherscan.io`

### Step 2: Dapatkan Sepolia ETH (Gratis)

Anda butuh ETH Sepolia untuk bayar gas deploy dan transaksi.

1. Copy address wallet MetaMask Anda
2. Kunjungi salah satu faucet:
   - **https://sepoliafaucet.com** (perlu login Alchemy)
   - **https://faucet.sepolia.dev** 
   - **https://www.infura.io/faucet/sepolia** (perlu akun Infura)
3. Paste address → klik "Send ETH"
4. Tunggu ~1 menit → cek MetaMask, seharusnya dapat 0.5 ETH Sepolia

> 💡 Anda perlu **2 wallet terpisah**:
> - **Wallet Deploy** (owner) — untuk deploy kontrak
> - **Wallet Relayer** — untuk kirim transaksi dari backend (simpan private key-nya untuk `.env.local`)

---

## BAGIAN 2 — Setup Alchemy (RPC Provider)

Backend Next.js butuh RPC URL untuk kirim transaksi ke Sepolia.

### Step 3: Buat Akun Alchemy

1. Daftar di **https://alchemy.com** (gratis)
2. Dashboard → "Create New App"
3. Isi:
   - Name: `SertifChain`
   - Chain: `Ethereum`
   - Network: `Sepolia`
4. Klik app yang dibuat → "API Key" → copy **HTTPS URL**

Format URL: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`

---

## BAGIAN 3 — Deploy Smart Contract via Remix

### Step 4: Buka Remix IDE

Buka browser → **https://remix.ethereum.org**

### Step 5: Buat File Contract

1. Di panel kiri, klik ikon **File Explorer**
2. Klik icon 📄 "Create new file"
3. Nama file: `SertifChain.sol`
4. Copy-paste isi dari `blockchain/contracts/SertifChain.sol` ke editor

### Step 6: Compile Contract

1. Klik ikon **Solidity Compiler** (logo S di panel kiri)
2. Pilih versi compiler: **0.8.20** (atau yang terbaru ≥ 0.8.20)
3. Centang **"Auto compile"** atau klik tombol biru **"Compile SertifChain.sol"**
4. Pastikan tidak ada error merah — warning kuning boleh diabaikan

### Step 7: Connect MetaMask ke Remix

1. Klik ikon **Deploy & Run Transactions** (logo rocket di panel kiri)
2. Di dropdown **"Environment"** → pilih **"Injected Provider - MetaMask"**
3. MetaMask akan muncul → klik **"Connect"**
4. Pastikan MetaMask sudah di jaringan **Sepolia**
5. Di field "Account" akan muncul address wallet Anda

### Step 8: Deploy Contract

1. Di bagian **"Contract"** → pilih **SertifChain**
2. Di field **"_relayer"** (parameter constructor) → isi dengan address **wallet relayer** Anda
   - Ini adalah wallet yang akan dipakai backend untuk kirim transaksi
   - Bisa sama dengan wallet owner sementara untuk testing
   - Contoh: `0xAbCd1234...` (address MetaMask kedua Anda)
3. Klik tombol oranye **"Deploy"**
4. MetaMask popup → review gas fee → klik **"Confirm"**
5. Tunggu ~15 detik → transaksi confirmed

### Step 9: Simpan Contract Address

Setelah deploy berhasil:
1. Di bagian bawah Remix "Deployed Contracts" → muncul address baru
2. **Copy address ini** → bentuknya: `0x1234AbCd...`
3. Klik link ke Etherscan untuk verifikasi → **https://sepolia.etherscan.io/address/0x...**

---

## BAGIAN 4 — Verifikasi Contract di Etherscan (Opsional tapi Disarankan)

Verifikasi membuat source code bisa dilihat publik di Etherscan, meningkatkan kepercayaan.

### Step 10: Daftarkan API Key Etherscan

1. Buka **https://etherscan.io** → Register / Login
2. My Profile → API Keys → "Add" → nama: `SertifChain`
3. Copy API key

### Step 11: Verifikasi di Etherscan

1. Buka **https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS**
2. Tab **"Contract"** → klik **"Verify and Publish"**
3. Isi form:
   - Compiler Type: `Solidity (Single file)`
   - Compiler Version: `v0.8.20`
   - License: `MIT`
4. Paste source code `SertifChain.sol`
5. Klik **"Verify and Publish"**
6. Setelah berhasil, tab Contract akan tampilkan ✅ dan source code terbuka

---

## BAGIAN 5 — Integrasi ke Next.js

### Step 12: Install ethers.js

```bash
npm install ethers
```

### Step 13: Update .env.local

Tambahkan ke `.env.local`:

```env
# =============================================
# BLOCKCHAIN — Ethereum Sepolia
# =============================================

# RPC URL dari Alchemy
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY

# Private key wallet RELAYER (bukan owner!)
# JANGAN commit file .env ke GitHub jika berisi ini
RELAYER_PRIVATE_KEY=0xYourRelayerWalletPrivateKeyHere

# Address smart contract yang sudah di-deploy
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourDeployedContractAddress

# Sepolia Chain ID
NEXT_PUBLIC_CHAIN_ID=11155111
```

> ⚠️ **PENTING:** `RELAYER_PRIVATE_KEY` adalah rahasia. Pastikan `.env.local` ada di `.gitignore` dan **JANGAN PERNAH** commit ke GitHub.

### Step 14: Buat File ABI

Setelah compile di Remix, copy ABI:
1. Di Remix → Compiler → klik tombol copy ABI (bawah tombol Compile)
2. Simpan ke file baru:

```bash
# Buat file: blockchain/abi/SertifChain.json
```

Isi file `blockchain/abi/SertifChain.json`:
```json
[
  {
    "inputs": [{ "internalType": "address", "name": "_relayer", "type": "address" }],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "uniqueCode", "type": "string" },
      { "indexed": true, "name": "certHash", "type": "bytes32" },
      { "indexed": false, "name": "studentName", "type": "string" },
      { "indexed": false, "name": "batchName", "type": "string" },
      { "indexed": false, "name": "issuedAt", "type": "uint256" }
    ],
    "name": "CertificateIssued",
    "type": "event"
  },
  {
    "inputs": [
      { "name": "_studentName", "type": "string" },
      { "name": "_uniqueCode", "type": "string" },
      { "name": "_batchName", "type": "string" },
      { "name": "_issuedAt", "type": "uint256" }
    ],
    "name": "issueCertificate",
    "outputs": [{ "name": "certHash", "type": "bytes32" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "_uniqueCode", "type": "string" }],
    "name": "verifyCertificate",
    "outputs": [
      { "name": "isValid", "type": "bool" },
      { "name": "certHash", "type": "bytes32" },
      { "name": "studentName", "type": "string" },
      { "name": "batchName", "type": "string" },
      { "name": "issuedAt", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "_uniqueCode", "type": "string" }],
    "name": "isCertificateIssued",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalIssued",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
]
```

### Step 15: Buat Blockchain Service

Buat file `src/lib/blockchain/contract.ts`:

```typescript
import { ethers } from "ethers";
import ContractABI from "@/../../blockchain/abi/SertifChain.json";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
const RPC_URL         = process.env.SEPOLIA_RPC_URL!;
const PRIVATE_KEY     = process.env.RELAYER_PRIVATE_KEY!;

// Provider untuk READ (tidak butuh wallet)
export function getReadProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

// Signer untuk WRITE (butuh private key relayer)
export function getRelayerSigner() {
  const provider = getReadProvider();
  return new ethers.Wallet(PRIVATE_KEY, provider);
}

// Contract instance untuk READ
export function getContractReader() {
  return new ethers.Contract(CONTRACT_ADDRESS, ContractABI, getReadProvider());
}

// Contract instance untuk WRITE
export function getContractWriter() {
  return new ethers.Contract(CONTRACT_ADDRESS, ContractABI, getRelayerSigner());
}

/**
 * Issue sertifikat ke blockchain saat siswa klaim.
 * Dipanggil dari API route /api/claim/[id]
 */
export async function issueCertificateOnChain(
  studentName: string,
  uniqueCode: string,
  batchName: string,
  claimedAt: Date
): Promise<{ txHash: string; certHash: string }> {
  const contract  = getContractWriter();
  const issuedAt  = Math.floor(claimedAt.getTime() / 1000); // Unix timestamp

  const tx = await contract.issueCertificate(
    studentName,
    uniqueCode,
    batchName,
    issuedAt
  );

  const receipt = await tx.wait(); // tunggu konfirmasi

  // Ambil certHash dari event log
  const event = receipt.logs
    .map((log: any) => {
      try { return contract.interface.parseLog(log); } catch { return null; }
    })
    .find((e: any) => e?.name === "CertificateIssued");

  return {
    txHash:   receipt.hash,
    certHash: event?.args?.certHash ?? "",
  };
}

/**
 * Verifikasi keaslian sertifikat (READ, gratis)
 */
export async function verifyCertificateOnChain(uniqueCode: string) {
  const contract = getContractReader();
  const result   = await contract.verifyCertificate(uniqueCode);
  return {
    isValid:     result[0] as boolean,
    certHash:    result[1] as string,
    studentName: result[2] as string,
    batchName:   result[3] as string,
    issuedAt:    new Date(Number(result[4]) * 1000),
  };
}
```

---

## BAGIAN 6 — Integrasi ke Alur Klaim

### Step 16: Update API Claim

Di `src/app/api/claim/[id]/route.ts`, tambahkan pemanggilan blockchain setelah update database:

```typescript
// Setelah update status siswa ke "claimed" di Supabase...

// Kirim ke blockchain (background, tidak block response)
if (process.env.RELAYER_PRIVATE_KEY && process.env.NEXT_PUBLIC_CONTRACT_ADDRESS) {
  try {
    const { txHash, certHash } = await issueCertificateOnChain(
      student.name,
      student.unique_code,
      batchName,
      new Date()
    );

    // Simpan tx_hash ke database
    await supabase
      .from("students")
      .update({ tx_hash: txHash })
      .eq("id", params.id);

    console.log(`✅ Blockchain issued: ${txHash}`);
  } catch (blockchainError) {
    // Jangan gagalkan klaim jika blockchain error
    // Log saja untuk retry nanti
    console.error("⚠️ Blockchain issue failed:", blockchainError);
  }
}
```

### Step 17: Tampilkan Bukti di Sertifikat

Di halaman `/claim/[id]`, tampilkan link Etherscan jika `tx_hash` ada:

```tsx
{student.tx_hash && (
  <div className="flex items-center gap-3 p-4 bg-cream border-2 border-black">
    <div className="w-8 h-8 bg-yellow border-2 border-black flex items-center justify-center">
      🔗
    </div>
    <div className="flex-1">
      <p className="text-xs font-bold text-black/60 uppercase">
        Terverifikasi di Blockchain
      </p>
      <a
        href={`https://sepolia.etherscan.io/tx/${student.tx_hash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-bold underline hover:no-underline break-all"
      >
        Lihat di Etherscan ↗
      </a>
    </div>
    <Badge variant="mint">✓ On-Chain</Badge>
  </div>
)}
```

---

## BAGIAN 7 — Halaman Verifikasi Publik

Buat halaman `src/app/verify/page.tsx` untuk verifikasi sertifikat by kode unik:

```
URL: /verify?code=ABC12345
```

Halaman ini memanggil `verifyCertificateOnChain(code)` dan menampilkan:
- ✅ Valid / ❌ Tidak ditemukan
- Hash sertifikat on-chain
- Nama siswa, batch, tanggal
- Link ke Etherscan

### Periksa status klaim di database dan blockchain

Jalankan skrip baca-saja berikut dari root proyek. Skrip ini melaporkan
status klaim Supabase dan status sertifikat di Sepolia secara terpisah:

```bash
node blockchain/check-claim-status.mjs KODE_UNIK
```

Skrip memerlukan `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`SEPOLIA_RPC_URL`, dan alamat contract di `.env.local`. Skrip tidak mengubah
data, mengirim transaksi, atau mencetak kredensial. Status klaim database
ditentukan oleh `students.status`; blockchain menjadi pemeriksaan terpisah.

---

## BAGIAN 8 — Migration Database

Jalankan migration berikut di Supabase SQL Editor untuk kolom blockchain:

```sql
-- Sudah ada di schema dari awal (dari migration 001)
-- Pastikan kolom ini ada di tabel students:
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS tx_hash  TEXT,
  ADD COLUMN IF NOT EXISTS token_id TEXT;
```

---

## 📊 Estimasi Biaya Gas (Sepolia Testnet = Gratis)

| Operasi | Gas Estimasi | ETH Sepolia |
|---------|-------------|-------------|
| Deploy contract | ~800,000 gas | ~0.002 ETH |
| issueCertificate() | ~120,000 gas | ~0.0003 ETH |
| verifyCertificate() | 0 (read only) | **Gratis** |

> Semua biaya di atas menggunakan **Sepolia testnet ETH** yang GRATIS dari faucet.  
> Di production (Ethereum mainnet), biaya nyata sesuai harga gas saat itu.

---

## ✅ Checklist Deployment

```
□ MetaMask terpasang & terhubung ke Sepolia
□ Sepolia ETH sudah didapat dari faucet (untuk 2 wallet)
□ Akun Alchemy dibuat & RPC URL didapat
□ SertifChain.sol di-compile di Remix (tidak ada error)
□ Contract di-deploy ke Sepolia via Remix
□ Contract address disimpan
□ Contract di-verifikasi di Sepolia Etherscan (opsional)
□ ABI disimpan ke blockchain/abi/SertifChain.json
□ .env.local diupdate dengan:
  □ SEPOLIA_RPC_URL
  □ RELAYER_PRIVATE_KEY
  □ NEXT_PUBLIC_CONTRACT_ADDRESS
□ npm install ethers
□ src/lib/blockchain/contract.ts dibuat
□ API claim diupdate untuk panggil blockchain
□ Halaman claim menampilkan tx_hash + link Etherscan
□ Halaman /verify dibuat (opsional)
□ Test end-to-end: klaim sertifikat → cek Etherscan
```

---

## 🔒 Keamanan Penting

1. **RELAYER_PRIVATE_KEY** — jangan pernah hardcode di kode, selalu via env variable
2. **Pisahkan wallet owner & relayer** — owner hanya untuk admin kontrak, relayer untuk operasi rutin
3. **Blockchain error jangan block klaim** — wrap dalam try/catch, klaim tetap berhasil walau blockchain gagal
4. **Sepolia hanya untuk testing** — sebelum ke mainnet, audit code dulu

---

## 🆘 Troubleshooting

| Error | Penyebab | Solusi |
|-------|----------|--------|
| `insufficient funds` | Wallet tidak punya ETH Sepolia | Minta dari faucet |
| `caller is not authorized relayer` | Address yang kirim bukan relayer | Cek RELAYER_PRIVATE_KEY di .env |
| `certificate already issued` | Kode unik sudah pernah di-issue | Normal, tidak perlu action |
| MetaMask "Wrong network" | Remix connect ke mainnet | Ganti ke Sepolia di MetaMask |
| Transaksi pending lama | Gas price terlalu rendah | Di MetaMask, edit gas → Speed Up |
