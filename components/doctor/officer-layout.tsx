"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Home, Users, Calendar, MessageSquare, FileText, LogOut, Activity, Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useLanguage } from "@/components/language/language-provider"
import { LanguageToggle } from "@/components/language/language-toggle"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { PWAInstallBanner } from "@/components/pwa/pwa-install-banner"
import { OfflineIndicator } from "@/components/pwa/offline-indicator"
import { useEffect, useState } from "react"
import { Logo } from "@/components/common/logo"

interface officersLayoutProps {
  children: ReactNode
}

export function OfficersLayout({ children }: officersLayoutProps) {
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

  // Ensure we're in officers context
  useEffect(() => {
    if (!pathname.startsWith("/officers")) {
      // If not in officers routes, redirect to officers dashboard
      router.push("/officers/dashboard")
    }
  }, [pathname, router])

  const navigation = [
    { name: t("dashboard"), href: "/officers/dashboard", icon: Home },
    // { name: t("citizens"), href: "/officers/citizens", icon: Users },
    // { name: t("appointments"), href: "/officers/appointments", icon: Calendar },
    { name: t("chat"), href: "/officers/chat", icon: MessageSquare },
    { name: t("reports"), href: "/officers/reports", icon: FileText },
    { name: t("analytics"), href: "/officers/analytics", icon: Activity },
  ]

  const handleLogout = () => {
    // TODO: Clear officers session and tokens
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
            <Logo size="md" variant="pro" className="text-green-900 dark:text-green-100" />
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
          <div className={`py-4 bg-green-25 dark:bg-green-900/10 border-b border-gray-200 dark:border-gray-700 transition-all duration-300 px-6`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-semibold text-sm">SS</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Sarah Smith</p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {t("officers")}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 space-y-2 transition-all duration-300 px-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.name} href={item.href} onClick={handleNavigationClick}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full transition-all duration-300 ${
                      isActive ? "bg-green-600 text-white" : "hover:bg-green-50 dark:hover:bg-green-900/20"
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
    </div>
  )
}