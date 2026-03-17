"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  Download,
  Search,
  Filter,
  Calendar,
  User,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react"
import { OfficersLayout } from "@/components/doctor/officer-layout"
import { useLanguage } from "@/components/language/language-provider"

export default function officersReports() {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState("thisMonth")

  // TODO: Fetch reports from backend API
  // TODO: Implement report generation and export
  // TODO: Add real-time report updates
  const mockComplaints = [
    {
      id: "CC-2401",
      title: "Streetlight not working near Block A",
      department: "Public Works",
      status: "Resolved",
      priority: "Medium",
      date: "2025-08-02",
      description: "Reported outage affecting evening safety",
      citizen: "A. Kumar",
    },
    {
      id: "CC-2402",
      title: "Garbage collection missed for 3 days",
      department: "Sanitation",
      status: "In Progress",
      priority: "High",
      date: "2025-08-03",
      description: "Overflowing bin attracting stray animals",
      citizen: "S. Reddy",
    },
    {
      id: "CC-2403",
      title: "Noise complaint past midnight",
      department: "Police",
      status: "Escalated",
      priority: "High",
      date: "2025-08-01",
      description: "Repeated incidents over the last week",
      citizen: "M. Khan",
    },
    {
      id: "CC-2404",
      title: "Broken bus stop shelter",
      department: "Transport",
      status: "New",
      priority: "Low",
      date: "2025-08-03",
      description: "Glass panels cracked; risk to commuters",
      citizen: "P. Sharma",
    },
    {
      id: "CC-2405",
      title: "Mosquito breeding near drainage",
      department: "Health",
      status: "Resolved",
      priority: "Medium",
      date: "2025-08-02",
      description: "Standing water issue near lane 3",
      citizen: "N. Rao",
    },
  ] as const

  const filteredComplaints = mockComplaints.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDept = departmentFilter === "all" || c.department === departmentFilter
    const matchesStatus = statusFilter === "all" || c.status === statusFilter
    const matchesPriority = priorityFilter === "all" || c.priority === priorityFilter
    return matchesSearch && matchesDept && matchesStatus && matchesPriority
  })

  const getComplaintIcon = (department: string) => {
    switch (department) {
      case "Public Works":
        return <FileText className="h-5 w-5" />
      case "Sanitation":
        return <TrendingUp className="h-5 w-5" />
      case "Police":
        return <CheckCircle className="h-5 w-5" />
      case "Transport":
        return <User className="h-5 w-5" />
      case "Health":
        return <Activity className="h-5 w-5" />
      case "Revenue":
        return <FileText className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolved":
        return "bg-green-100 text-green-800 border-green-200"
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Escalated":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "New":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleGenerateReport = (type: string) => {
    // TODO: Implement report generation
    console.log(`Generating ${type} report`)
  }

  const handleDownloadReport = (reportId: string) => {
    // TODO: Implement report download
    console.log(`Downloading report ${reportId}`)
  }

  return (
    <OfficersLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("complaintReports")}</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Generate and manage complaint reports and analytics</p>
          </div>
          <Button onClick={() => handleGenerateReport("custom")}>
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockComplaints.length}</div>
              <p className="text-xs text-muted-foreground">In current range</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockComplaints.filter((c) => c.status === "Resolved").length}</div>
              <p className="text-xs text-muted-foreground">Closed successfully</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockComplaints.filter((c) => c.status === "New" || c.status === "In Progress").length}
              </div>
              <p className="text-xs text-muted-foreground">New + In Progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Escalated</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockComplaints.filter((c) => c.status === "Escalated").length}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search complaints by ID, title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Public Works">Public Works</SelectItem>
                  <SelectItem value="Sanitation">Sanitation</SelectItem>
                  <SelectItem value="Police">Police</SelectItem>
                  <SelectItem value="Transport">Transport</SelectItem>
                  <SelectItem value="Health">Health</SelectItem>
                  <SelectItem value="Revenue">Revenue</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-full md:w-40">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thisWeek">This Week</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="thisYear">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Report Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="escalated">Escalated</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filteredComplaints.map((c) => (
              <Card key={c.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold">{c.title}</h3>
                          <Badge className={getStatusColor(c.status)}>{c.status}</Badge>
                          <Badge variant="outline">{c.department}</Badge>
                          <Badge variant="outline">{c.priority}</Badge>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-2">{c.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{c.date}</span>
                          </div>
                          <span>•</span>
                          <span>Citizen: {c.citizen}</span>
                          <span>•</span>
                          <span>ID: {c.id}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleDownloadReport(c.id)}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="resolved" className="space-y-4">
            {filteredComplaints
              .filter((c) => c.status === "Resolved")
              .map((c) => (
                <Card key={c.id} className="border-green-200 bg-green-50 dark:bg-green-900/20">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">{c.title}</h3>
                          <p className="text-gray-600 dark:text-gray-300 mb-2">{c.description}</p>
                          <p className="text-sm text-green-600 font-medium">Resolved • {c.date}</p>
                        </div>
                      </div>
                      <Button onClick={() => handleDownloadReport(c.id)}>
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {filteredComplaints
              .filter((c) => c.status === "New" || c.status === "In Progress")
              .map((c) => (
                <Card key={c.id} className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Clock className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">{c.title}</h3>
                          <p className="text-gray-600 dark:text-gray-300 mb-2">{c.description}</p>
                          <p className="text-sm text-yellow-600 font-medium">{c.status}</p>
                        </div>
                      </div>
                      <Button variant="outline" disabled>
                        <Clock className="h-4 w-4 mr-2" />
                        Processing
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="escalated" className="space-y-4">
            {filteredComplaints
              .filter((c) => c.status === "Escalated")
              .map((c) => (
                <Card key={c.id} className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Activity className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">{c.title}</h3>
                          <p className="text-gray-600 dark:text-gray-300 mb-2">{c.description}</p>
                          <p className="text-sm text-yellow-600 font-medium">Requires attention</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Thread
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: "Department Summary", description: "Complaints by department and ward" },
                { name: "SLA Breach Analysis", description: "Breaches by status and age" },
                { name: "Escalation Report", description: "Escalations by severity" },
                { name: "Resolution Performance", description: "Avg time to resolution" },
                { name: "Complaint Volume", description: "Daily/weekly/monthly volumes" },
                { name: "Custom Report", description: "Build your own complaint report" },
              ].map((template, index) => (
                <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <FileText className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">{template.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{template.description}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateReport(template.name.toLowerCase())}
                      >
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </OfficersLayout>
  )
}
