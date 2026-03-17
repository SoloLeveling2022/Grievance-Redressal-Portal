"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, Bot, User, Paperclip, Mic, MoreVertical, Phone, Video } from "lucide-react"
import { CitizenLayout } from "@/components/patient/patient-layout"
import { mockChatData } from "@/lib/mock-data"
import { useLanguage } from "@/components/language/language-provider"

export default function ChatPage() {
  const { t } = useLanguage()
  const [messages, setMessages] = useState(mockChatData.messages)
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      content: newMessage,
      sender: "user" as const,
      timestamp: new Date().toLocaleTimeString(),
      type: "text" as const,
    }

    setMessages((prev) => [...prev, userMessage])
    setNewMessage("")
    setIsTyping(true)

    // TODO: Send message to backend API
    // TODO: Implement real-time messaging with WebSocket
    // TODO: Add message encryption for security
    // TODO: Store chat history in database

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        content: getAIResponse(newMessage),
        sender: "ai" as const,
        timestamp: new Date().toLocaleTimeString(),
        type: "text" as const,
      }
      setMessages((prev) => [...prev, aiResponse])
      setIsTyping(false)
    }, 1500)
  }

  const getAIResponse = (userMessage: string): string => {
    // TODO: Replace with actual AI integration
    const responses = [t("aiResponse1"), t("aiResponse2"), t("aiResponse3"), t("aiResponse4")]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  const formatTime = (timestamp: string) => {
    return new Date(`2024-01-01 ${timestamp}`).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <CitizenLayout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col">
        {/* Chat Header */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src="/placeholder.svg?height=40&width=40" />
                  <AvatarFallback>
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{t("aiAssistant")}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">{t("online")}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Messages Container */}
        <Card className="flex-1 flex flex-col">
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`flex items-start space-x-2 max-w-[70%] ${
                    message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  <Avatar className="w-8 h-8">
                    {message.sender === "user" ? (
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    ) : message.sender === "ai" ? (
                      <AvatarFallback>
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    ) : (
                      <AvatarImage src="/placeholder.svg?height=32&width=32" />
                    )}
                  </Avatar>
                  <div
                    className={`rounded-lg p-3 ${
                      message.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-800"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs ${message.sender === "user" ? "text-blue-100" : "text-gray-500"}`}>
                        {formatTime(message.timestamp)}
                      </span>
                      {message.sender !== "user" && (
                        <Badge variant="secondary" className="text-xs">
                          {message.sender === "ai" ? t("ai") : t("officers")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2 max-w-[70%]">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Message Input */}
          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <Button type="button" variant="outline" size="sm">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t("typeMessage")}
                className="flex-1"
                disabled={isTyping}
              />
              <Button type="button" variant="outline" size="sm">
                <Mic className="h-4 w-4" />
              </Button>
              <Button type="submit" disabled={!newMessage.trim() || isTyping}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </CitizenLayout>
  )
}
