"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Clock,
  Video,
  Phone,
  Search,
  Filter,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { OfficersLayout } from "@/components/doctor/officer-layout"
import { mockAppointmentData } from "@/lib/mock-data"
import { useLanguage } from "@/components/language/language-provider"
import { GoogleMeetButton } from "@/components/common/google-meet-button"
import React from 'react'

function officersCallSection() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/appointments/call-officers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: "+918019227239" })
      });
      const data = await res.json();
      if (data.success) {
        setResult('Call initiated successfully!');
      } else {
        setResult(data.error || 'Failed to initiate call.');
      }
    } catch (err) {
      setResult('Error contacting server.');
    }
    setLoading(false);
  };

  return (
    <div className="mb-8 p-4 border rounded bg-white">
      <h2 className="text-lg font-bold mb-2">officers Call (Demo)</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-sm">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Calling...' : 'Initiate Demo'}
        </button>
      </form>
    </div>
  );
}

export default function officersAppointments() {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])

  // TODO: Fetch appointments from backend API
  // TODO: Implement real-time appointment updates
  // TODO: Add appointment management (approve, reschedule, cancel)
  const appointments = mockAppointmentData.officersAppointments

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      appointment.citizen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.reason.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || appointment.status === filterStatus
    const matchesDate = selectedDate === "all" || appointment.date === selectedDate
    return matchesSearch && matchesFilter && matchesDate
  })

  const todayAppointments = appointments.filter((apt) => apt.date === new Date().toISOString().split("T")[0])
  const pendingAppointments = appointments.filter((apt) => apt.status === "pending")
  const upcomingAppointments = appointments.filter(
    (apt) => apt.status === "confirmed" && new Date(apt.date) >= new Date(),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />
      case "phone":
        return <Phone className="h-4 w-4" />
      case "in-person":
        return <MapPin className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const handleAppointmentAction = (appointmentId: string, action: "approve" | "reschedule" | "cancel") => {
    // TODO: Update appointment status in backend
    // TODO: Send notification to citizen
    // TODO: Update calendar and availability
    console.log(`${action} appointment ${appointmentId}`)
  }

  const handleStartConsultation = (appointmentId: string) => {
    // TODO: Start video/phone consultation
    // TODO: Log consultation start time
    // TODO: Update appointment status to "in-progress"
    console.log(`Starting consultation for appointment ${appointmentId}`)
  }

  return (
    <>
      <OfficersLayout>
      <officersCallSection />
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("appointments")}</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">{t("officersAppointmentsDesc")}</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("todayAppointments")}</CardTitle>
                <Calendar className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayAppointments.length}</div>
                <p className="text-xs text-muted-foreground">
                  {todayAppointments.filter((apt) => apt.status === "completed").length} {t("completed")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("pendingRequests")}</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingAppointments.length}</div>
                <p className="text-xs text-muted-foreground">{t("requiresApproval")}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("upcomingAppointments")}</CardTitle>
                <Clock className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
                <p className="text-xs text-muted-foreground">{t("thisWeek")}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("videoConsultations")}</CardTitle>
                <Video className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{appointments.filter((apt) => apt.type === "video").length}</div>
                <p className="text-xs text-muted-foreground">{t("totalScheduled")}</p>
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
                    placeholder={t("searchAppointments")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder={t("filterByStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allAppointments")}</SelectItem>
                    <SelectItem value="confirmed">{t("confirmed")}</SelectItem>
                    <SelectItem value="pending">{t("pending")}</SelectItem>
                    <SelectItem value="completed">{t("completed")}</SelectItem>
                    <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full md:w-48"
                />
              </div>
            </CardContent>
          </Card>

          {/* Appointment Tabs */}
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">{t("allAppointments")}</TabsTrigger>
              <TabsTrigger value="pending">{t("pendingRequests")}</TabsTrigger>
              <TabsTrigger value="today">{t("today")}</TabsTrigger>
              <TabsTrigger value="upcoming">{t("upcoming")}</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <Card key={appointment.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold">{appointment.citizen}</h3>
                            <Badge className={getStatusColor(appointment.status)}>{t(appointment.status)}</Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300 mb-2">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{appointment.date}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{appointment.time}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              {getTypeIcon(appointment.type)}
                              <span className="capitalize">{t(appointment.type.replace("-", ""))}</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            <strong>{t("reason")}:</strong> {appointment.reason}
                          </p>
                          {appointment.notes && (
                            <p className="text-sm text-gray-500">
                              <strong>{t("notes")}:</strong> {appointment.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        {appointment.status === "pending" && (
                          <>
                            <Button size="sm" onClick={() => handleAppointmentAction(appointment.id, "approve")}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {t("approve")}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAppointmentAction(appointment.id, "reschedule")}
                            >
                              {t("reschedule")}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleAppointmentAction(appointment.id, "cancel")}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              {t("decline")}
                            </Button>
                          </>
                        )}
                        {appointment.status === "confirmed" && appointment.type === "video" && (
                          <GoogleMeetButton
                            citizenName={appointment.citizen}
                            onStartCall={() => handleStartConsultation(appointment.id)}
                            size="sm"
                          />
                        )}
                        {appointment.status === "confirmed" && appointment.type === "phone" && (
                          <Button variant="outline" size="sm" onClick={() => handleStartConsultation(appointment.id)}>
                            <Phone className="h-4 w-4 mr-2" />
                            {t("call")}
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          {t("viewcitizenRecord")}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {pendingAppointments.map((appointment) => (
                <Card key={appointment.id} className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                          <AlertCircle className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">{appointment.citizen}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300 mb-2">
                            <span>
                              {appointment.date} at {appointment.time}
                            </span>
                            <span className="capitalize">{t(appointment.type.replace("-", ""))}</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>{t("reason")}:</strong> {appointment.reason}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={() => handleAppointmentAction(appointment.id, "approve")}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {t("approve")}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleAppointmentAction(appointment.id, "cancel")}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          {t("decline")}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="today" className="space-y-4">
              {todayAppointments.map((appointment) => (
                <Card key={appointment.id} className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">{appointment.citizen}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300 mb-2">
                            <span>{appointment.time}</span>
                            <span className="capitalize">{t(appointment.type.replace("-", ""))}</span>
                            <Badge className={getStatusColor(appointment.status)}>{t(appointment.status)}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>{t("reason")}:</strong> {appointment.reason}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        {appointment.status === "confirmed" && appointment.type === "video" && (
                          <GoogleMeetButton
                            citizenName={appointment.citizen}
                            onStartCall={() => handleStartConsultation(appointment.id)}
                            size="sm"
                          />
                        )}
                        {appointment.status === "confirmed" && appointment.type === "phone" && (
                          <Button variant="outline" size="sm" onClick={() => handleStartConsultation(appointment.id)}>
                            <Phone className="h-4 w-4 mr-2" />
                            {t("call")}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <Clock className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">{appointment.citizen}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300 mb-2">
                            <span>
                              {appointment.date} at {appointment.time}
                            </span>
                            <span className="capitalize">{t(appointment.type.replace("-", ""))}</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>{t("reason")}:</strong> {appointment.reason}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Button variant="outline" size="sm">
                          {t("reschedule")}
                        </Button>
                        <Button variant="ghost" size="sm">
                          {t("viewcitizenRecord")}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>

          {/* Empty State */}
          {filteredAppointments.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t("noAppointmentsFound")}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{t("noAppointmentsFoundDesc")}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </OfficersLayout>
    </>
  )
}
