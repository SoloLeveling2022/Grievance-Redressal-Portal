import type { Address, RecordId, TokenGatedClientConfig } from "./types"

function bytesToHex(bytes: Uint8Array): `0x${string}` {
  return (`0x${Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`) as `0x${string}`
}

function hexToBytes(hex: `0x${string}`): Uint8Array {
  const stripped = hex.slice(2)
  const bytes = new Uint8Array(stripped.length / 2)
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(stripped.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ""
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export function createTokenGatedRecordsClient(config: TokenGatedClientConfig) {
  const { read, write } = config

  return {
    async setMyEncryptionPublicKey(spkiPublicKeyBase64: string): Promise<`0x${string}`> {
      return write("setMyEncryptionPublicKey", [bytesToHex(base64ToBytes(spkiPublicKeyBase64))])
    },

    async getEncryptionPublicKey(account: Address): Promise<string> {
      const result = (await read("getEncryptionPublicKey", [account])) as `0x${string}`
      return bytesToBase64(hexToBytes(result))
    },

    async createRecord(params: {
      recordId: RecordId
      cid: string
      fileDigestHex: `0x${string}`
      ownerWrappedKeyBase64: string
    }): Promise<`0x${string}`> {
      return write("createRecord", [
        params.recordId,
        params.cid,
        params.fileDigestHex,
        bytesToHex(base64ToBytes(params.ownerWrappedKeyBase64)),
      ])
    },

    async grantAccess(recordId: RecordId, grantee: Address, wrappedDataKeyBase64: string): Promise<`0x${string}`> {
      return write("grantAccess", [recordId, grantee, bytesToHex(base64ToBytes(wrappedDataKeyBase64))])
    },

    async revokeAccess(recordId: RecordId, grantee: Address): Promise<`0x${string}`> {
      return write("revokeAccess", [recordId, grantee])
    },

    async hasRecordAccess(recordId: RecordId, account: Address): Promise<boolean> {
      return (await read("hasRecordAccess", [recordId, account])) as boolean
    },

    async getWrappedDataKey(recordId: RecordId, account: Address): Promise<string> {
      const result = (await read("getWrappedDataKey", [recordId, account])) as `0x${string}`
      return bytesToBase64(hexToBytes(result))
    },

    async getRecord(recordId: RecordId): Promise<{
      owner: Address
      cid: string
      fileDigest: `0x${string}`
      createdAt: bigint
      exists: boolean
    }> {
      const result = (await read("getRecord", [recordId])) as {
        owner: Address
        cid: string
        fileDigest: `0x${string}`
        createdAt: bigint
        exists: boolean
      }
      return result
    },
  }
}
