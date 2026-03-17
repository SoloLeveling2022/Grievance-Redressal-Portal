// ABI for PatientSovereignRecordVault.sol
export const PATIENT_SOVEREIGN_RECORD_VAULT_ABI = [
  {
    type: "function",
    name: "setMyEncryptionPublicKey",
    stateMutability: "nonpayable",
    inputs: [{ name: "spkiPublicKey", type: "bytes" }],
    outputs: [],
  },
  {
    type: "function",
    name: "getEncryptionPublicKey",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "bytes" }],
  },
  {
    type: "function",
    name: "createRecord",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recordId", type: "uint256" },
      { name: "cid", type: "string" },
      { name: "fileDigest", type: "bytes32" },
      { name: "ownerWrappedKey", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "grantAccess",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recordId", type: "uint256" },
      { name: "grantee", type: "address" },
      { name: "wrappedDataKey", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "revokeAccess",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recordId", type: "uint256" },
      { name: "grantee", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "hasRecordAccess",
    stateMutability: "view",
    inputs: [
      { name: "recordId", type: "uint256" },
      { name: "account", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "getWrappedDataKey",
    stateMutability: "view",
    inputs: [
      { name: "recordId", type: "uint256" },
      { name: "account", type: "address" },
    ],
    outputs: [{ name: "", type: "bytes" }],
  },
  {
    type: "function",
    name: "getRecord",
    stateMutability: "view",
    inputs: [{ name: "recordId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "owner", type: "address" },
          { name: "cid", type: "string" },
          { name: "fileDigest", type: "bytes32" },
          { name: "createdAt", type: "uint64" },
          { name: "exists", type: "bool" },
        ],
      },
    ],
  },
] as const
