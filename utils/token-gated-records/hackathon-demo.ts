import {
  buildGrantForSecondOpinion,
  createTokenGatedRecordsClient,
  decryptRecordForViewer,
  prepareEncryptedRecordForUpload,
  readWalletEncryptionKeyPair,
  saveWalletEncryptionKeyPair,
  createWalletEncryptionKeyPair,
  type Address,
  type TokenGatedClientConfig,
} from "./index"

// This file is intentionally framework-agnostic so integration is only a few lines.

export async function ensureWalletKeyPair(address: Address): Promise<{ publicKeySpkiBase64: string; privateKeyPkcs8Base64: string }> {
  const existing = readWalletEncryptionKeyPair(address)
  if (existing) return existing
  const created = await createWalletEncryptionKeyPair()
  saveWalletEncryptionKeyPair(address, created)
  return created
}

export async function createEncryptedRecordAndPublish(params: {
  file: File
  citizenAddress: Address
  uploadEncryptedBlob: (blob: Blob, nameHint: string) => Promise<{ cid: string }>
  clientConfig: TokenGatedClientConfig
}): Promise<{ recordId: bigint; cid: string; txHash: `0x${string}` }> {
  const keyPair = await ensureWalletKeyPair(params.citizenAddress)

  const { envelope, encryptedFileBlob } = await prepareEncryptedRecordForUpload({
    file: params.file,
    ownerWalletPublicKeySpkiBase64: keyPair.publicKeySpkiBase64,
  })

  const uploaded = await params.uploadEncryptedBlob(encryptedFileBlob, `${params.file.name}.encrypted.json`)
  const client = createTokenGatedRecordsClient(params.clientConfig)

  const txHash = await client.createRecord({
    recordId: envelope.recordId,
    cid: uploaded.cid,
    fileDigestHex: envelope.fileDigestHex,
    ownerWrappedKeyBase64: envelope.ownerWrappedKeyBase64,
  })

  return { recordId: envelope.recordId, cid: uploaded.cid, txHash }
}

export async function grantSecondOpinionAccess(params: {
  recordId: bigint
  citizenAddress: Address
  officerAddress: Address
  clientConfig: TokenGatedClientConfig
}): Promise<`0x${string}`> {
  const client = createTokenGatedRecordsClient(params.clientConfig)

  const citizenKeys = await ensureWalletKeyPair(params.citizenAddress)
  const officerPubKey = await client.getEncryptionPublicKey(params.officerAddress)
  const ownerWrappedDataKey = await client.getWrappedDataKey(params.recordId, params.citizenAddress)

  const wrappedForOfficer = await buildGrantForSecondOpinion({
    dataKeyOwnerWrappedBase64: ownerWrappedDataKey,
    ownerPrivateKeyPkcs8Base64: citizenKeys.privateKeyPkcs8Base64,
    granteeWalletPublicKeySpkiBase64: officerPubKey,
  })

  return client.grantAccess(params.recordId, params.officerAddress, wrappedForOfficer)
}

export async function openRecordAsViewer(params: {
  viewerAddress: Address
  recordId: bigint
  encryptedPayloadJson: string
  clientConfig: TokenGatedClientConfig
}): Promise<Uint8Array> {
  const viewerKeyPair = await ensureWalletKeyPair(params.viewerAddress)
  const client = createTokenGatedRecordsClient(params.clientConfig)

  const wrappedDataKey = await client.getWrappedDataKey(params.recordId, params.viewerAddress)

  return decryptRecordForViewer({
    encryptedPayload: JSON.parse(params.encryptedPayloadJson),
    wrappedDataKeyBase64: wrappedDataKey,
    viewerPrivateKeyPkcs8Base64: viewerKeyPair.privateKeyPkcs8Base64,
  })
}
