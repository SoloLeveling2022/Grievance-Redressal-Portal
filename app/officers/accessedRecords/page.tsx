"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { OfficersLayout } from "@/components/doctor/officer-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getSocket } from "@/lib/socket"

type SharedRecord = {
  recordId: string
  title: string
  type: string
  date?: string
  description?: string
  links: string[]
  content?: any
  shareToOfficer?: string
  citizenId?: string
  sharedAt?: string
}

export default function AccessedRecordsPage() {
  return (
    <Suspense fallback={<AccessedRecordsFallback />}>
      <AccessedRecordsContent />
    </Suspense>
  )
}

function AccessedRecordsFallback() {
  return (
    <OfficersLayout>
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 text-sm text-gray-600">Loading shared records...</CardContent>
        </Card>
      </div>
    </OfficersLayout>
  )
}

function AccessedRecordsContent() {
  const searchParams = useSearchParams()
  const shareToOfficerParam = searchParams.get("shareToOfficer") || ""
  const [shareToOfficer, setShareToOfficer] = useState(shareToOfficerParam)

  const [records, setRecords] = useState<SharedRecord[]>([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (shareToOfficerParam) {
      setShareToOfficer(shareToOfficerParam)
      return
    }
    try {
      const fallbackOfficerId = localStorage.getItem("careconnect_current_officer_id") || ""
      setShareToOfficer(fallbackOfficerId)
    } catch {
      setShareToOfficer("")
    }
  }, [shareToOfficerParam])

  useEffect(() => {
    const socket = getSocket()

    const onConnect = () => {
      setConnected(true)
      if (shareToOfficer) {
        socket.emit("get_officer_shared_records", { officerId: shareToOfficer })
      }
    }

    const onDisconnect = () => setConnected(false)

    const onSharedRecords = (payload: { officerId: string; records: SharedRecord[] }) => {
      if (!shareToOfficer || payload.officerId !== shareToOfficer) return
      setRecords(payload.records || [])
    }

    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)
    socket.on("officer_shared_records", onSharedRecords)

    if (socket.connected) onConnect()

    return () => {
      socket.off("connect", onConnect)
      socket.off("disconnect", onDisconnect)
      socket.off("officer_shared_records", onSharedRecords)
    }
  }, [shareToOfficer])

  const filtered = useMemo(() => {
    if (!shareToOfficer) return []
    return records.filter((record) => (record.shareToOfficer || shareToOfficer) === shareToOfficer)
  }, [records, shareToOfficer])

  return (
    <OfficersLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Accessed Shared Records</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Officer: {shareToOfficer || "(missing shareToOfficer query param)"}
            </p>
          </div>
          <Badge variant={connected ? "default" : "secondary"}>{connected ? "Socket Connected" : "Disconnected"}</Badge>
        </div>

        {!shareToOfficer && (
          <Card>
            <CardContent className="pt-6 text-sm text-red-600">
              Missing query param. Open this page as /officers/accessedRecords?shareToOfficer=OFFICER-XXXXXX
            </CardContent>
          </Card>
        )}

        {shareToOfficer && filtered.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-sm text-gray-600">
              No shared records found yet for this officer.
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {filtered.map((record, index) => (
            <Card key={`${record.recordId}-${index}`}>
              <CardHeader>
                <CardTitle className="text-lg">{record.title || record.recordId}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">Type: {record.type || "unknown"}</Badge>
                  <Badge variant="outline">Record ID: {record.recordId}</Badge>
                  <Badge variant="outline">Citizen: {record.citizenId || "unknown"}</Badge>
                  <Badge variant="outline">Shared: {record.sharedAt ? new Date(record.sharedAt).toLocaleString() : "unknown"}</Badge>
                </div>
                {record.description && <p className="text-sm text-gray-700 dark:text-gray-200">{record.description}</p>}
                {record.content && (
                  <div className="rounded-md border bg-gray-50 p-3 text-xs text-gray-800 max-h-64 overflow-auto">
                    <pre>{JSON.stringify(record.content, null, 2)}</pre>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {record.links && record.links.length > 0 && (
                    record.links.map((link, i) => (
                      <Button key={`${record.recordId}-link-${i}`} variant="outline" size="sm" onClick={() => window.open(link, "_blank")}>
                        Open File {i + 1}
                      </Button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </OfficersLayout>
  )
}
