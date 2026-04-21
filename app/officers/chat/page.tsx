"use client"

import React, { useState, useRef, useEffect, KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Send, User, Link2, Mic, Shield, Phone, Video,
} from "lucide-react"
import { OfficersLayout } from "@/components/doctor/officer-layout"
import { getSocket } from "@/lib/socket"
import { logAccessControlAuditEvent } from "@/utils/token-gated-records"
import { useWebRtcCall } from "@/hooks/use-webrtc-call"
import { WebRtcCallDialog } from "../../../components/common/webrtc-call-dialog"

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

type PresenceCitizen = {
  id: string
  authority: AuthorityId | null
}

type RecordsLinkReadyPayload = {
  citizenId: string
  officerId: string
  link: string
  approvedAt: string
}

type RecordsLinkRequestStatusPayload = {
  ok: boolean
  citizenId: string
  reason?: string
}

type CitizenSharedRecordsPayload = {
  citizenId: string
  officerId: string
  sharedAt: string
  accessLink?: string
  records: Array<{
    recordId: string
    title: string
    type: string
    date?: string
    description?: string
    links: string[]
  }>
}

const AUTHORITY_LABELS: Record<AuthorityId, string> = {
  police: "Police",
  municipal: "Municipal",
  health: "Health",
  traffic: "Traffic",
  revenue: "Revenue",
}

export default function GrievanceChat() {
  const [selectedCitizen, setSelectedCitizen] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [citizensOnline, setCitizensOnline] = useState<PresenceCitizen[]>([])
  const [citizenTyping, setCitizenTyping] = useState(false)
  const [officerId, setOfficerId] = useState("")
  const [connected, setConnected] = useState(false)
  const [lastRecordLink, setLastRecordLink] = useState("")
  const [recordRequestStatus, setRecordRequestStatus] = useState("")
  const [accessedRecordsLink, setAccessedRecordsLink] = useState("")
  const [copyStatus, setCopyStatus] = useState("")
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const {
    isOpen: isCallDialogOpen,
    callMode,
    status: callStatus,
    activePeerId,
    localStream,
    remoteStream,
    error: callError,
    isMuted,
    isVideoEnabled,
    isBlurEnabled,
    canToggleBlur,
    startCall,
    endCall,
    acceptIncomingCall,
    rejectIncomingCall,
    toggleMute,
    toggleVideo,
    toggleBlur,
    onDialogOpenChange,
  } = useWebRtcCall({ currentUserId: officerId })

  useEffect(() => {
    const storedOfficerId = (() => {
      try {
        return localStorage.getItem("careconnect_current_officer_id") || ""
      } catch {
        return ""
      }
    })()
    const id = storedOfficerId || `OFFICER-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    setOfficerId(id)
    try {
      localStorage.setItem("careconnect_current_officer_id", id)
      window.dispatchEvent(new CustomEvent("careconnect-officer-id-updated", { detail: { officerId: id } }))
    } catch {}
    const socket = getSocket()

    const onConnect = () => {
      setConnected(true)
      socket.emit("join", { role: "officer", id })
    }

    const onDisconnect = () => {
      setConnected(false)
      setCitizensOnline([])
      setSelectedCitizen("")
    }

    const onPresence = ({ citizens }: { citizens: PresenceCitizen[]; officersOnline: boolean }) => {
      setCitizensOnline(citizens)
      if (!selectedCitizen && citizens.length > 0) {
        setSelectedCitizen(citizens[0].id)
      }
      if (selectedCitizen && !citizens.some(c => c.id === selectedCitizen)) {
        setSelectedCitizen(citizens[0]?.id || "")
      }
    }

    const onNewMessage = (msg: Message) => {
      setMessages(prev => [...prev, msg])
    }

    const onTyping = ({ fromRole, isTyping }: { fromRole: string; isTyping: boolean }) => {
      if (fromRole === "citizen") setCitizenTyping(isTyping)
    }

    const onRecordsLinkReady = (payload: RecordsLinkReadyPayload) => {
      if (payload.officerId !== id) return
      setLastRecordLink(payload.link)
      setRecordRequestStatus(`Approved by ${payload.citizenId}`)
      logAccessControlAuditEvent({
        action: "records_link_approval_received",
        status: "success",
        actorRole: "officer",
        actorId: id,
        officerId: id,
        citizenId: payload.citizenId,
        details: {
          link: payload.link,
          approvedAt: payload.approvedAt,
        },
        direction: "read",
      })
      setMessages(prev => [
        ...prev,
        {
          id: `${Date.now()}-records-link`,
          content: `Records access approved by ${payload.citizenId}. Open: ${payload.link}`,
          sender: "authority",
          citizenId: payload.citizenId,
          authority: "health",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          type: "text",
        },
      ])
    }

    const onRecordsLinkRequestStatus = (payload: RecordsLinkRequestStatusPayload) => {
      if (payload.ok) {
        setRecordRequestStatus(`Request sent to ${payload.citizenId}`)
        logAccessControlAuditEvent({
          action: "records_link_request_status",
          status: "success",
          actorRole: "officer",
          actorId: id,
          officerId: id,
          citizenId: payload.citizenId,
          details: {
            ok: payload.ok,
            reason: payload.reason || null,
          },
          direction: "read",
        })
      } else {
        setRecordRequestStatus(payload.reason || `Failed to send request to ${payload.citizenId}`)
        logAccessControlAuditEvent({
          action: "records_link_request_status",
          status: "error",
          actorRole: "officer",
          actorId: id,
          officerId: id,
          citizenId: payload.citizenId,
          details: {
            ok: payload.ok,
          },
          error: payload.reason || `Failed to send request to ${payload.citizenId}`,
          direction: "read",
        })
      }
    }

    const onCitizenSharedRecords = (payload: CitizenSharedRecordsPayload) => {
      if (payload.officerId !== id) return
      const totalLinks = payload.records.reduce((acc, rec) => acc + (Array.isArray(rec.links) ? rec.links.length : 0), 0)
      const firstLink = payload.records.find((rec) => rec.links?.[0])?.links?.[0] || ""
      const finalAccessLink = payload.accessLink || `${window.location.origin}/officers/accessedRecords?shareToOfficer=${encodeURIComponent(payload.officerId)}`
      setAccessedRecordsLink(finalAccessLink)
      logAccessControlAuditEvent({
        action: "citizen_records_shared_received",
        status: "success",
        actorRole: "officer",
        actorId: id,
        officerId: id,
        citizenId: payload.citizenId,
        details: {
          sharedAt: payload.sharedAt,
          accessLink: finalAccessLink,
          totalRecords: payload.records.length,
          totalLinks,
          recordIds: payload.records.map((record) => record.recordId),
          records: payload.records,
        },
        direction: "read",
      })
      setMessages(prev => [
        ...prev,
        {
          id: `${Date.now()}-records-shared`,
          content: `Citizen shared ${payload.records.length} record(s) (${totalLinks} file link(s)). Open list: ${finalAccessLink} ${firstLink ? `| First link: ${firstLink}` : ""}`,
          sender: "authority",
          citizenId: payload.citizenId,
          authority: "health",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          type: "text",
        },
      ])
      setRecordRequestStatus(`Received ${payload.records.length} shared record(s) from ${payload.citizenId}`)
    }

    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)
    socket.on("presence", onPresence)
    socket.on("new_message", onNewMessage)
    socket.on("typing", onTyping)
    socket.on("records_link_ready", onRecordsLinkReady)
    socket.on("records_link_request_status", onRecordsLinkRequestStatus)
    socket.on("citizen_records_shared", onCitizenSharedRecords)

    if (socket.connected) onConnect()

    return () => {
      socket.off("connect", onConnect)
      socket.off("disconnect", onDisconnect)
      socket.off("presence", onPresence)
      socket.off("new_message", onNewMessage)
      socket.off("typing", onTyping)
      socket.off("records_link_ready", onRecordsLinkReady)
      socket.off("records_link_request_status", onRecordsLinkRequestStatus)
      socket.off("citizen_records_shared", onCitizenSharedRecords)
    }
  }, [])

  useEffect(() => {
    if (!selectedCitizen) return
    if (!citizensOnline.some(c => c.id === selectedCitizen)) {
      setSelectedCitizen(citizensOnline[0]?.id || "")
    }
  }, [citizensOnline, selectedCitizen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, selectedCitizen, citizenTyping])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    const socket = getSocket()
    socket.emit("typing", { fromRole: "officer", isTyping: true })
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => {
      socket.emit("typing", { fromRole: "officer", isTyping: false })
    }, 1500)
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedCitizen) return

    const citizen = citizensOnline.find(c => c.id === selectedCitizen)
    const authority = (citizen?.authority || "police") as AuthorityId

    const socket = getSocket()
    socket.emit("send_message", {
      content: newMessage,
      sender: "authority",
      citizenId: selectedCitizen,
      authority,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "text",
    })

    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    socket.emit("typing", { fromRole: "officer", isTyping: false })
    setNewMessage("")
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleRequestRecordsLink = () => {
    if (!selectedCitizen || !officerId) return
    const citizen = citizensOnline.find(c => c.id === selectedCitizen)
    const authority = (citizen?.authority || "health") as AuthorityId
    const link = `${window.location.origin}/citizen/records?citizenId=${encodeURIComponent(selectedCitizen)}&shareToOfficer=${encodeURIComponent(officerId)}&source=officer-chat`
    const socket = getSocket()
    socket.emit("request_records_link", {
      officerId,
      citizenId: selectedCitizen,
      authority,
      link,
      requestedAt: new Date().toISOString(),
    })
    logAccessControlAuditEvent({
      action: "request_records_link_sent",
      status: "success",
      actorRole: "officer",
      actorId: officerId,
      officerId,
      citizenId: selectedCitizen,
      authority,
      details: {
        link,
      },
    })
    setLastRecordLink(link)
  }

  const handleCopyAccessLink = async () => {
    if (!accessedRecordsLink) return
    try {
      await navigator.clipboard.writeText(accessedRecordsLink)
      setCopyStatus("Copied")
      logAccessControlAuditEvent({
        action: "accessed_records_link_copied",
        status: "success",
        actorRole: "officer",
        actorId: officerId || "unknown-officer",
        officerId: officerId || undefined,
        citizenId: selectedCitizen || undefined,
        details: {
          accessedRecordsLink,
        },
      })
      setTimeout(() => setCopyStatus(""), 1500)
    } catch {
      setCopyStatus("Copy failed")
      logAccessControlAuditEvent({
        action: "accessed_records_link_copied",
        status: "error",
        actorRole: "officer",
        actorId: officerId || "unknown-officer",
        officerId: officerId || undefined,
        citizenId: selectedCitizen || undefined,
        details: {
          accessedRecordsLink,
        },
        error: "Clipboard copy failed",
      })
    }
  }

  const handleOpenAccessedRecords = () => {
    if (!accessedRecordsLink) return
    window.open(accessedRecordsLink, "_blank")
    logAccessControlAuditEvent({
      action: "accessed_records_opened",
      status: "success",
      actorRole: "officer",
      actorId: officerId || "unknown-officer",
      officerId: officerId || undefined,
      citizenId: selectedCitizen || undefined,
      details: {
        accessedRecordsLink,
      },
    })
  }

  const handleStartAudioCall = () => {
    if (!selectedCitizen) return
    startCall(selectedCitizen, "audio")
  }

  const handleStartVideoCall = () => {
    if (!selectedCitizen) return
    startCall(selectedCitizen, "video")
  }

  const currentMessages = messages.filter(m => m.citizenId === selectedCitizen)

  return (
    <OfficersLayout>
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Officer Live Chat</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Officer ID: {officerId || "..."}</Badge>
              <Badge className={connected ? "bg-green-500 text-white" : ""} variant={connected ? "default" : "secondary"}>
                {connected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
          </div>

          <div className="flex gap-6 h-[calc(100vh-240px)]">
            <Card className="w-96 flex flex-col shadow-lg">
              <CardHeader className="pb-4 border-b">
                <CardTitle className="text-xl">Online Citizens ({citizensOnline.length})</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0">
                <div className="space-y-2 p-4">
                  {citizensOnline.length === 0 && (
                    <p className="text-sm text-gray-500">No citizen tab connected yet.</p>
                  )}
                  {citizensOnline.map(citizen => {
                    const unread = messages.filter(m => m.citizenId === citizen.id && m.sender === "citizen").length
                    return (
                      <div
                        key={citizen.id}
                        onClick={() => setSelectedCitizen(citizen.id)}
                        className={`p-4 cursor-pointer rounded-lg border transition-all duration-200 ${selectedCitizen === citizen.id ? "bg-blue-50 border-blue-200 shadow-md" : "hover:bg-gray-50 border-gray-200"}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-gray-900">{citizen.id}</p>
                          {unread > 0 && <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">{unread}</span>}
                        </div>
                        <p className="text-xs text-gray-600">Department: {citizen.authority ? AUTHORITY_LABELS[citizen.authority] : "Unknown"}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs">
                          <span className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="text-gray-600">Online</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="flex-1 flex flex-col">
              <Card className="mb-4 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{selectedCitizen || "Select a citizen"}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-sm text-gray-600">Live session</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" className="hidden md:flex" onClick={handleStartAudioCall} disabled={!selectedCitizen}><Phone className="h-4 w-4" /><span className="ml-1">Call</span></Button>
                      <Button variant="outline" size="sm" className="hidden md:flex" onClick={handleStartVideoCall} disabled={!selectedCitizen}><Video className="h-4 w-4" /><span className="ml-1">Video</span></Button>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700"><Shield className="h-4 w-4 inline mr-1" />Citizen identity is protected. Live synchronized messaging enabled.</p>
                    {accessedRecordsLink && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Button size="sm" onClick={handleOpenAccessedRecords}>
                          View Accessed Records
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCopyAccessLink}>
                          Copy Link
                        </Button>
                        {copyStatus && <span className="text-xs text-blue-700">{copyStatus}</span>}
                      </div>
                    )}
                  </div>
                </CardHeader>
              </Card>

              <Card className="flex-1 flex flex-col shadow-lg overflow-hidden">
                <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                  {!selectedCitizen ? (
                    <div className="text-center py-12 text-gray-500">Select a citizen from the left panel to start chatting.</div>
                  ) : currentMessages.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">No messages yet.</div>
                  ) : (
                    <>
                      {currentMessages.map(message => (
                        <div key={message.id} className={`flex ${message.sender === "authority" ? "justify-end" : "justify-start"}`}>
                          <div className={`flex items-start space-x-3 max-w-[75%] ${message.sender === "authority" ? "flex-row-reverse space-x-reverse" : ""}`}>
                            <Avatar className="w-10 h-10 shadow-md">
                              {message.sender === "authority" ? (
                                <AvatarFallback className="bg-gray-200"><Shield className="h-5 w-5 text-gray-600" /></AvatarFallback>
                              ) : (
                                <AvatarFallback className="bg-blue-100"><User className="h-5 w-5 text-blue-600" /></AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex flex-col">
                              <div className={`rounded-2xl px-4 py-3 shadow-sm ${message.sender === "authority" ? "bg-blue-500 text-white rounded-br-md" : "bg-white border border-gray-200 rounded-bl-md"}`}>
                                <p className="text-sm leading-relaxed">{message.content}</p>
                              </div>
                              <div className={`flex items-center mt-1 space-x-2 ${message.sender === "authority" ? "justify-end" : "justify-start"}`}>
                                <span className="text-xs text-gray-500">{message.timestamp}</span>
                                <Badge variant="outline" className="text-xs">{message.sender === "authority" ? "You" : "Citizen"}</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {citizenTyping && (
                        <div className="flex justify-start">
                          <div className="flex items-start space-x-3">
                            <Avatar className="w-10 h-10 shadow-md"><AvatarFallback className="bg-blue-100"><User className="h-5 w-5 text-blue-600" /></AvatarFallback></Avatar>
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
                  <div className="flex items-center space-x-3">
                    <Button variant="outline" size="sm" className="shrink-0" onClick={handleRequestRecordsLink} disabled={!selectedCitizen || !officerId}>
                      <Link2 className="h-4 w-4" />
                    </Button>
                    <Input value={newMessage} onChange={handleInputChange} onKeyPress={handleKeyPress} placeholder={selectedCitizen ? `Respond to ${selectedCitizen}...` : "Select a citizen first"} className="bg-white" disabled={!selectedCitizen} />
                    <Select defaultValue="response">
                      <SelectTrigger className="w-32 bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="response">Response</SelectItem>
                        <SelectItem value="query">Query</SelectItem>
                        <SelectItem value="escalation">Escalation</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" className="shrink-0"><Mic className="h-4 w-4" /></Button>
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim() || !selectedCitizen} className="shrink-0 bg-blue-500 hover:bg-blue-600"><Send className="h-4 w-4" /></Button>
                  </div>
                  {lastRecordLink && selectedCitizen && (
                    <div className="mt-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                      Requested records link for {selectedCitizen}. {recordRequestStatus || "Awaiting citizen approval."}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <WebRtcCallDialog
        open={isCallDialogOpen}
        onOpenChange={onDialogOpenChange}
        onEndCall={endCall}
        onAccept={acceptIncomingCall}
        onReject={rejectIncomingCall}
        mode={callMode}
        status={callStatus}
        peerId={activePeerId}
        localStream={localStream}
        remoteStream={remoteStream}
        error={callError}
        peerLabel="Citizen"
        isMuted={isMuted}
        isVideoEnabled={isVideoEnabled}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        canToggleBlur={canToggleBlur}
        isBlurEnabled={isBlurEnabled}
        onToggleBlur={toggleBlur}
      />
    </OfficersLayout>
  )
}
