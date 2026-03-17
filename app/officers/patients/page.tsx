"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Filter,
  User,
  Phone,
  MessageSquare,
  FileText,
  Calendar,
  AlertTriangle,
  Heart,
  Activity,
} from "lucide-react"
import { OfficersLayout } from "@/components/doctor/officer-layout"
import { mockofficersData } from "@/lib/mock-data"
import { useLanguage } from "@/components/language/language-provider"
import { GoogleMeetButton } from "@/components/common/google-meet-button"

export default function officerscitizens() {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCondition, setFilterCondition] = useState("all")
  const [filterUrgency, setFilterUrgency] = useState("all")
  const [officers] = useState(mockofficersData.officerss[0])

  // TODO: Fetch citizens from backend API
  // TODO: Implement real-time citizen status updates
  // TODO: Add citizen medical history access
  const citizens = officers.citizens

  const filteredcitizens = citizens.filter((citizen) => {
    const matchesSearch =
      citizen.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      citizen.condition.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCondition = filterCondition === "all" || citizen.condition.toLowerCase().includes(filterCondition)
    const matchesUrgency = filterUrgency === "all" || citizen.urgency === filterUrgency
    return matchesSearch && matchesCondition && matchesUrgency
  })

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getConditionIcon = (condition: string) => {
    if (condition.toLowerCase().includes("heart") || condition.toLowerCase().includes("cardiac")) {
      return <Heart className="h-4 w-4" />
    }
    if (condition.toLowerCase().includes("respiratory") || condition.toLowerCase().includes("breathing")) {
      return <Activity className="h-4 w-4" />
    }
    return <User className="h-4 w-4" />
  }

  const handlecitizenAction = (citizenId: string, action: string) => {
    // TODO: Implement citizen actions
    // TODO: Open citizen records, start consultation, etc.
    console.log(`${action} for citizen ${citizenId}`)
  }

  const urgentcitizens = citizens.filter((p) => p.urgency === "high")
  const recentcitizens = citizens.filter((p) => p.lastVisit === "Today" || p.lastVisit.includes("2024-01"))

  return (
    <OfficersLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("citizens")}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Manage your citizen database and medical records</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("totalcitizens")}</CardTitle>
              <User className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{citizens.length}</div>
              <p className="text-xs text-muted-foreground">Active citizens</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgent Cases</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{urgentcitizens.length}</div>
              <p className="text-xs text-muted-foreground">{t("requiresAttention")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Visits</CardTitle>
              <Calendar className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentcitizens.length}</div>
              <p className="text-xs text-muted-foreground">{t("thisWeek")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Follow-ups</CardTitle>
              <Activity className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">Due this week</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search citizens by name or condition..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterCondition} onValueChange={setFilterCondition}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conditions</SelectItem>
                  <SelectItem value="respiratory">Respiratory</SelectItem>
                  <SelectItem value="cardiac">Cardiac</SelectItem>
                  <SelectItem value="diabetes">Diabetes</SelectItem>
                  <SelectItem value="hypertension">Hypertension</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterUrgency} onValueChange={setFilterUrgency}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Urgency</SelectItem>
                  <SelectItem value="high">{t("high")} Priority</SelectItem>
                  <SelectItem value="medium">{t("medium")} Priority</SelectItem>
                  <SelectItem value="low">{t("low")} Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* citizen Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All citizens</TabsTrigger>
            <TabsTrigger value="urgent">Urgent Cases</TabsTrigger>
            <TabsTrigger value="recent">Recent Visits</TabsTrigger>
            <TabsTrigger value="followup">Follow-ups</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filteredcitizens.map((citizen) => (
              <Card key={citizen.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {citizen.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold">{citizen.name}</h3>
                          <Badge className={getUrgencyColor(citizen.urgency)}>
                            {citizen.urgency === "high" && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {t(citizen.urgency)} {t("priority")}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300 mb-2">
                          <div className="flex items-center space-x-1">
                            {getConditionIcon(citizen.condition)}
                            <span>{citizen.condition}</span>
                          </div>
                          <span>•</span>
                          <span>
                            {t("lastVisit")}: {citizen.lastVisit}
                          </span>
                          <span>•</span>
                          <span>Next: {citizen.nextAppointment}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">ID: {citizen.id}</Badge>
                          <Badge variant="outline">Age: 32</Badge>
                          <Badge variant="outline">Male</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handlecitizenAction(citizen.id, "chat")}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          {t("chat")}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handlecitizenAction(citizen.id, "call")}>
                          <Phone className="h-4 w-4 mr-2" />
                          {t("call")}
                        </Button>
                        <GoogleMeetButton
                          citizenName={citizen.name}
                          onStartCall={() => handlecitizenAction(citizen.id, "video")}
                          size="sm"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlecitizenAction(citizen.id, "records")}
                        className="w-full"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Records
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="urgent" className="space-y-4">
            {urgentcitizens.map((citizen) => (
              <Card key={citizen.id} className="border-red-200 bg-red-50 dark:bg-red-900/20">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{citizen.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{citizen.condition}</p>
                        <p className="text-sm text-red-600 font-medium">Requires immediate attention</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" className="bg-red-600 hover:bg-red-700">
                        <Phone className="h-4 w-4 mr-2" />
                        Emergency Call
                      </Button>
                      <GoogleMeetButton
                        citizenName={citizen.name}
                        onStartCall={() => handlecitizenAction(citizen.id, "emergency")}
                        size="sm"
                        variant="secondary"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            {recentcitizens.map((citizen) => (
              <Card key={citizen.id} className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{citizen.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{citizen.condition}</p>
                        <p className="text-sm text-blue-600 font-medium">Last visit: {citizen.lastVisit}</p>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        View Visit Notes
                      </Button>
                      <Button variant="outline" size="sm">
                        Schedule Follow-up
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="followup" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Follow-up Management</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Track and schedule follow-up appointments for your citizens
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </OfficersLayout>
  )
}
