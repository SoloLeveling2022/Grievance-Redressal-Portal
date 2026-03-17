"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface PWAContextType {
  isInstallable: boolean
  isInstalled: boolean
  isOffline: boolean
  installApp: () => void
  toggleOfflineMode: () => void
}

const PWAContext = createContext<PWAContextType | undefined>(undefined)

export function PWAProvider({ children }: { children: ReactNode }) {
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    // Listen for online/offline status
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Check initial online status
    setIsOffline(!navigator.onLine)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const installApp = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setIsInstallable(false)
      setDeferredPrompt(null)
    }
  }

  const toggleOfflineMode = () => {
    // TODO: Implement actual offline mode toggle
    // This is for demo purposes only
    setIsOffline((prev) => !prev)
  }

  return (
    <PWAContext.Provider
      value={{
        isInstallable,
        isInstalled,
        isOffline,
        installApp,
        toggleOfflineMode,
      }}
    >
      {children}
    </PWAContext.Provider>
  )
}

export function usePWA() {
  const context = useContext(PWAContext)
  if (context === undefined) {
    throw new Error("usePWA must be used within a PWAProvider")
  }
  return context
}
