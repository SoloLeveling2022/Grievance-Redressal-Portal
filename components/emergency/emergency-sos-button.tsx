"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Phone, MapPin, User, Heart } from "lucide-react"
import { useLanguage } from "@/components/language/language-provider"

interface EmergencySOSButtonProps {
  className?: string
}

interface EmergencyContact {
  name: string
  phone: string
  relation: string
}

interface LocationData {
  latitude: number
  longitude: number
  address: string
  accuracy: number
}

export function EmergencySOSButton({ className }: EmergencySOSButtonProps) {
  const { t } = useLanguage()
  const [showModal, setShowModal] = useState(false)
  const [isActivating, setIsActivating] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [location, setLocation] = useState<LocationData | null>(null)
  const [emergencyContacts] = useState<EmergencyContact[]>([
    { name: "Emergency Services", phone: "+91029384765", relation: "Emergency" },
    { name: "District Authority", phone: "+9876543210", relation: "Authority" },
    { name: "Central AUthority", phone: "+9182736450", relation: "Authority" },
  ])

  useEffect(() => {
    if (isActivating && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (isActivating && countdown === 0) {
      handleEmergencyActivation()
    }
  }, [isActivating, countdown])

  const getCurrentLocation = (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"))
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords

          // TODO: Use reverse geocoding API to get address
          // For now, using mock address
          const address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`

          resolve({
            latitude,
            longitude,
            address,
            accuracy: accuracy || 0,
          })
        },
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        },
      )
    })
  }

  const handleSOSClick = async () => {
    setShowModal(true)
    setIsActivating(true)
    setCountdown(5)

    // Get current location
    try {
      const locationData = await getCurrentLocation()
      setLocation(locationData)
    } catch (error) {
      console.error("Failed to get location:", error)
      // Continue with emergency activation even without location
    }
  }

  const handleEmergencyActivation = async () => {
    // TODO: Send emergency alert to all contacts via SMS
    // TODO: Call emergency services API
    // TODO: Send location data to emergency responders
    // TODO: Notify healthcare providers
    // TODO: Log emergency event in citizen records
    // TODO: Start continuous location tracking

    console.log("EMERGENCY ACTIVATED!")
    console.log("Location:", location)
    console.log("Emergency Contacts:", emergencyContacts)

    // Mock emergency activation
    for (const contact of emergencyContacts) {
      console.log(`Sending emergency SMS to ${contact.name} (${contact.phone})`)
      // TODO: Integrate with SMS gateway (Twilio, AWS SNS, etc.)
    }

    setIsActivating(false)
    setShowModal(false)

    // Show confirmation
    alert(t("emergencyActivated"))
  }

  const handleCancel = () => {
    setIsActivating(false)
    setCountdown(5)
    setShowModal(false)
  }

  return (
    <>
      {/* Floating Action Button */}
      <Button
        onClick={handleSOSClick}
        className={`hover:scale-105 fixed top-20 right-6 z-50 w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 ${className}`}
        size="lg"
      >
        <AlertTriangle className="h-8 w-8" />
        <span className="sr-only">{t("emergencySOS")}</span>
      </Button>

      {/* Emergency Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-6 w-6" />
              <span>{t("emergencyAlert")}</span>
            </DialogTitle>
            <DialogDescription>
              {isActivating ? t("emergencyActivatingDesc") : t("emergencyAlertDesc")}
            </DialogDescription>
          </DialogHeader>

          {isActivating ? (
            <div className="space-y-6">
              {/* Countdown */}
              <div className="text-center">
                <div className="text-6xl font-bold text-red-600 mb-2">{countdown}</div>
                <p className="text-lg font-medium">{t("emergencyCountdown")}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                  <div
                    className="bg-red-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Location Status */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{t("location")}</span>
                  </div>
                  {location ? (
                    <div className="text-sm text-gray-600">
                      <p>{location.address}</p>
                      {/* <p className="text-xs mt-1">
                        {t("accuracy")}: ±{location.accuracy.toFixed(0)}m
                      </p> */}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                      <span>{t("gettingLocation")}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Emergency Contacts */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Phone className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{t("notifyingContacts")}</span>
                  </div>
                  <div className="space-y-2">
                    {emergencyContacts.map((contact, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <User className="h-3 w-3" />
                          <span>{contact.name}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {contact.relation}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={handleCancel}
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
              >
                {t("cancelEmergency")}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-4">
                <Heart className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-600">{t("emergencyReady")}</p>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleSOSClick} className="flex-1 bg-red-600 hover:bg-red-700">
                  {t("activateEmergency")}
                </Button>
                <Button onClick={() => setShowModal(false)} variant="outline" className="flex-1">
                  {t("cancel")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
