"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, X } from "lucide-react"
import { usePWA } from "./pwa-provider"
import { useLanguage } from "@/components/language/language-provider"

export function PWAInstallBanner() {
  const { isInstallable, installApp } = usePWA()
  const { t } = useLanguage()
  const [isDismissed, setIsDismissed] = useState(false)

  if (!isInstallable || isDismissed) return null

  return (
    <Card className="fixed top-10 left-1/2 transform -translate-x-1/2 z-50 w-96 shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{t("installApp")}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{t("installAppDesc")}</p>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <Button size="sm" onClick={installApp}>
              <Download className="h-4 w-4 mr-1" />
              {t("install")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsDismissed(true)} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
