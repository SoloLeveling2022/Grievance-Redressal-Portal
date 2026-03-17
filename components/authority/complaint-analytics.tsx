"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

// Complaint types
type Status = "New" | "In Progress" | "Resolved" | "Escalated" | "Pending"
type Department = "Public Safety" | "Sanitation" | "Transportation" | "Utilities" | "Welfare" | "Housing"

type Complaint = {
  id: string
  subject: string
  department: Department
  status: Status
  priority: "Low" | "Medium" | "High" | "Critical"
  receivedAt: string
  updatedAt: string
  resolvedAt?: string
  assignedTo?: string
}

const MOCK: Complaint[] = [
  {
    id: "HYD-24001",
    subject: "Streetlight outage in Sector 12",
    department: "Utilities",
    status: "Resolved",
    priority: "Medium",
    receivedAt: "2025-08-01",
    updatedAt: "2025-08-03",
    resolvedAt: "2025-08-03",
    assignedTo: "Officer Rao",
  },
  {
    id: "HYD-24002",
    subject: "Garbage not collected for 3 days",
    department: "Sanitation",
    status: "In Progress",
    priority: "High",
    receivedAt: "2025-08-02",
    updatedAt: "2025-08-04",
    assignedTo: "Inspector Anita",
  },
  {
    id: "HYD-24003",
    subject: "Potholes causing accidents",
    department: "Transportation",
    status: "Pending",
    priority: "High",
    receivedAt: "2025-08-03",
    updatedAt: "2025-08-03",
  },
  {
    id: "HYD-24004",
    subject: "Water leakage in community line",
    department: "Utilities",
    status: "In Progress",
    priority: "Medium",
    receivedAt: "2025-08-03",
    updatedAt: "2025-08-04",
    assignedTo: "Engineer Vivek",
  },
  {
    id: "HYD-24005",
    subject: "Street harassment near metro station",
    department: "Public Safety",
    status: "Escalated",
    priority: "Critical",
    receivedAt: "2025-08-02",
    updatedAt: "2025-08-04",
    assignedTo: "ACP Meera",
  },
  {
    id: "HYD-24006",
    subject: "Subsidy not received",
    department: "Welfare",
    status: "Resolved",
    priority: "Low",
    receivedAt: "2025-07-29",
    updatedAt: "2025-08-01",
    resolvedAt: "2025-08-01",
    assignedTo: "Officer Kumar",
  },
  {
    id: "HYD-24007",
    subject: "Illegal parking blocking lane",
    department: "Transportation",
    status: "New",
    priority: "Medium",
    receivedAt: "2025-08-04",
    updatedAt: "2025-08-04",
  },
  {
    id: "HYD-24008",
    subject: "Drain overflow after rain",
    department: "Sanitation",
    status: "Pending",
    priority: "High",
    receivedAt: "2025-08-04",
    updatedAt: "2025-08-04",
  },
  {
    id: "HYD-24009",
    subject: "Broken public restroom door",
    department: "Sanitation",
    status: "Resolved",
    priority: "Low",
    receivedAt: "2025-07-25",
    updatedAt: "2025-07-28",
    resolvedAt: "2025-07-28",
    assignedTo: "Team Green",
  },
  {
    id: "HYD-24010",
    subject: "Street vendor encroachment",
    department: "Public Safety",
    status: "In Progress",
    priority: "Medium",
    receivedAt: "2025-08-01",
    updatedAt: "2025-08-04",
    assignedTo: "SI Manish",
  },
  {
    id: "HYD-24011",
    subject: "Low water pressure in Block C",
    department: "Utilities",
    status: "Pending",
    priority: "Medium",
    receivedAt: "2025-08-03",
    updatedAt: "2025-08-03",
  },
  {
    id: "HYD-24012",
    subject: "Allotment delay for housing",
    department: "Housing",
    status: "New",
    priority: "Low",
    receivedAt: "2025-08-04",
    updatedAt: "2025-08-04",
  },
]

function daysBetween(a: string, b: string) {
  const da = new Date(a).getTime()
  const db = new Date(b).getTime()
  const ms = Math.max(0, db - da)
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

function statusClass(status: Status) {
  switch (status) {
    case "Resolved":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
    case "In Progress":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
    case "Pending":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
    case "Escalated":
      return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
  }
}

export default function ComplaintAnalytics() {
  const [query, setQuery] = useState("")
  const [department, setDepartment] = useState<Department | "All">("All")
  const [status, setStatus] = useState<Status | "All">("All")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  const filtered = useMemo(() => {
    return MOCK.filter((c) => {
      const q = query.trim().toLowerCase()
      if (q && !(c.id.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q))) return false
      if (department !== "All" && c.department !== department) return false
      if (status !== "All" && c.status !== status) return false
      if (from && new Date(c.receivedAt) < new Date(from)) return false
      if (to && new Date(c.receivedAt) > new Date(to)) return false
      return true
    })
  }, [query, department, status, from, to])

  const totals = useMemo(() => {
    const total = filtered.length
    const resolved = filtered.filter((c) => c.status === "Resolved").length
    const inProgress = filtered.filter((c) => c.status === "In Progress").length
    const pending = filtered.filter((c) => c.status === "Pending" || c.status === "New").length
    const escalated = filtered.filter((c) => c.status === "Escalated").length
    const resolvedWithTimes = filtered.filter((c) => c.status === "Resolved" && c.resolvedAt)
    const avgResolutionDays = resolvedWithTimes.length
      ? Math.round(
          resolvedWithTimes.map((c) => daysBetween(c.receivedAt, c.resolvedAt!)).reduce((a, b) => a + b, 0) /
            resolvedWithTimes.length,
        )
      : 0
    const dealtPct = total ? Math.round((resolved / total) * 100) : 0
    return { total, resolved, inProgress, pending, escalated, avgResolutionDays, dealtPct }
  }, [filtered])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-pretty">Complaint Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Received, dealt (resolved), pending/new, and in-progress overview.
          </p>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            placeholder="Search by ID or subject"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-[260px]"
          />
          <Select value={department} onValueChange={(v) => setDepartment(v as Department | "All")}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Departments</SelectItem>
              <SelectItem value="Public Safety">Public Safety</SelectItem>
              <SelectItem value="Sanitation">Sanitation</SelectItem>
              <SelectItem value="Transportation">Transportation</SelectItem>
              <SelectItem value="Utilities">Utilities</SelectItem>
              <SelectItem value="Welfare">Welfare</SelectItem>
              <SelectItem value="Housing">Housing</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => setStatus(v as Status | "All")}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
              <SelectItem value="Escalated">Escalated</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[160px]" />
            <span className="text-muted-foreground text-sm">to</span>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[160px]" />
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              setQuery("")
              setDepartment("All")
              setStatus("All")
              setFrom("")
              setTo("")
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{totals.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dealt (Resolved)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{totals.resolved}</div>
            <div className="mt-3">
              <Progress value={totals.dealtPct} aria-label="Resolved percentage" />
              <p className="mt-1 text-xs text-muted-foreground">{totals.dealtPct}% of total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{totals.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending / New</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{totals.pending}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Complaints</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Dept.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 10).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.id}</TableCell>
                    <TableCell className="max-w-[240px] truncate">{c.subject}</TableCell>
                    <TableCell>{c.department}</TableCell>
                    <TableCell>
                      <Badge className={statusClass(c.status)} variant="secondary">
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{c.assignedTo ?? "-"}</TableCell>
                    <TableCell>{c.receivedAt}</TableCell>
                    <TableCell>{c.updatedAt}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No complaints match your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quality & Timelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Average Resolution Time</div>
              <div className="text-2xl font-semibold">{totals.avgResolutionDays} days</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Escalated</div>
              <div className="text-2xl font-semibold">{MOCK.filter((c) => c.status === "Escalated").length}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
