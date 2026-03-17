"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Stethoscope, AlarmCheck, PhoneCall } from "lucide-react"
import { Logo } from "@/components/common/logo"
import { useLanguage } from "@/components/language/language-provider"
import { LanguageToggle } from "@/components/language/language-toggle"
import MorphingCTAButton from "@/components/CTAButton"

export default function HomePage() {
  const [userType, setUserType] = useState<"citizen" | "officers" | "police">("citizen")
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")
  const { t } = useLanguage()

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock authentication logic
    console.log(`Authenticating as ${userType}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-100 dark:bg-purple-900/20 rounded-full blur-3xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-green-100 dark:bg-green-900/20 rounded-full blur-3xl opacity-20 animate-pulse delay-2000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="transform hover:scale-105 transition-transform duration-300">
            <Logo size="lg" isLanding={true} className="text-gray-900 dark:text-white" />
          </div>
          <LanguageToggle />
        </div>

        <div className="max-w-full mx-auto">
          {/* Hero Section with Spline */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12 items-center">
            {/* Text Content */}
            <div className="text-center lg:text-left space-y-6">
              <div className="relative">
                <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4 relative z-10">
                  Citi Connect
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce"></div>
                </h1>
                <div className="absolute -top-4 -left-4 w-20 h-20 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-xl"></div>
              </div>

              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent mb-4 animate-pulse">
                {t("heroTitle")}
              </h2>

              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">{t("heroSubtitle")}</p>

              {/* Stats or trust indicators */}
              <div className="flex flex-wrap gap-6 justify-center lg:justify-start mb-8">
                <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">24/7 Available</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI-Powered</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Secure & Private</span>
                </div>
              </div>
            </div>

            {/* Spline iframe */}
            <div className="w-full h-[500px] lg:h-[600px] rounded-2xl overflow-hidden shadow-2xl relative group hidden md:block">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all duration-500"></div>
              <iframe
                src="https://my.spline.design/nexbotrobotcharacterconcept-22637c44a77736a58365c65e225a8d97/"
                frameBorder="0"
                width="100%"
                height="100%"
                className="w-full h-full rounded-2xl transform group-hover:scale-101 transition-transform duration-500"
                title="NexBot Robot Character"
              />
              <span className="absolute right-4 bottom-5 z-50 bg-white dark:bg-gray-800 text-xs font-semibold px-8 py-3 rounded shadow-md">
                Grievance Connect
              </span>
              <div className="absolute inset-0 ring-1 ring-white/20 rounded-2xl pointer-events-none"></div>
            </div>
          </div>

          <MorphingCTAButton />

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <Card className="group hover:shadow-xl transition-all duration-500 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transform hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="relative mx-auto mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                    <Stethoscope className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                  {t("symptomScreener")}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{t("symptomScreenerDesc")}</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-500 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transform hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="relative mx-auto mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                    <AlarmCheck className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
                  {t("medReminderCompanion")}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{t("medReminderCompanionDesc")}</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-500 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transform hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="relative mx-auto mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                    <PhoneCall className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                  {t("postOpFollowup")}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{t("postOpFollowupDesc")}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
