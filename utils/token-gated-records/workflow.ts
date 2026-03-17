import {
  decryptFileWithAesGcm,
  encryptFileWithAesGcm,
  generateDataEncryptionKey,
  randomRecordId,
  sha256Hex,
} from "./crypto"
import {
  decryptDataKeyForWallet,
  encryptDataKeyForWallet,
} from "./keyring"
import type { Address, RecordEnvelope } from "./types"

export async function prepareEncryptedRecordForUpload(input: {
  file: File
  ownerWalletPublicKeySpkiBase64: string
}): Promise<{
  envelope: RecordEnvelope
  encryptedFileBlob: Blob
}> {
  const { file, ownerWalletPublicKeySpkiBase64 } = input

  const recordId = randomRecordId()
  const dataKeyRaw = generateDataEncryptionKey()
  const encryptedPayload = await encryptFileWithAesGcm(file, dataKeyRaw)

  const fileDigestHex = await sha256Hex(new Uint8Array(await file.arrayBuffer()))
  const ownerWrappedKeyBase64 = await encryptDataKeyForWallet(dataKeyRaw, ownerWalletPublicKeySpkiBase64)

  const encryptedFileBlob = new Blob([JSON.stringify(encryptedPayload)], {
    type: "application/vnd.citiconnect.encrypted-record+json",
  })

  return {
    envelope: {
      recordId,
      cid: "",
      fileDigestHex,
      encryptedPayload,
      ownerWrappedKeyBase64,
    },
    encryptedFileBlob,
  }
}

export async function decryptRecordForViewer(input: {
  encryptedPayload: RecordEnvelope["encryptedPayload"]
  wrappedDataKeyBase64: string
  viewerPrivateKeyPkcs8Base64: string
}): Promise<Uint8Array> {
  const dataKeyRaw = await decryptDataKeyForWallet(input.wrappedDataKeyBase64, input.viewerPrivateKeyPkcs8Base64)
  return decryptFileWithAesGcm(input.encryptedPayload, dataKeyRaw)
}

export async function buildGrantForSecondOpinion(input: {
  dataKeyOwnerWrappedBase64: string
  ownerPrivateKeyPkcs8Base64: string
  granteeWalletPublicKeySpkiBase64: string
}): Promise<string> {
  const clearDataKey = await decryptDataKeyForWallet(
    input.dataKeyOwnerWrappedBase64,
    input.ownerPrivateKeyPkcs8Base64,
  )

  return encryptDataKeyForWallet(clearDataKey, input.granteeWalletPublicKeySpkiBase64)
}

export function cidToGatewayUrl(cid: string, gatewayBase = "https://gateway.pinata.cloud/ipfs/"): string {
  return `${gatewayBase}${cid}`
}

export function normalizeAddress(value: string): Address {
  return value.toLowerCase() as Address
}
