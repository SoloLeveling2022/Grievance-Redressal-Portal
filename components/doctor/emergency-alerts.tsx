"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertTriangle, Phone, MapPin, Clock, User, Heart, Navigation } from "lucide-react"
import { useLanguage } from "@/components/language/language-provider"

interface EmergencyAlert {
  id: string
  citizenId: string
  citizenName: string
  citizenAge: number
  citizenCondition: string
  timestamp: Date
  location: {
    latitude: number
    longitude: number
    address: string
    accuracy: number
  }
  status: "active" | "responding" | "resolved"
  priority: "critical" | "high" | "medium"
  vitals?: {
    heartRate?: number
    bloodPressure?: string
    temperature?: number
  }
  emergencyContacts: Array<{
    name: string
    phone: string
    relation: string
    notified: boolean
  }>
}

interface officersEmergencyAlertsProps {
  className?: string
}

export function OfficersEmergencyAlerts({ className }: officersEmergencyAlertsProps) {
  const { t } = useLanguage()
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([
    {
      id: "emer_001",
      citizenId: "pat_001",
      citizenName: "Devendra",
      citizenAge: 45,
      citizenCondition: "Hypertension, Diabetes",
      timestamp: new Date(),
      location: {
        latitude: 17.3331759,
        longitude: 78.3386956,
        address: "N BLOCK,VJIT COLLEGE,HYDERABAD, TELANGANA, 500075",
        accuracy: 17,

      },
      status: "active",
      priority: "critical",
      vitals: {
        heartRate: 120,
        bloodPressure: "180/110",
        temperature: 99.2,
      },
      emergencyContacts: [
        { name: "District Authority", phone: "+9876543210", relation: "Authority", notified: true },
        { name: "Emergency Services", phone: "9123456780", relation: "Emergency", notified: true },
      ],
    },
  ])
  const [selectedAlert, setSelectedAlert] = useState<EmergencyAlert | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // TODO: Replace with real WebSocket connection
      // TODO: Connect to emergency alert system
      // TODO: Get real-time citizen location updates
      console.log("Checking for new emergency alerts...")
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-red-500"
      case "responding":
        return "bg-orange-500"
      case "resolved":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)

    if (minutes > 0) return `${minutes}m ago`
    return `${seconds}s ago`
  }

  const handleRespondToEmergency = async (alertId: string) => {
    // TODO: Update alert status in backend
    // TODO: Notify emergency services of officers response
    // TODO: Start emergency consultation session
    // TODO: Log officers response time

    setAlerts((prev) =>
      prev.map((alert) => (alert.id === alertId ? { ...alert, status: "responding" as const } : alert)),
    )

    console.log(`officers responding to emergency ${alertId}`)
  }

  const handleCallcitizen = (alert: EmergencyAlert) => {
    // TODO: Initiate emergency call to citizen
    // TODO: Use WebRTC or telephony service
    // TODO: Log emergency call in citizen records
    console.log(`Calling citizen ${alert.citizenName}`)
  }

  const handleCallEmergencyServices = (alert: EmergencyAlert) => {
    // TODO: Conference call with emergency services
    // TODO: Share citizen medical history
    // TODO: Provide medical guidance
    console.log(`Calling emergency services for ${alert.citizenName}`)
  }

  const handleViewLocation = (alert: EmergencyAlert) => {
    // TODO: Open maps application with citizen location
    // TODO: Provide turn-by-turn directions
    const mapsUrl = `https://www.google.com/maps?q=${alert.location.latitude},${alert.location.longitude}`
    window.open(mapsUrl, "_blank")
  }

  const activeAlerts = alerts.filter((alert) => alert.status === "active")
  const respondingAlerts = alerts.filter((alert) => alert.status === "responding")

  if (alerts.length === 0) {
    return null
  }

  return (
    <div className={className}>
      {/* Active Emergency Alerts */}
      {activeAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-red-700 dark:text-red-300">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
              <span>{t("activeEmergencies")}</span>
              <Badge variant="destructive" className="ml-2">
                {activeAlerts.length}
              </Badge>
            </CardTitle>
            <CardDescription className="text-red-600 dark:text-red-400">
              {t("immediateAttentionRequired")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-red-200 shadow-sm"
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-red-600" />
                      </div>
                      <div
                        className={`absolute -top-1 -right-1 w-4 h-4 ${getStatusColor(alert.status)} rounded-full animate-pulse`}
                      ></div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{alert.citizenName}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {t("age")}: {alert.citizenAge} 
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <Badge className={getPriorityColor(alert.priority)}>
                          {t(alert.priority)} {t("priority")}
                        </Badge>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimeAgo(alert.timestamp)}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <MapPin className="h-3 w-3" />
                          <span>{alert.location.address.split(",")[0]}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedAlert(alert)
                        setShowDetailModal(true)
                      }}
                    >
                      {t("details")}
                    </Button>
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => handleRespondToEmergency(alert.id)}
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      {t("respond")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Responding Alerts */}
      {respondingAlerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-orange-700 dark:text-orange-300">
              <Heart className="h-5 w-5" />
              <span>{t("respondingTo")}</span>
              <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800">
                {respondingAlerts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {respondingAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-orange-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{alert.citizenName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{formatTimeAgo(alert.timestamp)}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedAlert(alert)
                      setShowDetailModal(true)
                    }}
                  >
                    {t("manage")}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emergency Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedAlert && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                  <span>
                    {t("emergencyDetails")} - {selectedAlert.citizenName}
                  </span>
                </DialogTitle>
                <DialogDescription>
                  {t("emergencyActivated")} {formatTimeAgo(selectedAlert.timestamp)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* citizen Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{t("citizenInformation")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">{t("name")}</p>
                        <p className="font-medium">{selectedAlert.citizenName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">{t("age")}</p>
                        <p className="font-medium">{selectedAlert.citizenAge}</p>
                      </div>
                    </div>
                    {/* <div>
                      <p className="text-sm font-medium text-gray-500">{t("conditions")}</p>
                      <p className="font-medium">{selectedAlert.citizenCondition}</p>
                    </div> */}
                  </CardContent>
                </Card>

                {/* Vitals */}
                {/* {selectedAlert.vitals && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{t("vitals")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        {selectedAlert.vitals.heartRate && (
                          <div className="text-center">
                            <p className="text-2xl font-bold text-red-600">{selectedAlert.vitals.heartRate}</p>
                            <p className="text-sm text-gray-500">{t("heartRate")} (bpm)</p>
                          </div>
                        )}
                        {selectedAlert.vitals.bloodPressure && (
                          <div className="text-center">
                            <p className="text-2xl font-bold text-orange-600">{selectedAlert.vitals.bloodPressure}</p>
                            <p className="text-sm text-gray-500">{t("bloodPressure")} (mmHg)</p>
                          </div>
                        )}
                        {selectedAlert.vitals.temperature && (
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{selectedAlert.vitals.temperature}°F</p>
                            <p className="text-sm text-gray-500">{t("temperature")}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )} */}

                {/* Location */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5" />
                      <span>{t("location")}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium mb-2">{selectedAlert.location.address}</p>
                    <p className="text-sm text-gray-600 mb-4">
                      {t("coordinates")}: {selectedAlert.location.latitude.toFixed(6)},{" "}
                      {selectedAlert.location.longitude.toFixed(6)}
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      {t("accuracy")}: ±{selectedAlert.location.accuracy}m
                    </p>
                    <Button onClick={() => handleViewLocation(selectedAlert)} variant="outline" className="w-full">
                      <Navigation className="h-4 w-4 mr-2" />
                      {t("viewOnMap")}
                    </Button>
                  </CardContent>
                </Card>

                {/* Emergency Contacts */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{t("emergencyContacts")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedAlert.emergencyContacts.map((contact, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{contact.name}</p>
                            <p className="text-sm text-gray-600">
                              {contact.phone} • {contact.relation}
                            </p>
                          </div>
                          <Badge variant={contact.notified ? "default" : "secondary"}>
                            {contact.notified ? t("notified") : t("pending")}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleCallcitizen(selectedAlert)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    {t("callcitizen")}
                  </Button>
                  <Button
                    onClick={() => handleCallEmergencyServices(selectedAlert)}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    {t("callEmergencyServices")}
                  </Button>
                </div>

                {selectedAlert.status === "active" && (
                  <Button
                    onClick={() => {
                      handleRespondToEmergency(selectedAlert.id)
                      setShowDetailModal(false)
                    }}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    {t("takeControl")}
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
