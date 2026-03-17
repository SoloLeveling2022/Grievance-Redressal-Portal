"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CitizenLayout } from "@/components/patient/patient-layout"
import { useLanguage } from "@/components/language/language-provider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"

type Status = "New" | "In Progress" | "Resolved" | "Escalated"

type Complaint = {
  id: string
  title: string
  department: string
  date: string // ISO yyyy-mm-dd
  status: Status
  latestUpdate: string
  resolutionTimeDays?: number
}

const initialComplaints: Complaint[] = [
  {
    id: "CC-2025-0001",
    title: "Streetlight not working at Lane 3",
    department: "Electricity",
    date: "2025-08-10",
    status: "In Progress",
    latestUpdate: "Technician assigned; expected visit by Aug 30",
  },
  {
    id: "CC-2025-0002",
    title: "Overflowing garbage near Market Road",
    department: "Sanitation",
    date: "2025-08-07",
    status: "Resolved",
    latestUpdate: "Clean-up completed and bins replaced",
    resolutionTimeDays: 3,
  },
  {
    id: "CC-2025-0003",
    title: "Potholes causing traffic snarls",
    department: "Transport",
    date: "2025-08-12",
    status: "Escalated",
    latestUpdate: "Escalated to Zonal Officer due to repeated reports",
  },
  {
    id: "CC-2025-0004",
    title: "Irregular water supply in Block B",
    department: "Water",
    date: "2025-08-01",
    status: "Resolved",
    latestUpdate: "Valve replaced; normal supply restored",
    resolutionTimeDays: 5,
  },
  {
    id: "CC-2025-0005",
    title: "Broken footpath near school",
    department: "Public Works",
    date: "2025-08-18",
    status: "New",
    latestUpdate: "Complaint registered; awaiting site inspection",
  },
  {
    id: "CC-2025-0006",
    title: "Unscheduled power outage",
    department: "Electricity",
    date: "2025-08-20",
    status: "In Progress",
    latestUpdate: "Load balancing in progress; ETA 2 hours",
  },
]

function statusBadgeVariant(status: Status): "default" | "secondary" | "outline" {
  switch (status) {
    case "New":
      return "outline"
    case "In Progress":
      return "secondary"
    case "Resolved":
      return "default"
    case "Escalated":
      return "default"
    default:
      return "secondary"
  }
}

export default function citizenDashboard() {
  const { t } = useLanguage()

  // Filters
  const [complaints] = useState<Complaint[]>(initialComplaints)
  const [search, setSearch] = useState("")
  const [department, setDepartment] = useState<string>("all")
  const [status, setStatus] = useState<Status | "all">("all")
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")

  const total = complaints.length
  const resolved = complaints.filter((c) => c.status === "Resolved").length
  const pending = total - resolved
  const avgResolutionDays = useMemo(() => {
    const times = complaints
      .filter((c) => typeof c.resolutionTimeDays === "number")
      .map((c) => c.resolutionTimeDays as number)
    if (!times.length) return null
    return Math.round(times.reduce((a, b) => a + b, 0) / times.length)
  }, [complaints])

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      const matchesSearch =
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.id.toLowerCase().includes(search.toLowerCase())

      const matchesDept = department === "all" || c.department === department
      const matchesStatus = status === "all" || c.status === status

      const inFrom = !dateFrom || c.date >= dateFrom
      const inTo = !dateTo || c.date <= dateTo

      return matchesSearch && matchesDept && matchesStatus && inFrom && inTo
    })
  }, [complaints, search, department, status, dateFrom, dateTo])

  const latestUpdates = useMemo(() => {
    return [...complaints]
      .sort((a, b) => (a.date > b.date ? -1 : 1))
      .slice(0, 4)
      .map((c) => ({ id: c.id, title: c.title, update: c.latestUpdate, date: c.date, status: c.status }))
  }, [complaints])

  return (
    <CitizenLayout>
      <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("citizenDashboardTitle")}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">{t("dashboardSubtitle")}</p>
        </div>

        {/* Complaint Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-sm font-medium">Total Complaints Filed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{total}</div>
              <p className="text-xs text-muted-foreground">Across all departments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-sm font-medium">Resolved vs Pending</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-600 dark:text-green-400">Resolved: {resolved}</span>
                <span className="text-amber-600 dark:text-amber-400">Pending: {pending}</span>
              </div>
              <Progress value={total ? Math.round((resolved / total) * 100) : 0} />
              <p className="text-xs text-muted-foreground">
                {total ? Math.round((resolved / total) * 100) : 0}% resolved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-sm font-medium">Average Resolution Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{avgResolutionDays !== null ? `${avgResolutionDays}d` : "—"}</div>
              <p className="text-xs text-muted-foreground">Based on resolved cases</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-sm font-medium">Escalated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{complaints.filter((c) => c.status === "Escalated").length}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>
        </div>

        {/* My Grievances */}
        <Card>
          <CardHeader>
            <CardTitle>My Grievances</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search by title or ID"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div>
                <Label>Department</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Sanitation">Sanitation</SelectItem>
                    <SelectItem value="Transport">Transport</SelectItem>
                    <SelectItem value="Public Works">Public Works</SelectItem>
                    <SelectItem value="Electricity">Electricity</SelectItem>
                    <SelectItem value="Water">Water</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as Status | "all")}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                    <SelectItem value="Escalated">Escalated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="from">From</Label>
                <Input id="from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>

              <div>
                <Label htmlFor="to">To</Label>
                <Input id="to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Latest Update</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.id}</TableCell>
                      <TableCell>{c.title}</TableCell>
                      <TableCell>{c.department}</TableCell>
                      <TableCell>{c.date}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(c.status)}>{c.status}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="line-clamp-1 text-muted-foreground">{c.latestUpdate}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!filtered.length && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                        No complaints found matching your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Quick view of latest updates */}
        <Card>
          <CardHeader>
            <CardTitle>Latest Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {latestUpdates.map((u) => (
                <div key={u.id} className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{u.title}</p>
                      <Badge variant={statusBadgeVariant(u.status)}>{u.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{u.update}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">{u.date}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </CitizenLayout>
  )
}
