"use client"

import { useState, useEffect } from "react"
import { OfficersEmergencyAlerts } from "@/components/doctor/emergency-alerts"
import { PoliceLayout } from "@/components/police/police-layout"
import { useTranslation } from "react-i18next"
import AuthorityAnalytics from "@/components/authority/authority-analytics"

export default function PoliceDashboard() {
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowEmergencyAlert(true)
      // Play buzzer sound
      const context = new AudioContext()
      const oscillator = context.createOscillator()
      oscillator.type = "square"
      oscillator.frequency.setValueAtTime(1000, context.currentTime) // 1000 Hz buzzer sound
      oscillator.connect(context.destination)
      oscillator.start()
      setTimeout(() => {
        oscillator.stop()
        context.close()
      }, 1500) // Play sound for 1.5 seconds
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <PoliceLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">{t("authorityDashboardTitle")}</h2>
        {!showEmergencyAlert && (
          <div className="p-6 bg-green-100 text-green-800 rounded-lg border border-green-300">
            There are currently no emergency alerts.
          </div>
        )}
        {showEmergencyAlert && <OfficersEmergencyAlerts />}
        <AuthorityAnalytics />
      </div>
    </PoliceLayout>
  )
}
