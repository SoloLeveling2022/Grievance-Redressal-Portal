"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Calendar, Search, Phone, MessageSquare, AlertTriangle, CheckCircle } from "lucide-react"
import { OfficersLayout } from "@/components/doctor/officer-layout"
import { mockofficersData } from "@/lib/mock-data"
import { useLanguage } from "@/components/language/language-provider"
import { GoogleMeetButton } from "@/components/common/google-meet-button"
import { OfficersEmergencyAlerts } from "@/components/doctor/emergency-alerts"
import AuthorityAnalytics from "@/components/authority/authority-analytics"

export default function officersDashboard() {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState("")
  const [officers] = useState(mockofficersData.officerss[0])
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowEmergencyAlert(true)
      // Play alert sound
      const context = new AudioContext()
      const oscillator = context.createOscillator()
      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(1000, context.currentTime) // 1000 Hz
      oscillator.connect(context.destination)
      oscillator.start()
      setTimeout(() => {
        oscillator.stop()
        context.close()
      }, 1000) // Play sound for 1 second
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  // TODO: Fetch real citizen data from backend
  // TODO: Implement real-time citizen status updates
  // TODO: Add citizen filtering and sorting
  const filteredcitizens = officers.citizens.filter(
    (citizen) =>
      citizen.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      citizen.condition.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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

  const handleVideoCall = (citizenId: string) => {
    // TODO: Integrate with actual video calling service
    // TODO: Create meeting room and send invitation
    // TODO: Log call in citizen records
    console.log(`Starting video call with citizen ${citizenId}`)
  }

  return (
    <OfficersLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("authorityDashboardTitle")}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">{t("authorityDashboardSubtitle")}</p>
        </div>

        {/* Emergency Alerts */}
        {showEmergencyAlert && <OfficersEmergencyAlerts />}

        {/* Authority Analytics */}
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Complaint Analytics</h2>
        <AuthorityAnalytics />

        {/* citizen Search */}
        {/* <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t("searchcitizens")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card> */}

        {/* citizens List */}
        {/* <Card>
          <CardHeader>
            <CardTitle>{t("citizenQueue")}</CardTitle>
            <CardDescription>{t("citizenQueueDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredcitizens.map((citizen) => (
                <div
                  key={citizen.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {citizen.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{citizen.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{citizen.condition}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className={getUrgencyColor(citizen.urgency)}>
                          {citizen.urgency === "high" && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {citizen.urgency === "low" && <CheckCircle className="h-3 w-3 mr-1" />}
                          {t(citizen.urgency)} {t("priority")}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {t("lastVisit")}: {citizen.lastVisit}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {t("chat")}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4 mr-2" />
                      {t("call")}
                    </Button>
                    <GoogleMeetButton citizenName={citizen.name} onStartCall={() => handleVideoCall(citizen.id)} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card> */}

        {/* Today's Schedule */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>{t("todaySchedule")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {officers.todaySchedule.map((appointment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{appointment.citizen}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{appointment.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{appointment.time}</p>
                    <Badge variant={appointment.status === "completed" ? "default" : "secondary"}>
                      {t(appointment.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card> */}
      </div>
    </OfficersLayout>
  )
}
