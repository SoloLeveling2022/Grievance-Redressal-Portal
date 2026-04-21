import type { Address, BlockchainAuditEntry, RecordId, TokenGatedClientConfig } from "./types"

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
  const { read, write, auditLogger, chainId, networkName, contractAddress } = config

  function toSafeAuditValue(value: unknown): unknown {
    if (typeof value === "bigint") return value.toString()
    if (Array.isArray(value)) return value.map((item) => toSafeAuditValue(item))
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, nested]) => [key, toSafeAuditValue(nested)]),
      )
    }
    return value
  }

  function stringifyError(error: unknown): string {
    if (error instanceof Error) return error.message
    return typeof error === "string" ? error : "Unknown error"
  }

  async function emitAuditLog(entry: Omit<BlockchainAuditEntry, "id" | "timestampIso" | "contractAddress" | "chainId" | "networkName">) {
    if (!auditLogger) return

    const auditEntry: BlockchainAuditEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      timestampIso: new Date().toISOString(),
      contractAddress,
      chainId,
      networkName,
      direction: entry.direction,
      functionName: entry.functionName,
      args: toSafeAuditValue(entry.args) as unknown[],
      status: entry.status,
      txHash: entry.txHash,
      result: toSafeAuditValue(entry.result),
      error: entry.error,
      footprint: toSafeAuditValue(entry.footprint) as Record<string, unknown>,
    }

    await auditLogger(auditEntry)
  }

  return {
    async setMyEncryptionPublicKey(spkiPublicKeyBase64: string): Promise<`0x${string}`> {
      const args = [bytesToHex(base64ToBytes(spkiPublicKeyBase64))]
      try {
        const txHash = await write("setMyEncryptionPublicKey", args)
        await emitAuditLog({
          direction: "write",
          functionName: "setMyEncryptionPublicKey",
          args,
          status: "success",
          txHash,
          footprint: { wrappedPublicKeyHexLength: args[0].length },
        })
        return txHash
      } catch (error) {
        await emitAuditLog({
          direction: "write",
          functionName: "setMyEncryptionPublicKey",
          args,
          status: "error",
          error: stringifyError(error),
          footprint: { wrappedPublicKeyHexLength: args[0].length },
        })
        throw error
      }
    },

    async getEncryptionPublicKey(account: Address): Promise<string> {
      const args: unknown[] = [account]
      try {
        const result = (await read("getEncryptionPublicKey", args)) as `0x${string}`
        await emitAuditLog({
          direction: "read",
          functionName: "getEncryptionPublicKey",
          args,
          status: "success",
          result,
          footprint: { account },
        })
        return bytesToBase64(hexToBytes(result))
      } catch (error) {
        await emitAuditLog({
          direction: "read",
          functionName: "getEncryptionPublicKey",
          args,
          status: "error",
          error: stringifyError(error),
          footprint: { account },
        })
        throw error
      }
    },

    async createRecord(params: {
      recordId: RecordId
      cid: string
      fileDigestHex: `0x${string}`
      ownerWrappedKeyBase64: string
    }): Promise<`0x${string}`> {
      const args = [
        params.recordId,
        params.cid,
        params.fileDigestHex,
        bytesToHex(base64ToBytes(params.ownerWrappedKeyBase64)),
      ]

      try {
        const txHash = await write("createRecord", args)
        await emitAuditLog({
          direction: "write",
          functionName: "createRecord",
          args,
          status: "success",
          txHash,
          footprint: {
            recordId: params.recordId,
            cid: params.cid,
            fileDigestHex: params.fileDigestHex,
            wrappedKeyHexLength: String(args[3]).length,
          },
        })
        return txHash
      } catch (error) {
        await emitAuditLog({
          direction: "write",
          functionName: "createRecord",
          args,
          status: "error",
          error: stringifyError(error),
          footprint: {
            recordId: params.recordId,
            cid: params.cid,
            fileDigestHex: params.fileDigestHex,
          },
        })
        throw error
      }
    },

    async grantAccess(recordId: RecordId, grantee: Address, wrappedDataKeyBase64: string): Promise<`0x${string}`> {
      const args = [recordId, grantee, bytesToHex(base64ToBytes(wrappedDataKeyBase64))]
      try {
        const txHash = await write("grantAccess", args)
        await emitAuditLog({
          direction: "write",
          functionName: "grantAccess",
          args,
          status: "success",
          txHash,
          footprint: {
            recordId,
            grantee,
            wrappedKeyHexLength: String(args[2]).length,
          },
        })
        return txHash
      } catch (error) {
        await emitAuditLog({
          direction: "write",
          functionName: "grantAccess",
          args,
          status: "error",
          error: stringifyError(error),
          footprint: { recordId, grantee },
        })
        throw error
      }
    },

    async revokeAccess(recordId: RecordId, grantee: Address): Promise<`0x${string}`> {
      const args: unknown[] = [recordId, grantee]
      try {
        const txHash = await write("revokeAccess", args)
        await emitAuditLog({
          direction: "write",
          functionName: "revokeAccess",
          args,
          status: "success",
          txHash,
          footprint: { recordId, grantee },
        })
        return txHash
      } catch (error) {
        await emitAuditLog({
          direction: "write",
          functionName: "revokeAccess",
          args,
          status: "error",
          error: stringifyError(error),
          footprint: { recordId, grantee },
        })
        throw error
      }
    },

    async hasRecordAccess(recordId: RecordId, account: Address): Promise<boolean> {
      const args: unknown[] = [recordId, account]
      try {
        const result = (await read("hasRecordAccess", args)) as boolean
        await emitAuditLog({
          direction: "read",
          functionName: "hasRecordAccess",
          args,
          status: "success",
          result,
          footprint: { recordId, account },
        })
        return result
      } catch (error) {
        await emitAuditLog({
          direction: "read",
          functionName: "hasRecordAccess",
          args,
          status: "error",
          error: stringifyError(error),
          footprint: { recordId, account },
        })
        throw error
      }
    },

    async getWrappedDataKey(recordId: RecordId, account: Address): Promise<string> {
      const args: unknown[] = [recordId, account]
      try {
        const result = (await read("getWrappedDataKey", args)) as `0x${string}`
        await emitAuditLog({
          direction: "read",
          functionName: "getWrappedDataKey",
          args,
          status: "success",
          result,
          footprint: { recordId, account, wrappedKeyHexLength: result.length },
        })
        return bytesToBase64(hexToBytes(result))
      } catch (error) {
        await emitAuditLog({
          direction: "read",
          functionName: "getWrappedDataKey",
          args,
          status: "error",
          error: stringifyError(error),
          footprint: { recordId, account },
        })
        throw error
      }
    },

    async getRecord(recordId: RecordId): Promise<{
      owner: Address
      cid: string
      fileDigest: `0x${string}`
      createdAt: bigint
      exists: boolean
    }> {
      const args: unknown[] = [recordId]
      try {
        const result = (await read("getRecord", args)) as {
          owner: Address
          cid: string
          fileDigest: `0x${string}`
          createdAt: bigint
          exists: boolean
        }
        await emitAuditLog({
          direction: "read",
          functionName: "getRecord",
          args,
          status: "success",
          result,
          footprint: {
            recordId,
            owner: result.owner,
            cid: result.cid,
            createdAt: result.createdAt,
            exists: result.exists,
          },
        })
        return result
      } catch (error) {
        await emitAuditLog({
          direction: "read",
          functionName: "getRecord",
          args,
          status: "error",
          error: stringifyError(error),
          footprint: { recordId },
        })
        throw error
      }
    },
  }
}
