"use client"

declare global {
  interface Window {
    loadAgent: (config: { agentId: string; xApiKey: string; variables: Record<string, string> }) => void;
  }
}

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Home, FileText, MessageSquare, Calendar, LogOut, Plus, Bot, MapPin, Pill, Activity, AlarmClock, SoupIcon, Menu, X, Target, Scan, BicepsFlexed, Dumbbell, ScanFaceIcon } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useLanguage } from "@/components/language/language-provider"
import { LanguageToggle } from "@/components/language/language-toggle"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { PWAInstallBanner } from "@/components/pwa/pwa-install-banner"
import { OfflineIndicator } from "@/components/pwa/offline-indicator"
import { useEffect, useState } from "react"
import { Logo } from "@/components/common/logo"
import { EmergencySOSButton } from "../emergency/emergency-sos-button"
import FaceBlurPage from "@/app/citizen/face-blur/page";

interface citizenLayoutProps {
  children: ReactNode
}

export function CitizenLayout({ children }: citizenLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLanguage()
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Ensure we're in citizen context
useEffect(() => {
  const loadAgentsCdn = (version: string, callback: () => void) => {
    const cssId = "desivocal-style"
    const jsId = "desivocal-script"

    if (!document.getElementById(cssId)) {
      const cssLink = document.createElement("link")
      cssLink.id = cssId
      cssLink.rel = "stylesheet"
      cssLink.type = "text/css"
      cssLink.href = `https://cdn.jsdelivr.net/npm/@desivocal/agents-cdn@${version}/dist/style.css`
      document.head.appendChild(cssLink)
    }

    if (!document.getElementById(jsId)) {
      const jsScript = document.createElement("script")
      jsScript.id = jsId
      jsScript.type = "text/javascript"
      jsScript.src = `https://cdn.jsdelivr.net/npm/@desivocal/agents-cdn@${version}/dist/dv-agent.es.js`
      jsScript.onload = () => callback()
      document.head.appendChild(jsScript)
    } else {
      callback()
    }
  }

  loadAgentsCdn("1.0.3", () => {
    if (typeof window.loadAgent === "function") {
      window.loadAgent({
        agentId: "e0f2fc6f-b0ca-4f18-befc-79adc6c2e73f",
        xApiKey: "f8216410-1cbe-4947-8fd8-1714db827172",
        variables: { callee_name: "CALLEE_NAME" },
      })
    } else {
      console.warn("DesiVocal agent script loaded but `loadAgent` not found.")
    }
  })
}, [])



  const navigation = [
    { name: t("dashboard"), href: "/citizen/dashboard", icon: Home },
    { name: t("goals"), href: "/citizen/face-blur", icon:ScanFaceIcon},
    { name: t("symptomScreening"), href: "/citizen/symptoms", icon: Plus },
    { name: t("medReminder"), href: "/citizen/med-reminder", icon: AlarmClock },
    { name: t("postOpFollowup"), href: "/citizen/postop-followup", icon: Activity },
    { name: t("scanAnalysis"), href: "/citizen/notice-interpreter", icon: Scan },
    // { name: t("recipes"), href: "/citizen/recipes", icon: SoupIcon },
    // { name: t("healthFitnessPlan"), href: "/citizen/health-plan", icon: Dumbbell },
    // { name: t("workout"), href: "/citizen/workout", icon: BicepsFlexed },
    // { name: t("appointments"), href: "/citizen/appointments", icon: Calendar },
    { name: t("nearbyHospitals"), href: "/citizen/hospitals", icon: MapPin },
    // { name: t("aiPrescriptions"), href: "/citizen/ai-prescriptions", icon: Bot },
    // { name: t("prescriptions"), href: "/citizen/prescriptions", icon: Pill },
    { name: t("medicalRecords"), href: "/citizen/records", icon: FileText },
    { name: t("chat"), href: "/citizen/chat", icon: MessageSquare },
    
  ]

  const handleLogout = () => {
    // TODO: Clear user session and tokens
    // TODO: Call logout API endpoint
    // TODO: Clear local storage/cookies
    router.push("/auth")
  }

  const handleNavigationClick = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PWAInstallBanner />
      <OfflineIndicator />

      {/* Sticky Header with Logo */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="md:hidden"
              >
                {isMobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            )}
            <Logo size="md" variant="default" isLanding={false} className="text-blue-900 dark:text-blue-100" />
            
          </div>
          <div className="flex items-center space-x-4">
            
            <LanguageToggle />
            {/* <NotificationBell /> */}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobile && isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Navigation Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-40 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out ${
          isMobile 
            ? (isMobileSidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full w-64')
            : 'w-64'
        }`}
        style={{ top: '64px' }} // Account for sticky header height
      >
        <div
          className="flex flex-col h-full overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 64px)' }}
        >
          {/* User Info */}
          <div className={`py-4 bg-blue-25 dark:bg-blue-900/10 border-b border-gray-200 dark:border-gray-700 transition-all duration-300 px-6`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">D</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Devendra</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">{t("citizen")}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 space-y-2 transition-all duration-300 px-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const isPending = item.href.includes('/pending')
              return (
                <Link key={item.name} href={item.href} onClick={handleNavigationClick}>
                  <Button
                    variant={isActive && !isPending ? "default" : "ghost"}
                    className={`w-full transition-all duration-300 ${
                      isActive && !isPending ? "bg-blue-600 text-white" : "hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    } justify-start`}
                    title={undefined}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="ml-3">{item.name}</span>
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* User Actions (Sticky Logout) */}
          <div className="border-t border-gray-200 dark:border-gray-700 transition-all duration-300 p-4 sticky bottom-0 bg-white dark:bg-gray-800 z-10">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-red-200 text-red-600 hover:bg-red-50 w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t("logout")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ease-in-out ${
        isMobile ? 'ml-0' : 'ml-64'
      }`} style={{ marginTop: '64px' }}>
        <main className="p-8">{children}</main>
      </div>
      {/* Emergency SOS Button - fixed position */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
        <EmergencySOSButton />
      </div>
    </div>
  )
}
