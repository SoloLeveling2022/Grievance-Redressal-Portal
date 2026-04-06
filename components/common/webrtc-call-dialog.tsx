"use client"

import { useEffect, useRef } from "react"
import { Eye, EyeOff, Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { type CallMode } from "@/hooks/use-webrtc-call"

type CallDialogStatus = "idle" | "calling" | "incoming" | "in-call"

type WebRtcCallDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEndCall: () => void
  onAccept: () => void
  onReject: () => void
  mode: CallMode
  status: CallDialogStatus
  peerId: string
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  error: string
  audioInitialOnly?: boolean
  peerLabel: string
  isMuted: boolean
  isVideoEnabled: boolean
  onToggleMute: () => void
  onToggleVideo: () => void
  canToggleBlur?: boolean
  isBlurEnabled?: boolean
  onToggleBlur?: () => void
}

export function WebRtcCallDialog({
  open,
  onOpenChange,
  onEndCall,
  onAccept,
  onReject,
  mode,
  status,
  peerId,
  localStream,
  remoteStream,
  error,
  audioInitialOnly = false,
  peerLabel,
  isMuted,
  isVideoEnabled,
  onToggleMute,
  onToggleVideo,
  canToggleBlur = false,
  isBlurEnabled = true,
  onToggleBlur,
}: WebRtcCallDialogProps) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  const isAudioOnly = mode === "audio"
  const peerInitial = (peerId || "?").trim().charAt(0).toUpperCase() || "?"
  const statusLabel =
    audioInitialOnly && isAudioOnly
      ? status === "calling"
        ? "Calling officer... waiting for acceptance"
        : status === "incoming"
          ? "Incoming officer call"
          : status === "in-call"
            ? "Connected with officer"
            : "Start a call from chat controls"
      : status === "calling"
        ? `Calling ${peerId}... waiting for acceptance`
        : status === "incoming"
          ? `${peerId} is calling you`
          : status === "in-call"
            ? `In call with ${peerId}`
            : "Start a call from chat controls"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={
          isAudioOnly
            ? "max-w-3xl border-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white"
            : "h-screen w-screen max-w-none border-0 rounded-none sm:rounded-none bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white flex flex-col overflow-hidden"
        }
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            {isAudioOnly ? <Phone className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            {isAudioOnly ? "Audio Call" : "Video Call"}
          </DialogTitle>
          <DialogDescription className="text-blue-100/90">{statusLabel}</DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-rose-200">{error}</p>}

        {isAudioOnly ? (
          <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/5 p-8">
            <div className="pointer-events-none absolute -left-16 -top-16 h-52 w-52 rounded-full bg-sky-500/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-cyan-400/20 blur-2xl" />
            <div className="relative flex flex-col items-center justify-center gap-4 py-8">
              <div className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-white/35 bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 text-5xl font-semibold tracking-wide shadow-2xl shadow-cyan-500/30">
                {peerInitial}
              </div>
              <p className="text-lg font-medium">{peerLabel}</p>
              {!audioInitialOnly && <p className="text-sm text-blue-100/80">{peerId || "Unknown user"}</p>}
              <p className="text-sm text-blue-100/80">Voice-only session with camera blocked</p>
            </div>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/20 bg-black/30 p-3 backdrop-blur-sm">
              <p className="mb-2 text-sm font-medium text-blue-100">You</p>
              <video ref={localVideoRef} autoPlay muted playsInline className="h-[30vh] md:h-[66vh] w-full rounded-md bg-black object-cover" />
            </div>

            <div className="rounded-xl border border-white/20 bg-black/30 p-3 backdrop-blur-sm">
              <p className="mb-2 text-sm font-medium text-blue-100">{peerLabel}</p>
              <video ref={remoteVideoRef} autoPlay playsInline className="h-[30vh] md:h-[66vh] w-full rounded-md bg-black object-cover" />
            </div>
          </div>
        )}

        {isAudioOnly && <div className="flex flex-wrap items-center justify-end gap-2">
          {status === "incoming" && (
            <>
              <Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={onReject}>
                Decline
              </Button>
              <Button className="bg-emerald-500 text-white hover:bg-emerald-600" onClick={onAccept}>
                <Phone className="mr-2 h-4 w-4" />
                Accept
              </Button>
            </>
          )}

          {status === "calling" && (
            <Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={onReject}>
              Cancel Call
            </Button>
          )}

          {status === "in-call" && (
            <Button variant="destructive" onClick={onEndCall}>
              <PhoneOff className="mr-2 h-4 w-4" />
              End Call
            </Button>
          )}

          {status === "idle" && (
            <Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </div>}

        {!isAudioOnly && status !== "idle" && (
          <div className="sticky bottom-0 mt-2 rounded-xl border border-white/20 bg-black/45 p-3 backdrop-blur">
            <div className="grid grid-cols-3 items-center gap-3">
              <div className="flex items-center gap-2 justify-start">
                <Button
                  variant="outline"
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                  onClick={onToggleMute}
                >
                  {isMuted ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                  {isMuted ? "Unmute" : "Mute"}
                </Button>

                <Button
                  variant="outline"
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                  onClick={onToggleVideo}
                >
                  {isVideoEnabled ? <Video className="mr-2 h-4 w-4" /> : <VideoOff className="mr-2 h-4 w-4" />}
                  {isVideoEnabled ? "Video Off" : "Video On"}
                </Button>

                {canToggleBlur && (
                  <Button
                    variant="outline"
                    className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                    onClick={onToggleBlur}
                  >
                    {isBlurEnabled ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                    {isBlurEnabled ? "Blur On" : "Blur Off"}
                  </Button>
                )}
              </div>

              <div className="flex justify-center">
                <Button variant="destructive" onClick={status === "in-call" ? onEndCall : onReject}>
                  <PhoneOff className="mr-2 h-4 w-4" />
                  Decline
                </Button>
              </div>

              <div className="flex justify-end">
                {status === "incoming" && (
                  <Button className="bg-emerald-500 text-white hover:bg-emerald-600" onClick={onAccept}>
                    <Phone className="mr-2 h-4 w-4" />
                    Accept
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
