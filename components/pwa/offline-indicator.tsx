"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { WifiOff, Wifi } from "lucide-react"
import { usePWA } from "./pwa-provider"
import { useLanguage } from "@/components/language/language-provider"

export function OfflineIndicator() {
  const { isOffline, toggleOfflineMode } = usePWA()
  const { t } = useLanguage()

  return (
    <Card
      className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
        isOffline ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <WifiOff className="h-5 w-5 text-red-500" />
          <div>
            <p className="font-semibold text-sm">{t("offlineMode")}</p>
            <p className="text-xs text-gray-600 dark:text-gray-300">{t("offlineModeDesc")}</p>
          </div>
          <Button variant="outline" size="sm" onClick={toggleOfflineMode} className="ml-2">
            <Wifi className="h-4 w-4 mr-1" />
            {t("goOnline")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
