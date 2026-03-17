// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title PatientSovereignRecordVault
/// @notice Token-gated encrypted records vault for demo and hackathon use.
/// @dev Store only encrypted data keys on-chain. Raw files remain encrypted on IPFS.
contract PatientSovereignRecordVault {
    struct RecordMeta {
        address owner;
        string cid;
        bytes32 fileDigest;
        uint64 createdAt;
        bool exists;
    }

    // Wallet address => RSA-OAEP public key (SPKI bytes).
    mapping(address => bytes) private encryptionPublicKeys;

    // recordId => record metadata.
    mapping(uint256 => RecordMeta) private records;

    // recordId => wallet => access allowed.
    mapping(uint256 => mapping(address => bool)) private canRead;

    // recordId => wallet => wrapped AES data key.
    mapping(uint256 => mapping(address => bytes)) private wrappedDataKeys;

    event EncryptionPublicKeyRegistered(address indexed account);
    event RecordCreated(uint256 indexed recordId, address indexed owner, string cid, bytes32 fileDigest);
    event AccessGranted(uint256 indexed recordId, address indexed owner, address indexed grantee);
    event AccessRevoked(uint256 indexed recordId, address indexed owner, address indexed grantee);

    modifier onlyRecordOwner(uint256 recordId) {
        require(records[recordId].exists, "Record does not exist");
        require(records[recordId].owner == msg.sender, "Only record owner");
        _;
    }

    function setMyEncryptionPublicKey(bytes calldata spkiPublicKey) external {
        require(spkiPublicKey.length > 0, "Missing public key");
        encryptionPublicKeys[msg.sender] = spkiPublicKey;
        emit EncryptionPublicKeyRegistered(msg.sender);
    }

    function getEncryptionPublicKey(address account) external view returns (bytes memory) {
        return encryptionPublicKeys[account];
    }

    function createRecord(
        uint256 recordId,
        string calldata cid,
        bytes32 fileDigest,
        bytes calldata ownerWrappedKey
    ) external {
        require(!records[recordId].exists, "Record already exists");
        require(bytes(cid).length > 0, "Missing CID");
        require(ownerWrappedKey.length > 0, "Missing wrapped key");

        records[recordId] = RecordMeta({
            owner: msg.sender,
            cid: cid,
            fileDigest: fileDigest,
            createdAt: uint64(block.timestamp),
            exists: true
        });

        canRead[recordId][msg.sender] = true;
        wrappedDataKeys[recordId][msg.sender] = ownerWrappedKey;

        emit RecordCreated(recordId, msg.sender, cid, fileDigest);
    }

    function grantAccess(
        uint256 recordId,
        address grantee,
        bytes calldata wrappedDataKey
    ) external onlyRecordOwner(recordId) {
        require(grantee != address(0), "Invalid grantee");
        require(wrappedDataKey.length > 0, "Missing wrapped key");

        canRead[recordId][grantee] = true;
        wrappedDataKeys[recordId][grantee] = wrappedDataKey;

        emit AccessGranted(recordId, msg.sender, grantee);
    }

    function revokeAccess(uint256 recordId, address grantee) external onlyRecordOwner(recordId) {
        require(grantee != address(0), "Invalid grantee");
        require(grantee != msg.sender, "Owner access cannot be revoked");

        canRead[recordId][grantee] = false;
        delete wrappedDataKeys[recordId][grantee];

        emit AccessRevoked(recordId, msg.sender, grantee);
    }

    function hasRecordAccess(uint256 recordId, address account) external view returns (bool) {
        if (!records[recordId].exists) return false;
        return canRead[recordId][account];
    }

    function getWrappedDataKey(uint256 recordId, address account) external view returns (bytes memory) {
        require(records[recordId].exists, "Record does not exist");
        require(canRead[recordId][account], "No access");
        return wrappedDataKeys[recordId][account];
    }

    function getRecord(uint256 recordId) external view returns (RecordMeta memory) {
        require(records[recordId].exists, "Record does not exist");
        return records[recordId];
    }
}
