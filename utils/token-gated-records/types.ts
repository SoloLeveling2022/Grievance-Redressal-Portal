export type Address = `0x${string}`

export type RecordId = bigint

export type BlockchainAuditDirection = "read" | "write"

export type BlockchainAuditStatus = "success" | "error"

export type BlockchainAuditEntry = {
  id: string
  timestampIso: string
  contractAddress: Address
  chainId?: number | string
  networkName?: string
  direction: BlockchainAuditDirection
  functionName: string
  args: unknown[]
  status: BlockchainAuditStatus
  txHash?: `0x${string}`
  result?: unknown
  error?: string
  footprint: Record<string, unknown>
}

export type BlockchainAuditLogger = (entry: BlockchainAuditEntry) => void | Promise<void>

export type EncryptedPayload = {
  cipherTextBase64: string
  ivBase64: string
  algorithm: "AES-GCM"
  mimeType: string
  fileName: string
  fileSize: number
}

export type RecordEnvelope = {
  recordId: RecordId
  cid: string
  fileDigestHex: `0x${string}`
  encryptedPayload: EncryptedPayload
  ownerWrappedKeyBase64: string
}

export type WalletEncryptionKeyPair = {
  publicKeySpkiBase64: string
  privateKeyPkcs8Base64: string
}

export type ChainReadAdapter = (functionName: string, args: unknown[]) => Promise<unknown>

export type ChainWriteAdapter = (functionName: string, args: unknown[]) => Promise<`0x${string}`>

export type TokenGatedClientConfig = {
  contractAddress: Address
  read: ChainReadAdapter
  write: ChainWriteAdapter
  chainId?: number | string
  networkName?: string
  auditLogger?: BlockchainAuditLogger
}
