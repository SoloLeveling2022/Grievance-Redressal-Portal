"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { io, type Socket } from "socket.io-client"

export type CallMode = "audio" | "video"
type CallStatus = "idle" | "calling" | "incoming" | "in-call"

type IncomingCallPayload = {
  from: string
  offer: RTCSessionDescriptionInit
  mode?: CallMode
}

type CallAnsweredPayload = {
  answer: RTCSessionDescriptionInit
}

type IceCandidatePayload = {
  candidate: RTCIceCandidateInit
}

type UseWebRtcCallArgs = {
  currentUserId: string
  enableFaceBlurControl?: boolean
}

type BlazeFaceModel = {
  estimateFaces: (
    input: HTMLVideoElement | HTMLCanvasElement,
    returnTensors?: boolean,
    flipHorizontal?: boolean,
  ) => Promise<
    Array<{
      topLeft: [number, number] | DOMPointReadOnly
      bottomRight: [number, number] | DOMPointReadOnly
      probability?: [number]
      landmarks?: Array<[number, number]>
    }>
  >
}

function inferModeFromOffer(offer: RTCSessionDescriptionInit): CallMode {
  const sdp = offer.sdp || ""
  const hasVideoMLine = /^m=video\s+/m.test(sdp)
  if (!hasVideoMLine) return "audio"

  // Treat disabled video m-line (port 0) as audio-only.
  const disabledVideoMLine = /^m=video\s+0\s+/m.test(sdp)
  return disabledVideoMLine ? "audio" : "video"
}

const SIGNALING_URL = "https://rtc-server-wbq3.onrender.com"

const rtcConfig: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
}

export function useWebRtcCall({ currentUserId, enableFaceBlurControl = false }: UseWebRtcCallArgs) {
  const socketRef = useRef<Socket | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const rawLocalStreamRef = useRef<MediaStream | null>(null)
  const incomingOfferRef = useRef<RTCSessionDescriptionInit | null>(null)
  const blurVideoRef = useRef<HTMLVideoElement | null>(null)
  const blurCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const blurOffscreenRef = useRef<HTMLCanvasElement | null>(null)
  const blurModelRef = useRef<BlazeFaceModel | null>(null)
  const blurRafRef = useRef<number | null>(null)
  const blurLastDetRef = useRef<number>(0)
  const blurFacesRef = useRef<Array<{ x: number; y: number; w: number; h: number }>>([])
  const blurEnabledRef = useRef(enableFaceBlurControl)

  const [isOpen, setIsOpen] = useState(false)
  const [callMode, setCallMode] = useState<CallMode>("video")
  const [status, setStatus] = useState<CallStatus>("idle")
  const [activePeerId, setActivePeerId] = useState("")
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState("")
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isBlurEnabled, setIsBlurEnabled] = useState(enableFaceBlurControl)
  const isVideoEnabledRef = useRef(true)

  const stopBlurProcessor = useCallback(() => {
    if (blurRafRef.current) {
      cancelAnimationFrame(blurRafRef.current)
      blurRafRef.current = null
    }
    blurVideoRef.current = null
    blurCanvasRef.current = null
    blurOffscreenRef.current = null
    blurFacesRef.current = []
  }, [])

  const loadBlazeFaceModel = useCallback(async () => {
    if (blurModelRef.current) return blurModelRef.current

    const [tf, blazeface] = await Promise.all([
      import("@tensorflow/tfjs-core"),
      import("@tensorflow-models/blazeface"),
      import("@tensorflow/tfjs-converter"),
      import("@tensorflow/tfjs-backend-webgl"),
    ])

    await tf.setBackend("webgl")
    await tf.ready()

    const model = await blazeface.load()
    blurModelRef.current = model as unknown as BlazeFaceModel
    return blurModelRef.current
  }, [])

  const waitForVideoMetadata = useCallback(async (video: HTMLVideoElement) => {
    if (video.readyState >= 1 && video.videoWidth > 0 && video.videoHeight > 0) return
    await new Promise<void>((resolve) => {
      const onLoaded = () => {
        video.removeEventListener("loadedmetadata", onLoaded)
        resolve()
      }
      video.addEventListener("loadedmetadata", onLoaded)
    })
  }, [])

  const startBlurredVideoPipeline = useCallback(async (rawStream: MediaStream) => {
    const inputVideo = document.createElement("video")
    inputVideo.muted = true
    inputVideo.playsInline = true
    inputVideo.srcObject = rawStream
    await inputVideo.play()
    await waitForVideoMetadata(inputVideo)

    const width = inputVideo.videoWidth || 1280
    const height = inputVideo.videoHeight || 720
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const offscreen = document.createElement("canvas")
    offscreen.width = width
    offscreen.height = height

    blurVideoRef.current = inputVideo
    blurCanvasRef.current = canvas
    blurOffscreenRef.current = offscreen
    blurLastDetRef.current = 0
    blurFacesRef.current = []

    const model = await loadBlazeFaceModel()

    const renderLoop = () => {
      const v = blurVideoRef.current
      const c = blurCanvasRef.current
      const os = blurOffscreenRef.current
      if (!v || !c || !os) return

      const ctx = c.getContext("2d")
      const osCtx = os.getContext("2d")
      if (!ctx || !osCtx) return

      osCtx.clearRect(0, 0, os.width, os.height)
      osCtx.drawImage(v, 0, 0, os.width, os.height)

      ctx.clearRect(0, 0, c.width, c.height)
      ctx.drawImage(v, 0, 0, c.width, c.height)

      const now = performance.now()
      const detectInterval = 1000 / 14
      if (now - blurLastDetRef.current >= detectInterval) {
        blurLastDetRef.current = now
        model
          .estimateFaces(v, false)
          .then((faces) => {
            blurFacesRef.current = faces.map((face) => {
              const tl = face.topLeft as [number, number]
              const br = face.bottomRight as [number, number]
              let x = Math.floor(tl[0])
              let y = Math.floor(tl[1])
              let w = Math.ceil(br[0] - tl[0])
              let h = Math.ceil(br[1] - tl[1])
              const pad = Math.floor(Math.max(w, h) * 0.22)
              x = Math.max(0, x - pad)
              y = Math.max(0, y - pad)
              w = w + pad * 2
              h = h + pad * 2
              return { x, y, w, h }
            })
          })
          .catch(() => {
            // Keep last successful detections.
          })
      }

      if (blurEnabledRef.current) {
        for (const face of blurFacesRef.current) {
          let { x, y, w, h } = face
          w = Math.min(os.width - x, w)
          h = Math.min(os.height - y, h)
          if (w <= 0 || h <= 0) continue

          const patch = document.createElement("canvas")
          patch.width = w
          patch.height = h
          const pctx = patch.getContext("2d")
          if (!pctx) continue
          pctx.drawImage(os, x, y, w, h, 0, 0, w, h)

          const blurred = document.createElement("canvas")
          blurred.width = w
          blurred.height = h
          const bctx = blurred.getContext("2d")
          if (!bctx) continue
          bctx.filter = "blur(24px)"
          bctx.drawImage(patch, 0, 0, w, h)
          ctx.drawImage(blurred, x, y, w, h)
        }
      }

      blurRafRef.current = requestAnimationFrame(renderLoop)
    }

    blurRafRef.current = requestAnimationFrame(renderLoop)

    const canvasStream = canvas.captureStream(24)
    const blurredStream = new MediaStream()
    const canvasVideoTrack = canvasStream.getVideoTracks()[0]
    const audioTrack = rawStream.getAudioTracks()[0]

    if (canvasVideoTrack) blurredStream.addTrack(canvasVideoTrack)
    if (audioTrack) blurredStream.addTrack(audioTrack)
    return blurredStream
  }, [loadBlazeFaceModel, waitForVideoMetadata])

  const stopLocalStream = useCallback(() => {
    if (localStreamRef.current && localStreamRef.current !== rawLocalStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => track.stop())
    }

    if (rawLocalStreamRef.current) {
      rawLocalStreamRef.current.getTracks().forEach((track) => track.stop())
    }

    localStreamRef.current = null
    rawLocalStreamRef.current = null
    setLocalStream(null)
    stopBlurProcessor()
  }, [stopBlurProcessor])

  const clearPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null
      peerConnectionRef.current.ontrack = null
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    setRemoteStream(null)
  }, [])

  const ensureLocalStream = useCallback(async (mode: CallMode) => {
    stopLocalStream()
    const rawStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: mode === "video",
    })
    rawLocalStreamRef.current = rawStream
    setIsMuted(false)
    setIsVideoEnabled(mode === "video")
    isVideoEnabledRef.current = mode === "video"
    const defaultBlurEnabled = enableFaceBlurControl && mode === "video"
    setIsBlurEnabled(defaultBlurEnabled)
    blurEnabledRef.current = defaultBlurEnabled
    if (mode === "audio") {
      rawStream.getVideoTracks().forEach((track) => {
        track.enabled = false
      })
    }

    let stream = rawStream
    if (enableFaceBlurControl && mode === "video") {
      // Start call setup immediately with raw stream; upgrade video track to blurred output when ready.
      void startBlurredVideoPipeline(rawStream)
        .then((blurredStream) => {
          if (rawLocalStreamRef.current !== rawStream) {
            blurredStream.getTracks().forEach((track) => track.stop())
            return
          }

          const blurredVideoTrack = blurredStream.getVideoTracks()[0]
          if (!blurredVideoTrack) return
          blurredVideoTrack.enabled = isVideoEnabledRef.current

          const audioTrack = rawStream.getAudioTracks()[0]
          const upgradedLocalStream = new MediaStream()
          upgradedLocalStream.addTrack(blurredVideoTrack)
          if (audioTrack) upgradedLocalStream.addTrack(audioTrack)

          const sender = peerConnectionRef.current
            ?.getSenders()
            .find((s) => s.track?.kind === "video")
          if (sender) {
            void sender.replaceTrack(blurredVideoTrack)
          }

          localStreamRef.current = upgradedLocalStream
          setLocalStream(upgradedLocalStream)
        })
        .catch(() => {
          // Keep call on raw stream if blur upgrade fails.
          setIsBlurEnabled(false)
          blurEnabledRef.current = false
        })
    }

    localStreamRef.current = stream
    setLocalStream(stream)
    return stream
  }, [enableFaceBlurControl, startBlurredVideoPipeline, stopLocalStream])

  const teardownCall = useCallback((closeDialog = true) => {
    clearPeerConnection()
    stopLocalStream()
    setStatus("idle")
    setError("")
    setActivePeerId("")
    setCallMode("video")
    setIsMuted(false)
    setIsVideoEnabled(true)
    setIsBlurEnabled(enableFaceBlurControl)
    blurEnabledRef.current = enableFaceBlurControl
    incomingOfferRef.current = null
    if (closeDialog) setIsOpen(false)
  }, [clearPeerConnection, enableFaceBlurControl, stopLocalStream])

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current
    if (!stream) return
    const nextMuted = !isMuted
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted
    })
    setIsMuted(nextMuted)
  }, [isMuted])

  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current
    if (!stream) return
    const tracks = stream.getVideoTracks()
    if (!tracks.length) return
    const nextVideoEnabled = !isVideoEnabled
    tracks.forEach((track) => {
      track.enabled = nextVideoEnabled
    })
    setIsVideoEnabled(nextVideoEnabled)
    isVideoEnabledRef.current = nextVideoEnabled
  }, [isVideoEnabled])

  const toggleBlur = useCallback(() => {
    if (!enableFaceBlurControl || callMode !== "video") return
    const nextValue = !isBlurEnabled
    setIsBlurEnabled(nextValue)
    blurEnabledRef.current = nextValue
  }, [callMode, enableFaceBlurControl, isBlurEnabled])

  const createPeerConnection = useCallback((targetId: string, mode: CallMode, stream: MediaStream) => {
    clearPeerConnection()
    const pc = new RTCPeerConnection(rtcConfig)
    peerConnectionRef.current = pc

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream)
    })

    pc.onicecandidate = (event) => {
      if (!event.candidate || !socketRef.current) return
      socketRef.current.emit("ice-candidate", {
        to: targetId,
        candidate: event.candidate,
      })
    }

    pc.ontrack = (event) => {
      const incoming = event.streams[0]
      if (mode === "audio") {
        incoming.getVideoTracks().forEach((track) => {
          track.enabled = false
        })
      }
      setRemoteStream(incoming)
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected" || pc.connectionState === "closed") {
        teardownCall()
      }
    }

    return pc
  }, [clearPeerConnection, teardownCall])

  const startCall = useCallback(async (targetUserId: string, mode: CallMode) => {
    if (!currentUserId || !targetUserId || !socketRef.current) return
    setError("")
    setCallMode(mode)
    setIsOpen(true)
    setStatus("calling")
    setActivePeerId(targetUserId)

    try {
      const stream = await ensureLocalStream(mode)
      const pc = createPeerConnection(targetUserId, mode, stream)
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      socketRef.current.emit("start-call", {
        from: currentUserId,
        to: targetUserId,
        offer,
        mode,
      })
    } catch {
      setError("Unable to access camera/microphone.")
      teardownCall()
    }
  }, [createPeerConnection, currentUserId, ensureLocalStream, teardownCall])

  const endCall = useCallback(() => {
    if (socketRef.current && activePeerId) {
      socketRef.current.emit("end-call", { to: activePeerId })
    }
    teardownCall()
  }, [activePeerId, teardownCall])

  const acceptIncomingCall = useCallback(async () => {
    if (!activePeerId || !incomingOfferRef.current || !socketRef.current) return
    setError("")

    try {
      const stream = await ensureLocalStream(callMode)
      const pc = createPeerConnection(activePeerId, callMode, stream)
      await pc.setRemoteDescription(new RTCSessionDescription(incomingOfferRef.current))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      socketRef.current.emit("answer-call", {
        from: currentUserId,
        to: activePeerId,
        answer,
      })

      incomingOfferRef.current = null
      setStatus("in-call")
    } catch {
      setError("Could not answer incoming call.")
      teardownCall()
    }
  }, [activePeerId, callMode, createPeerConnection, currentUserId, ensureLocalStream, teardownCall])

  const rejectIncomingCall = useCallback(() => {
    if (socketRef.current && activePeerId) {
      socketRef.current.emit("end-call", { to: activePeerId })
    }
    teardownCall()
  }, [activePeerId, teardownCall])

  const onDialogOpenChange = useCallback((open: boolean) => {
    if (!open) {
      endCall()
      return
    }
    setIsOpen(true)
  }, [endCall])

  useEffect(() => {
    if (!currentUserId) return

    const socket = io(SIGNALING_URL, {
      transports: ["websocket"],
    })
    socketRef.current = socket

    const registerSelf = () => {
      socket.emit("register-user", currentUserId)
    }

    const onIncomingCall = ({ from, offer, mode }: IncomingCallPayload) => {
      const resolvedMode = mode || inferModeFromOffer(offer)
      setError("")
      setCallMode(resolvedMode)
      setStatus("incoming")
      setActivePeerId(from)
      setIsOpen(true)
      incomingOfferRef.current = offer
    }

    const onCallAnswered = async ({ answer }: CallAnsweredPayload) => {
      const pc = peerConnectionRef.current
      if (!pc) return
      await pc.setRemoteDescription(new RTCSessionDescription(answer))
      setStatus("in-call")
    }

    const onIceCandidate = async ({ candidate }: IceCandidatePayload) => {
      const pc = peerConnectionRef.current
      if (!pc || !candidate) return
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate))
      } catch {
        setError("Network issue while establishing the call.")
      }
    }

    const onCallEnded = () => {
      teardownCall()
    }

    socket.on("connect", registerSelf)
    socket.on("incoming-call", onIncomingCall)
    socket.on("call-answered", onCallAnswered)
    socket.on("ice-candidate", onIceCandidate)
    socket.on("call-ended", onCallEnded)

    if (socket.connected) registerSelf()

    return () => {
      socket.off("connect", registerSelf)
      socket.off("incoming-call", onIncomingCall)
      socket.off("call-answered", onCallAnswered)
      socket.off("ice-candidate", onIceCandidate)
      socket.off("call-ended", onCallEnded)
      socket.disconnect()
      socketRef.current = null
      teardownCall(false)
    }
  }, [currentUserId, teardownCall])

  return {
    isOpen,
    callMode,
    status,
    activePeerId,
    localStream,
    remoteStream,
    error,
    isMuted,
    isVideoEnabled,
    isBlurEnabled,
    canToggleBlur: enableFaceBlurControl && callMode === "video",
    startCall,
    endCall,
    acceptIncomingCall,
    rejectIncomingCall,
    toggleMute,
    toggleVideo,
    toggleBlur,
    onDialogOpenChange,
  }
}
