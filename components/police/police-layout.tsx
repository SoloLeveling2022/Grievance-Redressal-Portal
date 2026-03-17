"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Home, FileText, MessageSquare, Calendar, LogOut, Shield } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useLanguage } from "@/components/language/language-provider"
import { LanguageToggle } from "@/components/language/language-toggle"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { PWAInstallBanner } from "@/components/pwa/pwa-install-banner"
import { OfflineIndicator } from "@/components/pwa/offline-indicator"
import { useEffect } from "react"
import { Logo } from "@/components/common/logo"

interface PoliceLayoutProps {
  children: ReactNode
}

export function PoliceLayout({ children }: PoliceLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLanguage()

  // Ensure we're in police context
  useEffect(() => {
    if (!pathname.startsWith("/police")) {
      // If not in police routes, redirect to police dashboard
      router.push("/police/dashboard")
    }
  }, [pathname, router])

  const navigation = [
    { name: t("dashboard"), href: "/police/dashboard", icon: Home },
    { name: t("alertHistory"), href: "/police/alert-history", icon: FileText },
  ]

  const handleLogout = () => {
    // TODO: Clear user session and tokens
    // TODO: Call logout API endpoint
    // TODO: Clear local storage/cookies
    router.push("/auth")
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PWAInstallBanner />
      <OfflineIndicator />

      {/* Navigation Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex-col items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20 py-5">
            <Logo size="md" variant="default" className="text-blue-900 dark:text-blue-100" />
            <LanguageToggle />
          </div>

          {/* User Info */}
          <div className="px-6 py-4 bg-blue-25 dark:bg-blue-900/10 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Police Officer</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">{t("police")}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start ${isActive ? "bg-blue-600 text-white" : "hover:bg-blue-50 dark:hover:bg-blue-900/20"}`}
                  >
                    <item.icon className="h-4 w-4 mr-3" />
                    {item.name}
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* User Actions */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <NotificationBell />
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t("logout")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        <main className="p-8" style={{ minHeight: "88vh" }}>
          {children}
        </main>
      </div>
    </div>
  )
}
