import jsPDF from "jspdf"
import type { BlockchainAuditEntry, BlockchainAuditLogger } from "./types"

const BLOCKCHAIN_AUDIT_STORAGE_KEY = "careconnect_blockchain_audit_logs"
const CHAT_ACCESS_CONTROL_CONTRACT = "0x0000000000000000000000000000000000000001"

function getStorageSafe(): Storage | null {
  if (typeof window === "undefined") return null
  return window.localStorage
}

function stableTimestampSort(logs: BlockchainAuditEntry[]): BlockchainAuditEntry[] {
  return [...logs].sort((a, b) => new Date(b.timestampIso).getTime() - new Date(a.timestampIso).getTime())
}

export function getBlockchainAuditLogs(): BlockchainAuditEntry[] {
  const storage = getStorageSafe()
  if (!storage) return []

  try {
    const parsed = JSON.parse(storage.getItem(BLOCKCHAIN_AUDIT_STORAGE_KEY) || "[]") as BlockchainAuditEntry[]
    return stableTimestampSort(parsed)
  } catch {
    return []
  }
}

export function appendBlockchainAuditLog(entry: BlockchainAuditEntry): void {
  const storage = getStorageSafe()
  if (!storage) return

  const existing = getBlockchainAuditLogs()
  storage.setItem(BLOCKCHAIN_AUDIT_STORAGE_KEY, JSON.stringify([entry, ...existing]))
  window.dispatchEvent(new CustomEvent("careconnect:blockchain-audit-updated"))
}

export function createBrowserAuditLogger(baseFootprint: Record<string, unknown> = {}): BlockchainAuditLogger {
  return (entry) => {
    appendBlockchainAuditLog({
      ...entry,
      footprint: {
        ...baseFootprint,
        ...(entry.footprint || {}),
      },
    })
  }
}

export function logAccessControlAuditEvent(params: {
  action: string
  status: "success" | "error"
  actorRole: "citizen" | "officer" | "system"
  actorId: string
  officerId?: string
  citizenId?: string
  authority?: string
  details?: Record<string, unknown>
  error?: string
  direction?: "read" | "write"
}): void {
  appendBlockchainAuditLog({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    timestampIso: new Date().toISOString(),
    contractAddress: CHAT_ACCESS_CONTROL_CONTRACT,
    chainId: "off-chain-chat-access-control",
    networkName: "chat-access-control",
    direction: params.direction || "write",
    functionName: params.action,
    args: [
      {
        actorRole: params.actorRole,
        actorId: params.actorId,
        officerId: params.officerId,
        citizenId: params.citizenId,
        authority: params.authority,
        ...(params.details || {}),
      },
    ],
    status: params.status,
    error: params.error,
    footprint: {
      actorRole: params.actorRole,
      actorId: params.actorId,
      officerId: params.officerId || null,
      citizenId: params.citizenId || null,
      authority: params.authority || null,
      ...(params.details || {}),
    },
  })
}

function drawWrappedText(doc: jsPDF, text: string, startX: number, startY: number, maxWidth: number): number {
  const wrappedLines = doc.splitTextToSize(text, maxWidth)
  let y = startY
  wrappedLines.forEach((line: string) => {
    doc.text(line, startX, y)
    y += 5
  })
  return y
}

export function downloadBlockchainAuditLogsPdf(params?: { logs?: BlockchainAuditEntry[]; fileName?: string }): void {
  const logs = params?.logs || getBlockchainAuditLogs()
  if (!logs.length) {
    throw new Error("No blockchain audit logs available to export")
  }

  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14
  const maxTextWidth = pageWidth - margin * 2
  const fileName = params?.fileName || `CareConnect_Blockchain_Audit_${new Date().toISOString().slice(0, 10)}.pdf`

  let y = margin

  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, pageWidth, 24, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(15)
  doc.text("CareConnect Blockchain Audit Export", margin, 15)

  doc.setTextColor(0, 0, 0)
  y = 30
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  y = drawWrappedText(
    doc,
    `Generated at: ${new Date().toISOString()} | Total events: ${logs.length}`,
    margin,
    y,
    maxTextWidth,
  )
  y += 2

  logs.forEach((log, index) => {
    const section = [
      `#${index + 1}`,
      `Timestamp: ${log.timestampIso}`,
      `Direction: ${log.direction}`,
      `Status: ${log.status}`,
      `Function: ${log.functionName}`,
      `Contract: ${log.contractAddress}`,
      `Network: ${log.networkName || "n/a"}`,
      `ChainId: ${String(log.chainId ?? "n/a")}`,
      `TxHash: ${log.txHash || "n/a"}`,
      `Args: ${JSON.stringify(log.args ?? [], null, 0)}`,
      `Result: ${JSON.stringify(log.result ?? null, null, 0)}`,
      `Error: ${log.error || "n/a"}`,
      `Footprint: ${JSON.stringify(log.footprint ?? {}, null, 0)}`,
    ]

    section.forEach((line) => {
      if (y > pageHeight - margin) {
        doc.addPage()
        y = margin
      }
      y = drawWrappedText(doc, line, margin, y, maxTextWidth)
    })

    if (y > pageHeight - margin) {
      doc.addPage()
      y = margin
    } else {
      doc.setDrawColor(200, 200, 200)
      doc.line(margin, y, pageWidth - margin, y)
      y += 6
    }
  })

  doc.save(fileName)
}

export { BLOCKCHAIN_AUDIT_STORAGE_KEY }
