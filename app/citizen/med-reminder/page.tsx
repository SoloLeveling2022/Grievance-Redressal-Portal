"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlarmClock, PhoneCall } from "lucide-react"
import { CitizenLayout } from "@/components/patient/patient-layout"

type Complaint = {
  id: string
  subject: string
  status: "Submitted" | "In Review" | "Resolved" | "Rejected"
  createdAt: string
  updates: { id: string; status: string; message: string; updatedAt: string }[]
}

export default function RemindersPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [isCallInitiating, setIsCallInitiating] = useState(false)
  const [callStatus, setCallStatus] = useState<string | null>(null)
  const [callError, setCallError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = localStorage.getItem("grievance_complaints")
      const list = raw ? (JSON.parse(raw) as Complaint[]) : []
      setComplaints(list)
    } catch {
      setComplaints([])
    }
  }, [])


  const statusVariant = (status: Complaint["status"]) => {
    switch (status) {
      case "Submitted":
        return "secondary"
      case "In Review":
        return "default"
      case "Resolved":
        return "secondary"
      case "Rejected":
        return "destructive"
      default:
        return "secondary"
    }
  }

  return (
    <CitizenLayout>
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        {/* Agent Trigger */}
        {/* <Card className="border-2 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PhoneCall className="h-5 w-5 text-blue-600" />
              <span>Agent for Updates</span>
            </CardTitle>
            <CardDescription>Get your complaint updates by phone via our AI agent</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              onClick={handleVoiceAgent}
              disabled={isCallInitiating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isCallInitiating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Initiating AI Call...
                </>
              ) : (
                <>
                  <PhoneCall className="h-4 w-4 mr-2" />
                  Start Updates Agent
                </>
              )}
            </Button>
            {callStatus && <p className="mt-3 text-sm text-blue-700 dark:text-blue-300">{callStatus}</p>}
            {callError && <p className="mt-3 text-sm text-red-600">{callError}</p>}
          </CardContent>
        </Card> */}

        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <AlarmClock className="h-7 w-7 text-blue-500" /> Reminders
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">View the latest updates on your filed complaints.</p>
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Complaint Updates</CardTitle>
              <CardDescription>Your grievance progress and latest actions</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {complaints.length === 0 ? (
              <p className="text-gray-500">No complaints found. File a complaint to see updates here.</p>
            ) : (
              <div className="space-y-4">
                {complaints.map((c) => (
                  <div key={c.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-lg">{c.subject}</div>
                      <Badge variant={statusVariant(c.status as Complaint["status"])}>{c.status}</Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Filed on {new Date(c.createdAt).toLocaleString()}</div>

                    <div className="mt-3 space-y-2">
                      {c.updates && c.updates.length > 0 ? (
                        c.updates.map((u) => (
                          <div key={u.id} className="border rounded-md p-2 bg-gray-50 dark:bg-gray-800">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium">{u.status}</div>
                              <div className="text-xs text-gray-500">{new Date(u.updatedAt).toLocaleString()}</div>
                            </div>
                            <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">{u.message}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">No updates yet.</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CitizenLayout>
  )
}
