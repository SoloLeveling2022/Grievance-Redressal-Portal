# Token-Gated Encrypted Records (Hackathon/Demo Guide)

This module is fully isolated from the current app and is designed to be integrated later with only a few lines.

Folder: `utils/token-gated-records`

## What This Module Solves

- Files are encrypted in browser before upload.
- Only wallets with granted access can decrypt.
- Access grant/revoke is controlled on-chain.
- No re-upload needed to share for second opinion.

## Free Stack (Demo Friendly)

- Wallet: MetaMask
- Network: Polygon Amoy testnet (free testnet MATIC)
- Contract deploy: Remix IDE (free)
- Storage: Pinata free tier or any IPFS gateway
- Frontend chain calls: `ethers` or `viem` (you can add later)

## Files You Will Use

- Contract: `utils/token-gated-records/contracts/PatientSovereignRecordVault.sol`
- Core client: `utils/token-gated-records/client.ts`
- Crypto: `utils/token-gated-records/crypto.ts`, `utils/token-gated-records/keyring.ts`
- Workflows: `utils/token-gated-records/workflow.ts`, `utils/token-gated-records/hackathon-demo.ts`
- Exports: `utils/token-gated-records/index.ts`

## End-to-End Stages

1. Wallet key registration
2. Citizen encrypts file locally
3. Encrypted blob is uploaded to IPFS
4. Citizen anchors record metadata + wrapped key on-chain
5. Officer requests access
6. Citizen grants access on-chain (no file re-upload)
7. Officer fetches wrapped key + encrypted payload and decrypts locally
8. Citizen can revoke access anytime on-chain

## Architecture Snapshot

- Raw file never goes on-chain.
- Encrypted payload JSON goes to IPFS.
- Smart contract stores:
  - CID
  - file digest hash
  - wrapped AES data keys per authorized wallet

## Step 1: Deploy Contract (One Time)

1. Open Remix.
2. Paste `PatientSovereignRecordVault.sol`.
3. Compile with Solidity `0.8.20`.
4. Deploy on Polygon Amoy from MetaMask.
5. Copy deployed contract address.

Keep this address in your app env later, for example:

```bash
NEXT_PUBLIC_RECORD_VAULT_ADDRESS=0xYourContractAddress
```

## Step 2: Add Chain Adapter (Few Lines)

This module expects 2 adapters only:

- `read(functionName, args)`
- `write(functionName, args)`

Example shape:

```ts
import { createTokenGatedRecordsClient } from "@/utils/token-gated-records"

const client = createTokenGatedRecordsClient({
  contractAddress: "0x...", // vault address
  read: async (fn, args) => {
    // call contract read using your viem/ethers wrapper
    return await readContract(fn, args)
  },
  write: async (fn, args) => {
    // call contract write using wallet signer
    return await writeContract(fn, args)
  },
})
```

To capture full blockchain footprints (timestamp, function, args, tx hash, result/error) for PDF export:

```ts
import { createBrowserAuditLogger } from "@/utils/token-gated-records"

const client = createTokenGatedRecordsClient({
  contractAddress: "0x...",
  chainId: 80002,
  networkName: "Polygon Amoy",
  read: yourReadAdapter,
  write: yourWriteAdapter,
  auditLogger: createBrowserAuditLogger({ module: "token-gated-records" }),
})
```

The records UI can export these logs to PDF using `downloadBlockchainAuditLogsPdf()`.

## Citizen Side Integration (Step by Step)

Suggested page: `app/citizen/records/page.tsx`

### Citizen Stage A: Ensure wallet encryption keypair

```ts
import { ensureWalletKeyPair } from "@/utils/token-gated-records"

const citizenKeys = await ensureWalletKeyPair(citizenAddress)
```

This creates RSA keys in local storage once per wallet and reuses them later.

### Citizen Stage B: Encrypt + upload + publish record

```ts
import { createEncryptedRecordAndPublish } from "@/utils/token-gated-records"

const result = await createEncryptedRecordAndPublish({
  file,
  citizenAddress,
  uploadEncryptedBlob: async (blob, nameHint) => {
    // Use your existing IPFS upload endpoint here
    // return { cid: "Qm..." }
    return uploadToIpfs(blob, nameHint)
  },
  clientConfig,
})

// result => { recordId, cid, txHash }
```

Store `recordId` and `cid` in your DB/local metadata for list rendering.

### Citizen Stage C: Grant officer second-opinion access

```ts
import { grantSecondOpinionAccess } from "@/utils/token-gated-records"

await grantSecondOpinionAccess({
  recordId,
  citizenAddress,
  officerAddress,
  clientConfig,
})
```

No re-encryption and no re-upload required.

### Citizen Stage D: Revoke access anytime

```ts
const client = createTokenGatedRecordsClient(clientConfig)
await client.revokeAccess(recordId, officerAddress)
```

## Officer Side Integration (Step by Step)

Suggested page: `app/officers/patients/page.tsx` or `app/officers/dashboard/page.tsx`

### Officer Stage A: Register officer wallet public key once

```ts
import { ensureWalletKeyPair, createTokenGatedRecordsClient } from "@/utils/token-gated-records"

const officerKeys = await ensureWalletKeyPair(officerAddress)
const client = createTokenGatedRecordsClient(clientConfig)
await client.setMyEncryptionPublicKey(officerKeys.publicKeySpkiBase64)
```

### Officer Stage B: Check access before opening record

```ts
const canOpen = await client.hasRecordAccess(recordId, officerAddress)
if (!canOpen) throw new Error("Access not granted")
```

### Officer Stage C: Fetch encrypted payload + decrypt locally

```ts
import { openRecordAsViewer } from "@/utils/token-gated-records"

const encryptedPayloadJson = await fetchEncryptedPayloadJsonByCid(cid) // from IPFS
const clearBytes = await openRecordAsViewer({
  viewerAddress: officerAddress,
  recordId,
  encryptedPayloadJson,
  clientConfig,
})

// Convert clearBytes to Blob/File for preview or download
```

## Minimal UI Flow You Can Add Later

### Citizen UI actions

1. Connect wallet
2. Upload record
3. Encrypt and publish
4. See record list with `recordId`
5. Grant access by entering officer wallet
6. Revoke from granted list

### Officer UI actions

1. Connect wallet
2. Register encryption key (one-time)
3. Open assigned records list
4. Click "Open Record"
5. Decrypt and view locally

## Data Model You Can Keep in Your App DB

```ts
type AppRecordMeta = {
  recordId: string
  cid: string
  ownerWallet: string
  createdAt: string
  title: string
  mimeType: string
  grantedTo: string[]
}
```

## Security Notes (Important)

- Demo stores private keys in browser localStorage for simplicity.
- For production, move key management to secure wallet/key-agent flows.
- Always validate chain/network before write calls.
- Never upload raw file to IPFS in this flow; upload encrypted payload only.

## Fast Integration Checklist

1. Deploy contract and save address.
2. Add chain adapter (read/write wrappers).
3. On citizen upload, call `createEncryptedRecordAndPublish`.
4. On officer onboarding, call `setMyEncryptionPublicKey` once.
5. On share action, call `grantSecondOpinionAccess`.
6. On officer view, call `openRecordAsViewer`.
7. Add revoke action with `revokeAccess`.

## Process Diagram (Stage-by-Stage)

```text
Citizen Wallet
  -> generate/load RSA keypair
  -> encrypt file (AES)
  -> wrap AES key for self (RSA)
  -> upload encrypted payload to IPFS
  -> createRecord(recordId, cid, digest, wrappedKey) on-chain

Officer Wallet
  -> register public key on-chain (one time)

Citizen Wallet
  -> fetch officer public key from chain
  -> re-wrap AES key for officer
  -> grantAccess(recordId, officer, wrappedKeyForOfficer) on-chain

Officer Wallet
  -> hasRecordAccess?
  -> getWrappedDataKey(recordId, officer)
  -> fetch encrypted payload from IPFS
  -> decrypt locally and view

Citizen Wallet
  -> revokeAccess(recordId, officer) anytime
```

## Where To Start First

- Citizen integration entry: `createEncryptedRecordAndPublish`
- Officer integration entry: `setMyEncryptionPublicKey` + `openRecordAsViewer`
- Sharing entry: `grantSecondOpinionAccess`

That is enough to demonstrate full patient-sovereign access control in a hackathon demo.
