// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║              SertifChain Smart Contract                  ║
 * ║          Verifikasi Keaslian Sertifikat Digital          ║
 * ║                  Ethereum Sepolia Testnet                ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * Cara kerja:
 * 1. Admin backend (relayer) memanggil issueCertificate() saat
 *    siswa klaim sertifikat di web.
 * 2. Hash dari data sertifikat (nama + kode + tanggal) disimpan
 *    on-chain secara permanen.
 * 3. Siapapun bisa verifikasi keaslian dengan memanggil
 *    verifyCertificate() — tanpa perlu wallet.
 *
 * Siswa TIDAK perlu MetaMask atau wallet apapun.
 * Gas dibayar oleh wallet admin (relayer).
 */

contract SertifChain {

    // ═══════════════════════════════════════════════
    // STRUCTS & TYPES
    // ═══════════════════════════════════════════════

    struct Certificate {
       bytes32  certHash;       // keccak256(studentName + uniqueCode + batchName + issuedAt)
        string   studentName;   // nama siswa
        string   uniqueCode;    // kode unik dari sistem
        string   batchName;     // nama batch/program
        uint256  issuedAt;      // timestamp saat diklaim (Unix)
        address  issuedBy;      // address relayer yang issue
        bool     isValid;       // bisa di-revoke oleh owner jika ada kesalahan
    }

    // ═══════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════

    address public owner;
    address public relayer; // wallet backend yang boleh issue sertifikat

    // uniqueCode => Certificate
    mapping(string => Certificate) private certificates;

    // certHash => uniqueCode (untuk lookup by hash)
    mapping(bytes32 => string) private hashToCode;

    // Total sertifikat yang diterbitkan
    uint256 public totalIssued;

    // ═══════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════

    event CertificateIssued(
        string  indexed uniqueCode,
        bytes32 indexed certHash,
        string  studentName,
        string  batchName,
        uint256 issuedAt
    );

    event CertificateRevoked(
        string  indexed uniqueCode,
        bytes32 indexed certHash,
        address revokedBy
    );

    event RelayerUpdated(
        address indexed oldRelayer,
        address indexed newRelayer
    );

    // ═══════════════════════════════════════════════
    // MODIFIERS
    // ═══════════════════════════════════════════════

    modifier onlyOwner() {
        require(msg.sender == owner, "SertifChain: caller is not owner");
        _;
    }

    modifier onlyRelayer() {
        require(
            msg.sender == relayer || msg.sender == owner,
            "SertifChain: caller is not authorized relayer"
        );
        _;
    }

    // ═══════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════

    /**
     * @param _relayer Address wallet backend/admin yang akan
     *                 memanggil issueCertificate() secara otomatis.
     *                 Bisa diubah nanti via setRelayer().
     */
    {
        require(_relayer != address(0), "SertifChain: relayer cannot be zero address");
        owner   = msg.sender;
        relayer = _relayer;
    }

    // ═══════════════════════════════════════════════
    // WRITE FUNCTIONS (hanya relayer/owner)
    // ═══════════════════════════════════════════════

    /**
     * @notice Terbitkan sertifikat on-chain saat siswa klaim.
     * @dev Dipanggil otomatis oleh backend Next.js (relayer wallet).
     *
     * @param _studentName  Nama siswa (exact, case-sensitive)
     * @param _uniqueCode   Kode unik 8 karakter dari sistem
     * @param _batchName    Nama batch/program
     * @param _issuedAt     Unix timestamp saat klaim (dari backend)
     */
    function issueCertificate(
        string calldata _studentName,
        string calldata _uniqueCode,
        string calldata _batchName,
        uint256         _issuedAt
    ) external onlyRelayer returns (bytes32 certHash) {
        // Pastikan kode unik belum pernah digunakan
        require(
            !certificates[_uniqueCode].isValid,
            "SertifChain: certificate already issued for this code"
        );
        require(bytes(_uniqueCode).length > 0,   "SertifChain: uniqueCode cannot be empty");
        require(bytes(_studentName).length > 0,  "SertifChain: studentName cannot be empty");

        // Hitung hash dari data sertifikat
        certHash = keccak256(
            abi.encodePacked(
                _stu constructor(address _relayer)dentName,
                _uniqueCode,
                _batchName,
                _issuedAt
            )
        );

        // Simpan ke mapping
        certificates[_uniqueCode] = Certificate({
            certHash:    certHash,
            studentName: _studentName,
            uniqueCode:  _uniqueCode,
            batchName:   _batchName,
            issuedAt:    _issuedAt,
            issuedBy:    msg.sender,
            isValid:     true
        });

        hashToCode[certHash] = _uniqueCode;
        totalIssued++;

        emit CertificateIssued(
            _uniqueCode,
            certHash,
            _studentName,
            _batchName,
            _issuedAt
        );

        return certHash;
    }

    /**
     * @notice Revoke (batalkan) sertifikat jika ada kesalahan data.
     * @dev Hanya owner yang bisa revoke.
     */
    function revokeCertificate(string calldata _uniqueCode)
        external
        onlyOwner
    {
        require(
            certificates[_uniqueCode].isValid,
            "SertifChain: certificate not found or already revoked"
        );

        bytes32 hash = certificates[_uniqueCode].certHash;
        certificates[_uniqueCode].isValid = false;

        emit CertificateRevoked(_uniqueCode, hash, msg.sender);
    }

    /**
     * @notice Update address relayer (misal ganti wallet backend).
     */
    function setRelayer(address _newRelayer) external onlyOwner {
        require(_newRelayer != address(0), "SertifChain: zero address");
        emit RelayerUpdated(relayer, _newRelayer);
        relayer = _newRelayer;
    }

    // ═══════════════════════════════════════════════
    // READ FUNCTIONS (public, tanpa gas)
    // ═══════════════════════════════════════════════

    /**
     * @notice Verifikasi sertifikat berdasarkan kode unik.
     * @return isValid    true jika sertifikat sah & belum di-revoke
     * @return certHash   hash on-chain sertifikat
     * @return studentName nama siswa
     * @return batchName  nama batch
     * @return issuedAt   timestamp klaim
     */
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
    {
        Certificate storage cert = certificates[_uniqueCode];
        return (
            cert.isValid,
            cert.certHash,
            cert.studentName,
            cert.batchName,
            cert.issuedAt
        );
    }

    /**
     * @notice Verifikasi berdasarkan hash (untuk double-check).
     * @dev Berguna jika user punya hash tapi tidak punya kode unik.
     */
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
    {
        string memory code = hashToCode[_certHash];
        require(bytes(code).length > 0, "SertifChain: hash not found");

        Certificate storage cert = certificates[code];
        return (
            cert.isValid,
            cert.uniqueCode,
            cert.studentName,
            cert.batchName,
            cert.issuedAt
        );
    }

    /**
     * @notice Hitung hash dari data sertifikat (helper untuk frontend).
     * @dev Gunakan ini untuk verifikasi mandiri tanpa memanggil kontrak.
     */
    function computeHash(
        string calldata _studentName,
        string calldata _uniqueCode,
        string calldata _batchName,
        uint256         _issuedAt
    ) external pure returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                _studentName,
                _uniqueCode,
                _batchName,
                _issuedAt
            )
        );
    }

    /**
     * @notice Cek apakah kode unik sudah pernah diterbitkan.
     */
    function isCertificateIssued(string calldata _uniqueCode)
        external
        view
        returns (bool)
    {
        return certificates[_uniqueCode].isValid;
    }
}
