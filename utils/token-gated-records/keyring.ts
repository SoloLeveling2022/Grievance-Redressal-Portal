import type { Address, WalletEncryptionKeyPair } from "./types"

const STORAGE_PREFIX = "tg-records-rsa"

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

function storageKey(address: Address): string {
  return `${STORAGE_PREFIX}:${address.toLowerCase()}`
}

export async function createWalletEncryptionKeyPair(): Promise<WalletEncryptionKeyPair> {
  const pair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"],
  )

  const publicSpki = new Uint8Array(await crypto.subtle.exportKey("spki", pair.publicKey))
  const privatePkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey))

  return {
    publicKeySpkiBase64: bytesToBase64(publicSpki),
    privateKeyPkcs8Base64: bytesToBase64(privatePkcs8),
  }
}

export function saveWalletEncryptionKeyPair(address: Address, pair: WalletEncryptionKeyPair): void {
  localStorage.setItem(storageKey(address), JSON.stringify(pair))
}

export function readWalletEncryptionKeyPair(address: Address): WalletEncryptionKeyPair | null {
  const value = localStorage.getItem(storageKey(address))
  if (!value) return null
  return JSON.parse(value) as WalletEncryptionKeyPair
}

export async function encryptDataKeyForWallet(dataKeyRaw: Uint8Array, receiverPublicKeySpkiBase64: string): Promise<string> {
  const publicKey = await crypto.subtle.importKey(
    "spki",
    toArrayBuffer(base64ToBytes(receiverPublicKeySpkiBase64)),
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["encrypt"],
  )

  const wrapped = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, toArrayBuffer(dataKeyRaw))
  return bytesToBase64(new Uint8Array(wrapped))
}

export async function decryptDataKeyForWallet(wrappedDataKeyBase64: string, receiverPrivateKeyPkcs8Base64: string): Promise<Uint8Array> {
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    toArrayBuffer(base64ToBytes(receiverPrivateKeyPkcs8Base64)),
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["decrypt"],
  )

  const clear = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    toArrayBuffer(base64ToBytes(wrappedDataKeyBase64)),
  )

  return new Uint8Array(clear)
}
