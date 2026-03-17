"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PoliceLayout } from "@/components/police/police-layout"

interface AlertHistoryItem {
  id: string
  message: string
  timestamp: string
  status: "active" | "responding" | "resolved"
}

const mockAlertHistory: AlertHistoryItem[] = [
  {
    id: "alert_001",
    message: "Emergency alert for John Doe at 123 Main St",
    timestamp: "2024-06-01 14:30",
    status: "resolved",
  },
  {
    id: "alert_002",
    message: "Emergency alert for Jane Smith at 456 Oak Ave",
    timestamp: "2024-06-02 09:15",
    status: "responding",
  },
  {
    id: "alert_003",
    message: "Emergency alert for Bob Johnson at 789 Pine Rd",
    timestamp: "2024-06-03 18:45",
    status: "active",
  },
]

export default function PoliceAlertHistory() {
  const [alerts] = useState(mockAlertHistory)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-red-600"
      case "responding":
        return "text-orange-600"
      case "resolved":
        return "text-green-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <PoliceLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Alert History</h2>
        <Card>
          <CardHeader>
            <CardTitle>Past Emergency Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {alerts.map((alert) => (
                <li key={alert.id} className="border p-4 rounded-lg">
                  <p>{alert.message}</p>
                  <p className="text-sm text-gray-500">{alert.timestamp}</p>
                  <p className={`font-semibold ${getStatusColor(alert.status)}`}>{alert.status}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </PoliceLayout>
  )
}
