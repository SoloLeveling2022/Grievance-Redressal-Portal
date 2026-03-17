"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"
import { toast } from "@/components/ui/use-toast"

interface Notification {
  id: string
  title: string
  message: string
  type: "appointment" | "reminder" | "alert" | "info"
  timestamp: Date
  read: boolean
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Appointment Reminder",
      message: "You have an appointment with Dr. Smith tomorrow at 2:00 PM",
      type: "appointment",
      timestamp: new Date(),
      read: false,
    },
    {
      id: "2",
      title: "Medication Reminder",
      message: "Time to take your morning medication",
      type: "reminder",
      timestamp: new Date(Date.now() - 3600000),
      read: false,
    },
  ])

  const unreadCount = notifications.filter((n) => !n.read).length

  const addNotification = (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    }

    setNotifications((prev) => [newNotification, ...prev])

    // Show toast notification
    toast({
      title: notification.title,
      description: notification.message,
    })

    // TODO: Send push notification if permission granted
    // TODO: Store notification in backend
    // TODO: Send real-time notification via WebSocket
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  // Simulate periodic notifications
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        // 20% chance every 30 seconds
        addNotification({
          title: "Health Tip",
          message: "Remember to stay hydrated throughout the day!",
          type: "info",
        })
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
