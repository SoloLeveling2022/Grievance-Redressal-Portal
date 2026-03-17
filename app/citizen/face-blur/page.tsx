"use client"

import { CitizenLayout } from "@/components/patient/patient-layout"
import { useCallback, useEffect, useRef, useState } from "react"
import { Camera } from "lucide-react"

// Lazy-load TFJS + BlazeFace only when starting the camera
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

export default function FaceBlurPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const offscreenRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const modelRef = useRef<BlazeFaceModel | null>(null)
  const lastDetRef = useRef<number>(0)
  const isRunningRef = useRef(false)
  const lastFacesRef = useRef<Array<{x: number, y: number, w: number, h: number}>>([])
  const blurPxRef = useRef(24)
  const targetFPSRef = useRef(15)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const longPressTimerRef = useRef<number | null>(null)

  const [isRunning, setIsRunning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [blurPx, setBlurPx] = useState(24) // Strong default to approximate Gaussian
  const [targetFPS, setTargetFPS] = useState(15) // Throttle detection for performance
  const [isRecording, setIsRecording] = useState(false)

  const setupStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: true,
    })
    streamRef.current = stream
    const v = videoRef.current!
    v.srcObject = stream
    await v.play()
    // Ensure dimensions after metadata is loaded
    if (v.readyState >= 1 && v.videoWidth && v.videoHeight) {
      const w = v.videoWidth
      const h = v.videoHeight
      const c = canvasRef.current!
      c.width = w
      c.height = h
      const os = (offscreenRef.current ||= document.createElement("canvas"))
      os.width = w
      os.height = h
    } else {
      await new Promise<void>((resolve) => {
        const handler = () => {
          const w = v.videoWidth
          const h = v.videoHeight
          const c = canvasRef.current!
          c.width = w
          c.height = h
          const os = (offscreenRef.current ||= document.createElement("canvas"))
          os.width = w
          os.height = h
          v.removeEventListener("loadedmetadata", handler)
          resolve()
        }
        v.addEventListener("loadedmetadata", handler)
      })
    }
  }, [])

  const loadModel = useCallback(async () => {
    if (modelRef.current) return
    // Load TFJS and BlazeFace with WebGL backend for performance
    const [{ setBackend, ready }, blazeface] = await Promise.all([
      import("@tensorflow/tfjs-core").then(async (tf) => {
        await import("@tensorflow/tfjs-converter")
        await import("@tensorflow/tfjs-backend-webgl")
        await tf.setBackend("webgl")
        await tf.ready()
        return tf
      }),
      import("@tensorflow-models/blazeface"),
    ])
    const model = await blazeface.load()
    modelRef.current = model as unknown as BlazeFaceModel
  }, [])

  const stop = useCallback(() => {
    isRunningRef.current = false
    setIsRunning(false)
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      stop()
    }
  }, [stop])

  const loop = useCallback(() => {
    const v = videoRef.current
    const c = canvasRef.current
    const os = offscreenRef.current
    const model = modelRef.current

    // Schedule next frame first if running
    if (isRunningRef.current) {
      rafRef.current = requestAnimationFrame(loop)
    }

    // Exit if not running or refs not ready
    if (!isRunningRef.current || !v || !c || !os || !model) return

    const ctx = c.getContext("2d")!
    const osCtx = os.getContext("2d")!

    // Draw the full frame to offscreen first
    osCtx.clearRect(0, 0, os.width, os.height)
    osCtx.drawImage(v, 0, 0, os.width, os.height)

    // Draw the original (sharp) frame to main canvas
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.drawImage(v, 0, 0, c.width, c.height)

    const now = performance.now()
    const interval = 1000 / Math.max(1, targetFPSRef.current)
    // Check if it's time to update face detection
    if (now - lastDetRef.current >= interval) {
      lastDetRef.current = now

      // Run face detection asynchronously without blocking the render loop
      model.estimateFaces(v, false).then(faces => {
        // Store the detected face regions for rendering
        lastFacesRef.current = faces.map(f => {
          const tl = f.topLeft as [number, number]
          const br = f.bottomRight as [number, number]
          let x = Math.floor(tl[0])
          let y = Math.floor(tl[1])
          let w = Math.ceil(br[0] - tl[0])
          let h = Math.ceil(br[1] - tl[1])

          // Add padding to avoid "halo" edges
          const pad = Math.floor(Math.max(w, h) * 0.25)
          x = Math.max(0, x - pad)
          y = Math.max(0, y - pad)
          w = w + pad * 2
          h = h + pad * 2

          return { x, y, w, h }
        })
      }).catch(err => {
        console.error('Face detection error:', err)
      })
    }

    // Apply blur based on the last detected faces (renders every frame)
    const faces = lastFacesRef.current
    for (const face of faces) {
      let { x, y, w, h } = face

      // Clamp to bounds
      w = Math.min(os.width - x, w)
      h = Math.min(os.height - y, h)
      if (w <= 0 || h <= 0) continue

      // Create patch canvas
      const patch = document.createElement("canvas")
      patch.width = w
      patch.height = h
      const pctx = patch.getContext("2d")!
      pctx.drawImage(os, x, y, w, h, 0, 0, w, h)

      // Apply blur filter
      const blurred = document.createElement("canvas")
      blurred.width = w
      blurred.height = h
      const bctx = blurred.getContext("2d")!
      bctx.filter = `blur(${blurPxRef.current}px)`
      bctx.drawImage(patch, 0, 0, w, h)

      // Draw the blurred patch over the main canvas at the face region
      ctx.drawImage(blurred, x, y, w, h)
    }
  }, [])

  const start = useCallback(async () => {
    if (isRunningRef.current) return
    setErr(null)
    setLoading(true)
    try {
      await setupStream()
      await loadModel()
      isRunningRef.current = true
      blurPxRef.current = blurPx
      targetFPSRef.current = targetFPS
      setIsRunning(true)
      lastFacesRef.current = [] // Reset face detections
      rafRef.current = requestAnimationFrame(loop)
    } catch (e: any) {
      console.error("[v0] face-blur start error:", e)
      setErr(e?.message || "Failed to start face blur.")
      stop()
    } finally {
      setLoading(false)
    }
  }, [loadModel, loop, setupStream, stop, blurPx, targetFPS])

  const captureImage = useCallback(() => {
    const c = canvasRef.current
    if (!c) return

    // Create a download link for the captured image
    c.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `face-blur-capture-${Date.now()}.png`
      a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }, [])

  const startRecording = useCallback(() => {
    const c = canvasRef.current
    const originalStream = streamRef.current
    if (!c || !isRunning || !originalStream) return

    try {
      recordedChunksRef.current = []
      const canvasStream = c.captureStream(30) // 30 fps
      
      // Combine canvas video with original audio
      const combinedStream = new MediaStream()
      
      // Add video track from canvas
      const videoTrack = canvasStream.getVideoTracks()[0]
      if (videoTrack) {
        combinedStream.addTrack(videoTrack)
      }
      
      // Add audio track from original stream
      const audioTrack = originalStream.getAudioTracks()[0]
      if (audioTrack) {
        combinedStream.addTrack(audioTrack)
      }
      
      const recorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9',
      })

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `face-blur-video-${Date.now()}.webm`
        a.click()
        URL.revokeObjectURL(url)
        recordedChunksRef.current = []
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch (err) {
      console.error('Recording error:', err)
    }
  }, [isRunning])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
      setIsRecording(false)
    }
  }, [])

  const handleMouseDown = useCallback(() => {
    if (!isRunning) return

    // Start long press timer (500ms)
    longPressTimerRef.current = window.setTimeout(() => {
      startRecording()
      longPressTimerRef.current = null
    }, 500)
  }, [isRunning, startRecording])

  const handleMouseUp = useCallback(() => {
    // If timer is still active, it was a short press (capture image)
    if (longPressTimerRef.current !== null) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
      captureImage()
    } else if (isRecording) {
      // Long press ended, stop recording
      stopRecording()
    }
  }, [captureImage, isRecording, stopRecording])

  useEffect(() => {
    // Cleanup recording on unmount
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
      stopRecording()
    }
  }, [stopRecording])

  return (
    <CitizenLayout>
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-pretty">Face Blur (Browser)</h1>
        <p className="text-sm text-muted-foreground">
          Click Start to open your camera and blur detected faces in real time.
        </p>
      </header>

      <div className="flex items-center gap-3">
        <button
          className="inline-flex items-center rounded-md bg-black text-white px-4 py-2 text-sm disabled:opacity-50"
          onClick={start}
          disabled={loading || isRunning}
          aria-busy={loading ? "true" : "false"}
        >
          {loading ? "Starting…" : "Start"}
        </button>
        <button
          className="inline-flex items-center rounded-md border px-4 py-2 text-sm disabled:opacity-50"
          onClick={stop}
          disabled={!isRunning}
        >
          Stop
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Blur strength (px)</span>
          <input
            type="range"
            min={4}
            max={48}
            step={2}
            value={blurPx}
            onChange={(e) => {
              const val = Number.parseInt(e.target.value, 10)
              setBlurPx(val)
              blurPxRef.current = val
            }}
          />
          <span className="text-xs text-muted-foreground">{blurPx}px</span>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Detection FPS</span>
          <input
            type="range"
            min={5}
            max={30}
            step={1}
            value={targetFPS}
            onChange={(e) => {
              const val = Number.parseInt(e.target.value, 10)
              setTargetFPS(val)
              targetFPSRef.current = val
            }}
          />
          <span className="text-xs text-muted-foreground">{targetFPS} fps</span>
        </label>
      </div>

      {err ? (
        <div role="alert" className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      <div className="space-y-4">
        <section className="relative aspect-video w-full rounded-lg overflow-hidden border bg-black">
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            playsInline
            muted
            autoPlay
            aria-hidden="true"
            style={{ visibility: "hidden" }}
          />
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-label="Blurred faces output" />
        </section>

        {isRunning && (
          <div className="flex justify-center">
            <button
              className={`inline-flex items-center justify-center rounded-full border-2 p-4 text-white transition-all ${
                isRecording
                  ? "bg-red-600 border-red-600 animate-pulse"
                  : "bg-black border-black hover:bg-gray-800"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchEnd={handleMouseUp}
              disabled={!isRunning}
              aria-label={isRecording ? "Recording video" : "Capture photo or hold to record video"}
              title="Click to capture photo, hold to record video"
            >
              <Camera className="h-6 w-6" />
            </button>
          </div>
        )}
      </div>

      {/* <details className="rounded-md border p-3">
        <summary className="cursor-pointer text-sm font-medium">Why not run the Python script from here?</summary>
        <p className="mt-2 text-sm text-muted-foreground">
          Browsers cannot launch local Python processes or open native windows for security reasons. This page
          replicates the effect fully in the browser. Your original Python script has been added to scripts/face_blur.py
          for reference.
        </p>
      </details> */}
    </main>
    </CitizenLayout>
  )
}
