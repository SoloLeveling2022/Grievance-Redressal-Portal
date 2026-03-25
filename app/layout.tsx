import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { PWAProvider } from "@/components/pwa/pwa-provider"
import { PWAInstallBanner } from "@/components/pwa/pwa-install-banner"
import { NotificationProvider } from "@/components/notifications/notification-provider"
import { LanguageProvider } from "@/components/language/language-provider"
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GrievanceConnect - Online Feedback & Redressal",
  description:
    "Secure, multilingual platform for citizens to submit grievances, chat anonymously, track case progress, and engage with authorities.",
  manifest: "/manifest.json",
  icons: {
    icon: "/careconnect-logo.png",
    apple: "/careconnect-logo.png",
  },
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#0ea5e9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <LanguageProvider>
            <PWAProvider>
              <PWAInstallBanner />
              <NotificationProvider>
                {children}
                <Toaster />
                <Analytics />
              </NotificationProvider>
            </PWAProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
