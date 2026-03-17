"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

type Status = "New" | "In Progress" | "Resolved" | "Escalated" | "Pending"
type Department = "Public Works" | "Sanitation" | "Police" | "Health" | "Transport" | "Revenue"

interface Complaint {
  id: string
  citizen: string
  department: Department
  status: Status
  createdAt: string
  updatedAt: string
  title: string
  lastUpdate: string
  resolutionHours?: number
}

const seedComplaints: Complaint[] = [
  {
    id: "CC-2401",
    citizen: "A. Kumar",
    department: "Sanitation",
    status: "In Progress",
    createdAt: "2025-08-01T09:12:00Z",
    updatedAt: "2025-08-02T14:30:00Z",
    title: "Overflowing garbage bin near Sector 5",
    lastUpdate: "Work order raised",
  },
  {
    id: "CC-2402",
    citizen: "S. Reddy",
    department: "Public Works",
    status: "Resolved",
    createdAt: "2025-08-02T07:10:00Z",
    updatedAt: "2025-08-03T10:00:00Z",
    title: "Pothole at Jubilee Hills Rd 36",
    lastUpdate: "Pothole filled",
    resolutionHours: 30,
  },
  {
    id: "CC-2403",
    citizen: "M. Khan",
    department: "Police",
    status: "Escalated",
    createdAt: "2025-08-01T20:10:00Z",
    updatedAt: "2025-08-03T06:00:00Z",
    title: "Noise complaint after hours",
    lastUpdate: "Escalated to Circle Officer",
  },
  {
    id: "CC-2404",
    citizen: "P. Sharma",
    department: "Transport",
    status: "New",
    createdAt: "2025-08-03T08:45:00Z",
    updatedAt: "2025-08-03T08:45:00Z",
    title: "Bus stop shelter damaged",
    lastUpdate: "Awaiting triage",
  },
  {
    id: "CC-2405",
    citizen: "N. Rao",
    department: "Health",
    status: "Resolved",
    createdAt: "2025-08-02T11:20:00Z",
    updatedAt: "2025-08-03T12:00:00Z",
    title: "Mosquito breeding complaint",
    lastUpdate: "Spraying completed",
    resolutionHours: 24,
  },
  {
    id: "CC-2406",
    citizen: "G. Gupta",
    department: "Revenue",
    status: "In Progress",
    createdAt: "2025-08-01T10:00:00Z",
    updatedAt: "2025-08-02T10:00:00Z",
    title: "Property tax discrepancy",
    lastUpdate: "Documents requested",
  },
]

function StatusBadge({ status }: { status: Status }) {
  switch (status) {
    case "Resolved":
      return <Badge className="bg-green-600 text-white">Resolved</Badge>
    case "In Progress":
      return <Badge className="bg-blue-600 text-white">In Progress</Badge>
    case "Escalated":
      return <Badge className="bg-yellow-600 text-black">Escalated</Badge>
    case "Pending":
      return <Badge className="bg-orange-600 text-white">Pending</Badge>
    default:
      return <Badge variant="secondary">New</Badge>
  }
}

export default function AuthorityAnalytics() {
  const [query, setQuery] = useState("")
  const [dept, setDept] = useState<Department | "all">("all")
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all")

  const filtered = useMemo(() => {
    return seedComplaints.filter((c) => {
      const q = query.trim().toLowerCase()
      if (q && !(c.id.toLowerCase().includes(q) || c.title.toLowerCase().includes(q))) return false
      if (dept !== "all" && c.department !== dept) return false
      if (statusFilter !== "all" && c.status !== statusFilter) return false
      return true
    })
  }, [query, dept, statusFilter])

  const { total, resolved, inProgress, pendingNew, escalated, avgResolutionHours } = useMemo(() => {
    const total = filtered.length
    const resolved = filtered.filter((c) => c.status === "Resolved").length
    const inProgress = filtered.filter((c) => c.status === "In Progress").length
    const pendingNew = filtered.filter((c) => c.status === "New" || c.status === "Pending").length
    const escalated = filtered.filter((c) => c.status === "Escalated").length
    const resHours = filtered.map((c) => c.resolutionHours).filter((n): n is number => typeof n === "number")
    const avgResolutionHours = resHours.length ? Math.round(resHours.reduce((a, b) => a + b, 0) / resHours.length) : 0
    return { total, resolved, inProgress, pendingNew, escalated, avgResolutionHours }
  }, [filtered])

  const resolvedPct = total ? Math.round((resolved / total) * 100) : 0

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <section className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Received</CardDescription>
            <CardTitle className="text-3xl">{total}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Across all departments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Dealt (Resolved)</CardDescription>
            <CardTitle className="text-3xl">{resolved}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={resolvedPct} aria-label="Resolved percentage" />
              <p className="text-xs text-muted-foreground">{resolvedPct}% of total</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-3xl">{inProgress}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Being worked on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending / New</CardDescription>
            <CardTitle className="text-3xl">{pendingNew}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Awaiting assignment or triage</p>
          </CardContent>
        </Card>
      </section>

      {/* Filters and list */}
      <section className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Complaints Overview</CardTitle>
            <CardDescription>Search and filter to focus your queue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Input
                placeholder="Search by ID or title"
                aria-label="Search complaints"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Select value={dept} onValueChange={(v) => setDept((v as Department) || "all")}>
                <SelectTrigger>
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Public Works">Public Works</SelectItem>
                  <SelectItem value="Sanitation">Sanitation</SelectItem>
                  <SelectItem value="Police">Police</SelectItem>
                  <SelectItem value="Health">Health</SelectItem>
                  <SelectItem value="Transport">Transport</SelectItem>
                  <SelectItem value="Revenue">Revenue</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter((v as Status) || "all")}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery("")
                  setDept("all")
                  setStatusFilter("all")
                }}
              >
                Reset
              </Button>
            </div>

            <div className="rounded-md border">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-sm text-muted-foreground">
                <div className="col-span-2">ID</div>
                <div className="col-span-3">Title</div>
                <div className="col-span-2">Citizen</div>
                <div className="col-span-2">Department</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2 text-right">Updated</div>
              </div>
              <div className="divide-y">
                {filtered.slice(0, 10).map((c) => (
                  <div key={c.id} className="grid grid-cols-12 gap-2 px-3 py-3 items-center">
                    <div className="col-span-2 font-medium">{c.id}</div>
                    <div className="col-span-3">{c.title}</div>
                    <div className="col-span-2">{c.citizen}</div>
                    <div className="col-span-2">
                      <Badge variant="outline">{c.department}</Badge>
                    </div>
                    <div className="col-span-1">
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="col-span-2 text-right text-sm text-muted-foreground">
                      {new Date(c.updatedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No complaints match filters.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest Updates</CardTitle>
            <CardDescription>Most recent activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {seedComplaints.slice(0, 6).map((c) => (
              <div key={c.id} className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-sm font-medium">{c.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.id} • {c.department} • {new Date(c.updatedAt).toLocaleString()}
                  </div>
                  <div className="text-xs">{c.lastUpdate}</div>
                </div>
                <StatusBadge status={c.status} />
              </div>
            ))}
            <Button variant="secondary" className="w-full">
              View All
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
