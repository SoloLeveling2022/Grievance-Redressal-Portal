"use client"

import React, { useState, useRef, useEffect, KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Send, User, Paperclip, Mic, Shield, Phone, Video, Building2,
  AlertCircle, Clock, LucideIcon,
} from "lucide-react"
import { CitizenLayout } from "@/components/patient/patient-layout"
import { getSocket } from "@/lib/socket"

type AuthorityId = "police" | "municipal" | "health" | "traffic" | "revenue"

type Message = {
  id: string
  content: string
  sender: "citizen" | "authority"
  citizenId: string
  authority: AuthorityId
  timestamp: string
  type: "text"
}

type PresenceOfficer = {
  id: string
}

type RecordsLinkRequestPayload = {
  officerId: string
  citizenId: string
  authority?: AuthorityId
  link: string
  requestedAt: string
}

type Authority = {
  id: AuthorityId
  name: string
  department: string
  icon: LucideIcon
  description: string
  responseTime: string
  availability: string
}

const AUTHORITIES: Authority[] = [
  { id: "police", name: "Police Department", department: "Law Enforcement", icon: Shield, description: "Emergency services, crime reports, safety concerns", responseTime: "< 15 min", availability: "24/7" },
  { id: "municipal", name: "Municipal Corporation", department: "City Services", icon: Building2, description: "Infrastructure, utilities, public works", responseTime: "< 2 hours", availability: "8 AM - 6 PM" },
  { id: "health", name: "Health Department", department: "Public Health", icon: AlertCircle, description: "Health concerns, sanitation, food safety", responseTime: "< 1 hour", availability: "24/7" },
  { id: "traffic", name: "Traffic Police", department: "Traffic Management", icon: Clock, description: "Traffic violations, road safety, permits", responseTime: "< 30 min", availability: "6 AM - 10 PM" },
  { id: "revenue", name: "Revenue Department", department: "Tax & Revenue", icon: Building2, description: "Tax queries, property registration, certificates", responseTime: "< 4 hours", availability: "9 AM - 5 PM" },
]

export default function CitizenAuthorityChat() {
  const [selectedAuthority, setSelectedAuthority] = useState<AuthorityId>("police")
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [officerTyping, setOfficerTyping] = useState(false)
  const [officerOnline, setOfficerOnline] = useState(false)
  const [officerContacts, setOfficerContacts] = useState<PresenceOfficer[]>([])
  const [socketConnected, setSocketConnected] = useState(false)
  const [citizenId, setCitizenId] = useState("")
  const [pendingRecordsRequest, setPendingRecordsRequest] = useState<RecordsLinkRequestPayload | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const id = `CIT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    setCitizenId(id)
    const socket = getSocket()

    const onConnect = () => { setSocketConnected(true); socket.emit("join", { role: "citizen", id }) }
    const onDisconnect = () => { setSocketConnected(false); setOfficerOnline(false) }
    const onPresence = ({ officers, officersOnline }: { citizens: unknown[]; officers: PresenceOfficer[]; officersOnline: boolean }) => {
      setOfficerContacts(officers || [])
      setOfficerOnline(officersOnline)
    }
    const onNewMessage = (msg: Message) => setMessages(prev => [...prev, msg])
    const onTyping = ({ fromRole, isTyping }: { fromRole: string; isTyping: boolean }) => {
      if (fromRole === "officer") setOfficerTyping(isTyping)
    }

    const onRecordsLinkRequest = (payload: RecordsLinkRequestPayload) => {
      if (payload.citizenId !== id) return
      setPendingRecordsRequest(payload)
    }

    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)
    socket.on("presence", onPresence)
    socket.on("new_message", onNewMessage)
    socket.on("typing", onTyping)
    socket.on("records_link_request", onRecordsLinkRequest)
    if (socket.connected) onConnect()

    return () => {
      socket.off("connect", onConnect)
      socket.off("disconnect", onDisconnect)
      socket.off("presence", onPresence)
      socket.off("new_message", onNewMessage)
      socket.off("typing", onTyping)
      socket.off("records_link_request", onRecordsLinkRequest)
    }
  }, [])

  useEffect(() => {
    if (!citizenId) return
    getSocket().emit("set_authority", { authority: selectedAuthority })
  }, [selectedAuthority, citizenId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, officerTyping])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    const socket = getSocket()
    socket.emit("typing", { fromRole: "citizen", isTyping: true })
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => socket.emit("typing", { fromRole: "citizen", isTyping: false }), 1500)
  }

  const handleSendMessage = () => {
    if (!newMessage.trim()) return
    const socket = getSocket()
    socket.emit("send_message", {
      content: newMessage,
      sender: "citizen",
      citizenId,
      authority: selectedAuthority,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "text",
    })
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    socket.emit("typing", { fromRole: "citizen", isTyping: false })
    setNewMessage("")
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage() }
  }

  const handleApproveRecordsRequest = () => {
    if (!pendingRecordsRequest || !citizenId) return
    const socket = getSocket()
    socket.emit("approve_records_link", {
      officerId: pendingRecordsRequest.officerId,
      citizenId,
      link: pendingRecordsRequest.link,
      approvedAt: new Date().toISOString(),
    })
    window.open(pendingRecordsRequest.link, "_blank")
    setPendingRecordsRequest(null)
  }

  const currentAuthority = AUTHORITIES.find(a => a.id === selectedAuthority)!
  const currentMessages = messages.filter(m => m.authority === selectedAuthority)
  const primaryOfficerContact = officerContacts[0]?.id || "Not connected"
  const unreadByAuthority = AUTHORITIES.reduce<Record<AuthorityId, number>>((acc, a) => {
    acc[a.id] = messages.filter(m => m.authority === a.id && m.sender === "authority").length
    return acc
  }, {} as Record<AuthorityId, number>)

  return (
    <CitizenLayout>
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Citizen Services Portal</h1>
            <p className="text-gray-600">Connect with government authorities for complaints, queries, and assistance</p>
            <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
              <Badge variant="outline">Anonymous ID: {citizenId || "..."}</Badge>
              <Badge variant="outline">Contact: {primaryOfficerContact}</Badge>
              <Badge className={officerOnline ? "bg-green-500 text-white" : ""} variant={officerOnline ? "default" : "secondary"}>
                {!socketConnected ? "Connecting..." : officerOnline ? "Officer Online" : "No Officers Online"}
              </Badge>
            </div>
          </div>

          <div className="flex gap-6 h-[calc(100vh-220px)]">
            {/* Authorities sidebar */}
            <Card className="w-96 flex flex-col shadow-lg">
              <CardHeader className="pb-4 border-b">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Building2 className="h-5 w-5" />Available Authorities
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0">
                <div className="space-y-2 p-4">
                  {AUTHORITIES.map(authority => {
                    const Icon = authority.icon
                    const unread = unreadByAuthority[authority.id]
                    return (
                      <div
                        key={authority.id}
                        onClick={() => setSelectedAuthority(authority.id)}
                        className={`p-4 cursor-pointer rounded-lg border transition-all duration-200 ${selectedAuthority === authority.id ? "bg-blue-50 border-blue-200 shadow-md" : "hover:bg-gray-50 border-gray-200"}`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-gray-900 truncate">{authority.name}</p>
                              {unread > 0 && <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">{unread}</span>}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{authority.department}</p>
                            <p className="text-xs text-gray-500 mb-2">{authority.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${officerOnline ? "bg-green-500" : "bg-gray-400"}`} />
                                <span className="text-xs text-gray-600">{officerOnline ? "Available" : "Offline"}</span>
                              </div>
                              <Badge variant="secondary" className="text-xs">{authority.responseTime}</Badge>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{authority.availability}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Chat panel */}
            <div className="flex-1 flex flex-col">
              <Card className="mb-4 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <currentAuthority.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{currentAuthority.name}</CardTitle>
                        <div className="flex items-center space-x-3 mt-1">
                          <Badge variant="outline" className="text-xs">Contact: {primaryOfficerContact}</Badge>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${officerOnline ? "bg-green-500" : "bg-gray-400"}`} />
                            <span className="text-sm text-gray-600">{officerOnline ? "Available" : "Offline"}</span>
                          </div>
                          <Badge variant="secondary">{currentAuthority.department}</Badge>
                          <Badge variant="outline" className="text-xs">Response: {currentAuthority.responseTime}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" className="hidden md:flex"><Phone className="h-4 w-4" /><span className="ml-1">Call</span></Button>
                      <Button variant="outline" size="sm" className="hidden md:flex"><Video className="h-4 w-4" /><span className="ml-1">Video</span></Button>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700"><Shield className="h-4 w-4 inline mr-1" />Your identity is protected. All conversations are anonymous and secure.</p>
                  </div>
                </CardHeader>
              </Card>

              <Card className="flex-1 flex flex-col shadow-lg overflow-hidden">
                <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                  {currentMessages.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <currentAuthority.icon className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
                      <p className="text-gray-500 max-w-md mx-auto">Send your complaint or query to {currentAuthority.name}. Your identity will remain anonymous.</p>
                    </div>
                  ) : (
                    <>
                      {currentMessages.map(message => (
                        <div key={message.id} className={`flex ${message.sender === "citizen" ? "justify-end" : "justify-start"}`}>
                          <div className={`flex items-start space-x-3 max-w-[75%] ${message.sender === "citizen" ? "flex-row-reverse space-x-reverse" : ""}`}>
                            <Avatar className="w-10 h-10 shadow-md">
                              {message.sender === "citizen" ? (
                                <AvatarFallback className="bg-gray-200"><User className="h-5 w-5 text-gray-600" /></AvatarFallback>
                              ) : (
                                <AvatarFallback className="bg-blue-100"><currentAuthority.icon className="h-5 w-5 text-blue-600" /></AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex flex-col">
                              <div className={`rounded-2xl px-4 py-3 shadow-sm ${message.sender === "citizen" ? "bg-blue-500 text-white rounded-br-md" : "bg-white border border-gray-200 rounded-bl-md"}`}>
                                <p className="text-sm leading-relaxed">{message.content}</p>
                              </div>
                              <div className={`flex items-center mt-1 space-x-2 ${message.sender === "citizen" ? "justify-end" : "justify-start"}`}>
                                <span className="text-xs text-gray-500">{message.timestamp}</span>
                                <Badge variant="outline" className="text-xs">{message.sender === "citizen" ? "You" : currentAuthority.name.split(" ")[0]}</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {officerTyping && (
                        <div className="flex justify-start">
                          <div className="flex items-start space-x-3">
                            <Avatar className="w-10 h-10 shadow-md">
                              <AvatarFallback className="bg-blue-100"><currentAuthority.icon className="h-5 w-5 text-blue-600" /></AvatarFallback>
                            </Avatar>
                            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <div ref={messagesEndRef} />
                </CardContent>
                <div className="border-t bg-gray-50 p-4">
                  {pendingRecordsRequest && (
                    <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                      Officer {pendingRecordsRequest.officerId} requested your records link.
                      <div className="mt-1 text-xs text-emerald-700">
                        Requested at: {new Date(pendingRecordsRequest.requestedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Button size="sm" onClick={handleApproveRecordsRequest}>
                          Open and Share Records Link
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setPendingRecordsRequest(null)}>
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <Button variant="outline" size="sm" className="shrink-0"><Paperclip className="h-4 w-4" /></Button>
                    <Input value={newMessage} onChange={handleInputChange} onKeyPress={handleKeyPress} placeholder={`Send anonymous message to ${currentAuthority.name}...`} className="bg-white" />
                    <Select defaultValue="complaint">
                      <SelectTrigger className="w-32 bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="complaint">Complaint</SelectItem>
                        <SelectItem value="query">Query</SelectItem>
                        <SelectItem value="help">Help</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" className="shrink-0"><Mic className="h-4 w-4" /></Button>
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()} className="shrink-0 bg-blue-500 hover:bg-blue-600"><Send className="h-4 w-4" /></Button>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>Lock End-to-end encrypted - Anonymous messaging</span>
                    <span>{currentAuthority.availability}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </CitizenLayout>
  )
}
