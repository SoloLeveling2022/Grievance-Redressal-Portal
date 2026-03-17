import type { EncryptedPayload } from "./types"

const AES_KEY_BYTES = 32

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
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

function toHex(bytes: Uint8Array): `0x${string}` {
  return (`0x${Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`) as `0x${string}`
}

export function randomRecordId(): bigint {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  const view = new DataView(bytes.buffer)
  const hi = BigInt(view.getUint32(0, false))
  const lo = BigInt(view.getUint32(4, false))
  return (hi << BigInt(32)) + lo
}

export function generateDataEncryptionKey(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(AES_KEY_BYTES))
}

export async function sha256Hex(input: Uint8Array): Promise<`0x${string}`> {
  const digest = await crypto.subtle.digest("SHA-256", toArrayBuffer(input))
  return toHex(new Uint8Array(digest))
}

export async function encryptFileWithAesGcm(file: File, dataKeyRaw: Uint8Array): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const clearBytes = new Uint8Array(await file.arrayBuffer())

  const aesKey = await crypto.subtle.importKey("raw", toArrayBuffer(dataKeyRaw), "AES-GCM", false, ["encrypt"])
  const cipherBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, aesKey, toArrayBuffer(clearBytes))
  const cipherBytes = new Uint8Array(cipherBuffer)

  return {
    cipherTextBase64: bytesToBase64(cipherBytes),
    ivBase64: bytesToBase64(iv),
    algorithm: "AES-GCM",
    mimeType: file.type || "application/octet-stream",
    fileName: file.name,
    fileSize: file.size,
  }
}

export async function decryptFileWithAesGcm(payload: EncryptedPayload, dataKeyRaw: Uint8Array): Promise<Uint8Array> {
  const iv = base64ToBytes(payload.ivBase64)
  const cipherBytes = base64ToBytes(payload.cipherTextBase64)

  const aesKey = await crypto.subtle.importKey("raw", toArrayBuffer(dataKeyRaw), "AES-GCM", false, ["decrypt"])
  const clearBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    aesKey,
    toArrayBuffer(cipherBytes),
  )
  return new Uint8Array(clearBuffer)
}

export function serializeEncryptedPayload(payload: EncryptedPayload): string {
  return JSON.stringify(payload)
}

export function deserializeEncryptedPayload(serialized: string): EncryptedPayload {
  return JSON.parse(serialized) as EncryptedPayload
}

export function dataKeyToBase64(dataKeyRaw: Uint8Array): string {
  return bytesToBase64(dataKeyRaw)
}

export function dataKeyFromBase64(value: string): Uint8Array {
  return base64ToBytes(value)
}
