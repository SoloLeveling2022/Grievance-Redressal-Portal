"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar, Clock, Video, Phone, Plus, Search, Filter, MapPin, User } from "lucide-react"
import { CitizenLayout } from "@/components/patient/patient-layout"
import { mockAppointmentData } from "@/lib/mock-data"
import { useLanguage } from "@/components/language/language-provider"
import { GoogleMeetButton } from "@/components/common/google-meet-button"

function citizenCallSection() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/appointments/call-citizen', {
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
      <h2 className="text-lg font-bold mb-2">citizen Call (Demo)</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-sm">
        {/* <label htmlFor="citizen-phone">citizen Number</label>
        <input
          id="citizen-phone"
          type="tel"
          pattern="^\+91\s?\d{10}$"
          placeholder="+91 8019227239"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className="border p-2 rounded"
          required
        /> */}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Calling...' : 'Initiate Demo'}
        </button>
      </form>
      
    </div>
  );
}

export default function citizenAppointments() {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("")
  const [bookingForm, setBookingForm] = useState({
    officers: "",
    specialty: "",
    appointmentType: "",
    reason: "",
    preferredDate: "",
    preferredTime: "",
  })

  // TODO: Fetch appointments from backend API
  // TODO: Implement real-time appointment updates
  // TODO: Add appointment reminders and notifications
  const appointments = mockAppointmentData.citizenAppointments

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      appointment.officers.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.specialty.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || appointment.status === filterStatus
    return matchesSearch && matchesFilter
  })

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

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Submit appointment booking to backend API
    // TODO: Send confirmation email/SMS
    // TODO: Add to calendar
    // TODO: Notify officers of new appointment request

    console.log("Booking appointment:", bookingForm)
    setShowBookingModal(false)
    // Reset form
    setBookingForm({
      officers: "",
      specialty: "",
      appointmentType: "",
      reason: "",
      preferredDate: "",
      preferredTime: "",
    })
  }

  const handleJoinCall = (appointmentId: string) => {
    // TODO: Integrate with actual video calling service
    // TODO: Verify appointment time and permissions
    // TODO: Log call participation
    console.log(`Joining call for appointment ${appointmentId}`)
  }

  const availableTimeSlots = [
    "09:00 AM",
    "09:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "02:00 PM",
    "02:30 PM",
    "03:00 PM",
    "03:30 PM",
    "04:00 PM",
    "04:30 PM",
  ]

  return (
    <CitizenLayout>
      <div className="space-y-6"> 

        <citizenCallSection/>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("appointments")}</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">{t("appointmentsDesc")}</p>
          </div>

          <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("bookAppointment")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t("bookNewAppointment")}</DialogTitle>
                <DialogDescription>{t("bookAppointmentDesc")}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleBookAppointment} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="specialty">{t("specialty")}</Label>
                    <Select
                      value={bookingForm.specialty}
                      onValueChange={(value) => setBookingForm((prev) => ({ ...prev, specialty: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectSpecialty")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">{t("generalMedicine")}</SelectItem>
                        <SelectItem value="cardiology">{t("cardiology")}</SelectItem>
                        <SelectItem value="dermatology">{t("dermatology")}</SelectItem>
                        <SelectItem value="orthopedics">{t("orthopedics")}</SelectItem>
                        <SelectItem value="pediatrics">{t("pediatrics")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="officers">{t("preferredofficers")}</Label>
                    <Select
                      value={bookingForm.officers}
                      onValueChange={(value) => setBookingForm((prev) => ({ ...prev, officers: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectofficers")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dr-smith">Dr. Sarah Smith</SelectItem>
                        <SelectItem value="dr-johnson">Dr. Michael Johnson</SelectItem>
                        <SelectItem value="dr-davis">Dr. Emily Davis</SelectItem>
                        <SelectItem value="dr-wilson">Dr. Robert Wilson</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="appointmentType">{t("appointmentType")}</Label>
                    <Select
                      value={bookingForm.appointmentType}
                      onValueChange={(value) => setBookingForm((prev) => ({ ...prev, appointmentType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectType")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">{t("videoConsultation")}</SelectItem>
                        <SelectItem value="phone">{t("phoneConsultation")}</SelectItem>
                        <SelectItem value="in-person">{t("inPersonVisit")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="preferredDate">{t("preferredDate")}</Label>
                    <Input
                      id="preferredDate"
                      type="date"
                      value={bookingForm.preferredDate}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, preferredDate: e.target.value }))}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>

                <div>
                  <Label>{t("availableTimeSlots")}</Label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-2">
                    {availableTimeSlots.map((slot) => (
                      <Button
                        key={slot}
                        type="button"
                        variant={selectedTimeSlot === slot ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTimeSlot(slot)}
                        className="text-xs"
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="reason">{t("reasonForVisit")}</Label>
                  <Textarea
                    id="reason"
                    placeholder={t("reasonPlaceholder")}
                    value={bookingForm.reason}
                    onChange={(e) => setBookingForm((prev) => ({ ...prev, reason: e.target.value }))}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowBookingModal(false)}>
                    {t("cancel")}
                  </Button>
                  <Button type="submit">{t("bookAppointment")}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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
            </div>
          </CardContent>
        </Card>

        {/* Appointments List */}
        <div className="space-y-4">
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
                        <h3 className="text-lg font-semibold">{appointment.officers}</h3>
                        <Badge variant="secondary">{appointment.specialty}</Badge>
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
                      {appointment.reason && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">{appointment.reason}</p>
                      )}
                      {appointment.location && (
                        <div className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
                          <MapPin className="h-3 w-3" />
                          <span>{appointment.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    {appointment.status === "confirmed" && appointment.type === "video" && (
                      <GoogleMeetButton
                        citizenName="You"
                        onStartCall={() => handleJoinCall(appointment.id)}
                        size="sm"
                      />
                    )}
                    {appointment.status === "confirmed" && appointment.type === "phone" && (
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4 mr-2" />
                        {t("call")}
                      </Button>
                    )}
                    {appointment.status === "pending" && (
                      <Button variant="outline" size="sm">
                        {t("reschedule")}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      {t("viewDetails")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredAppointments.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t("noAppointmentsFound")}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{t("noAppointmentsFoundDesc")}</p>
                <Button onClick={() => setShowBookingModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("bookFirstAppointment")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </CitizenLayout>
  )
}
