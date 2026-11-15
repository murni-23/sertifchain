

## Struktur data (`struct`)

### `Certificate` — baris 29–37

`struct` adalah tipe data gabungan yang menyimpan beberapa nilai terkait dalam satu record.

| Field | Tipe | Tujuan |
|---|---|---|
| `certHash` | `bytes32` | Hash keccak256 dari data sertifikat; menjadi sidik jari digital sertifikat. |
| `studentName` | `string` | Nama siswa yang tercantum pada sertifikat. |
| `uniqueCode` | `string` | Kode unik yang menjadi kunci pencarian sertifikat. |
| `batchName` | `string` | Nama batch atau program siswa. |
| `issuedAt` | `uint256` | Waktu penerbitan dalam Unix timestamp. |
| `issuedBy` | `address` | Alamat yang memanggil fungsi penerbitan. |
| `isValid` | `bool` | Status aktif; `false` setelah sertifikat dibatalkan. |

## Variabel state

Variabel state disimpan di blockchain dan nilainya bertahan antar-transaksi.

| Baris | Variabel | Tujuan |
|---|---|---|
| 43 | `address public owner` | Alamat pemilik kontrak. Pengaturan `public` membuat Solidity menyediakan getter otomatis. |
| 44 | `address public relayer` | Wallet backend yang diizinkan menerbitkan sertifikat; owner juga diizinkan oleh `onlyRelayer`. |
| 47 | `mapping(string => Certificate) private certificates` | Menyimpan record sertifikat berdasarkan kode unik. `private` membatasi akses langsung dari kontrak lain, tetapi data blockchain tetap publik dan fungsi kontrak masih dapat membacanya. |
| 50 | `mapping(bytes32 => string) private hashToCode` | Memetakan hash sertifikat kembali ke kode unik agar pencarian berdasarkan hash dapat dilakukan. |
| 53 | `uint256 public totalIssued` | Jumlah penerbitan yang berhasil; bertambah saat penerbitan dan tidak berkurang saat sertifikat di-revoke. |

## Event

Event dicatat sebagai log transaksi. Aplikasi frontend/backend dapat mengamati log ini untuk mengetahui perubahan tanpa terus membaca seluruh state kontrak.

### `CertificateIssued` — baris 59–65

```solidity
event CertificateIssued(
    string  indexed uniqueCode,
    bytes32 indexed certHash,
    string  studentName,
    string  batchName,
    uint256 issuedAt
);
```

Event ini dicatat setelah sertifikat berhasil diterbitkan dan disimpan. Tujuannya agar aplikasi atau layanan pemantau dapat mengetahui bahwa sertifikat baru telah dibuat, beserta identitas kode, hash, nama siswa, batch, dan waktu penerbitannya. `indexed` pada `uniqueCode` dan `certHash` memungkinkan log difilter berdasarkan nilai tersebut; untuk `string` yang diindeks, nilai pada topik log disimpan sebagai hash.

### `CertificateRevoked` — baris 67–71

```solidity
event CertificateRevoked(
    string  indexed uniqueCode,
    bytes32 indexed certHash,
    address revokedBy
);
```

Event ini dicatat saat owner membatalkan sertifikat. Tujuannya sebagai rekam jejak bahwa sertifikat dengan kode dan hash tersebut telah dibatalkan, serta menunjukkan alamat yang melakukan pembatalan. Kode dan hash diindeks agar log dapat difilter berdasarkan sertifikat.

### `RelayerUpdated` — baris 73–76

```solidity
event RelayerUpdated(
    address indexed oldRelayer,
    address indexed newRelayer
);
```

Event ini dicatat saat owner mengganti alamat relayer. Tujuannya menyediakan rekam jejak pergantian wallet backend, sehingga aplikasi atau pemantau blockchain dapat mengetahui alamat relayer sebelum dan sesudah perubahan. Kedua alamat diindeks agar log mudah difilter.

## Modifier dan kontrol akses

Modifier adalah pemeriksaan atau perilaku yang dipasang sebelum badan fungsi dijalankan.

### `onlyOwner` — baris 82–85

- Baris 83: `require(msg.sender == owner, ...)` menghentikan transaksi jika pemanggil bukan owner. Pesan error menjelaskan alasannya.
- Baris 84: `_` menandai tempat badan fungsi yang menggunakan modifier dijalankan setelah pemeriksaan lolos.
- Digunakan oleh `revokeCertificate` dan `setRelayer`.

### `onlyRelayer` — baris 87–93

- Baris 88–91: memastikan pemanggil adalah `relayer` atau `owner`; selain itu transaksi gagal dengan pesan error.
- Baris 92: `_` menjalankan badan fungsi setelah otorisasi lolos.
- Digunakan oleh `issueCertificate`.

## Daftar fungsi

### `issueCertificate`

```solidity
function issueCertificate(
    string calldata _studentName,
    string calldata _uniqueCode,
    string calldata _batchName,
    uint256         _issuedAt
) external onlyRelayer returns (bytes32 certHash)
```

Fungsi ini digunakan untuk menerbitkan sertifikat ke blockchain. Parameter yang diterima adalah nama siswa (`_studentName`), kode unik (`_uniqueCode`), nama batch (`_batchName`), dan waktu klaim dalam Unix timestamp (`_issuedAt`). Fungsi hanya dapat dipanggil oleh relayer atau owner karena memakai `onlyRelayer`. Setelah data divalidasi dan disimpan, fungsi mengembalikan hash sertifikat bertipe `bytes32`.

### `revokeCertificate`

```solidity
function revokeCertificate(string calldata _uniqueCode)
    external
    onlyOwner
```

Fungsi ini digunakan owner untuk membatalkan sertifikat berdasarkan kode unik. Fungsi mengubah status `isValid` menjadi `false` dan mencatat pembatalan melalui event `CertificateRevoked`. Fungsi tidak menghapus data sertifikat dari blockchain dan tidak mengembalikan nilai.

### `setRelayer`

```solidity
function setRelayer(address _newRelayer) external onlyOwner
```

Fungsi ini digunakan owner untuk mengganti alamat wallet relayer. Parameter `_newRelayer` bertipe `address`. Alamat nol ditolak; jika valid, alamat baru disimpan dan perubahan dicatat melalui event `RelayerUpdated`. Fungsi tidak mengembalikan nilai.

### `verifyCertificate`

```solidity
function verifyCertificate(string calldata _uniqueCode)
    external
    view
    returns (
        bool    isValid,
        bytes32 certHash,
        string  memory studentName,
        string  memory batchName,
        uint256 issuedAt
    )
```

Fungsi ini digunakan untuk membaca sertifikat berdasarkan kode unik. Fungsi hanya membaca state (`view`), lalu mengembalikan status validitas, hash, nama siswa, nama batch, dan waktu penerbitan.

### `verifyByHash`

```solidity
function verifyByHash(bytes32 _certHash)
    external
    view
    returns (
        bool   isValid,
        string memory uniqueCode,
        string memory studentName,
        string memory batchName,
        uint256 issuedAt
    )
```

Fungsi ini digunakan untuk mencari dan membaca sertifikat menggunakan hash bertipe `bytes32`. Hasilnya mencakup status, kode unik, nama siswa, batch, dan waktu penerbitan. Fungsi gagal jika hash tidak ditemukan.

### `computeHash`

```solidity
function computeHash(
    string calldata _studentName,
    string calldata _uniqueCode,
    string calldata _batchName,
    uint256         _issuedAt
) external pure returns (bytes32)
```

Fungsi ini digunakan untuk menghitung hash dari nama siswa, kode unik, batch, dan waktu penerbitan tanpa membaca atau mengubah state kontrak (`pure`). Hasil perhitungan bertipe `bytes32`.

### `isCertificateIssued`

```solidity
function isCertificateIssued(string calldata _uniqueCode)
    external
    view
    returns (bool)
```

Fungsi ini digunakan untuk memeriksa apakah kode unik saat ini memiliki sertifikat berstatus valid. Hasilnya `true` atau `false`.

### Constructor

Blok constructor di file saat ini belum memiliki deklarasi fungsi. Berdasarkan parameter yang dijelaskan komentarnya dan isi blok, deklarasi yang dimaksud kemungkinan:

```solidity
constructor(address _relayer) {
    // isi constructor yang ada pada file
}
```

Constructor dijalankan satu kali saat kontrak di-deploy. Parameter `_relayer` bertipe `address`; constructor memeriksa agar alamatnya bukan alamat nol, menetapkan deployer sebagai `owner`, dan menyimpan alamat tersebut sebagai relayer.

Pada potongan di atas, `string calldata` berarti parameter string diterima sebagai data input untuk fungsi eksternal. `external` menandakan fungsi dapat dipanggil dari luar kontrak. `view` berarti hanya membaca state, sedangkan `pure` berarti tidak membaca maupun mengubah state. `onlyOwner` dan `onlyRelayer` membatasi siapa yang boleh memanggil fungsi.
