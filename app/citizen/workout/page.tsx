"use client"

import React, { useEffect, useRef, useState } from "react"
import * as tf from "@tensorflow/tfjs"
import * as posedetection from "@tensorflow-models/pose-detection"
import "@tensorflow/tfjs-backend-webgl"
import { CitizenLayout } from "@/components/patient/patient-layout"
import { useTheme } from "next-themes"
import { Sun, Moon, PauseCircle } from "lucide-react"

// --- HOOK: useWorkoutPose ---
type ExerciseType = "pushup" | "curl"

function getAngle(a: any, b: any, c: any) {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)
  let angle = Math.abs(radians * (180 / Math.PI))
  if (angle > 180) angle = 360 - angle
  return angle
}

function useWorkoutPose(exercise: ExerciseType, onRepCount?: (count: number) => void) {
  const [repCount, setRepCount] = React.useState(0)
  const [phase, setPhase] = React.useState<"up" | "down" | null>(null)
  const [feedback, setFeedback] = React.useState<string>("")
  const [warning, setWarning] = React.useState<string>("")
  const [progress, setProgress] = React.useState<number>(0)
  const isRep = React.useRef(false)
  const onRepCountRef = React.useRef(onRepCount)
  React.useEffect(() => { onRepCountRef.current = onRepCount }, [onRepCount])

  const processPose = React.useCallback((keypoints: any[]) => {
    if (!keypoints) return
    setWarning("")
    // Map keypoints by name for easier access
    const kp: Record<string, any> = {}
    keypoints.forEach((k: any) => { if (k.score > 0.5) kp[k.name] = k })

    if (exercise === "curl") {
      const shoulder = kp["right_shoulder"]
      const elbow = kp["right_elbow"]
      const wrist = kp["right_wrist"]
      if (shoulder && elbow && wrist) {
        const angle = getAngle(shoulder, elbow, wrist)
        setProgress(Math.max(0, Math.min(100, ((160 - angle) / 110) * 100)))
        if (angle > 160) isRep.current = true
        if (isRep.current && angle < 50) {
          setRepCount((c) => {
            const newCount = c + 1
            if (onRepCountRef.current) onRepCountRef.current(newCount)
            return newCount
          })
          isRep.current = false
        }
        if (angle < 40) setFeedback("Great contraction! Squeeze at the top.")
        else if (angle > 160) setFeedback("Lower your arm fully for a full rep.")
        else setFeedback("")
        if (angle > 170) setWarning("Don't hyperextend your elbow.")
      }
    } else if (exercise === "pushup") {
      // Use right arm for pushup: shoulder, elbow, wrist
      const shoulder = kp["right_shoulder"]
      const elbow = kp["right_elbow"]
      const wrist = kp["right_wrist"]
      const leftShoulder = kp["left_shoulder"]
      const leftElbow = kp["left_elbow"]
      const leftWrist = kp["left_wrist"]
      // Use both arms for more robust detection
      if (shoulder && elbow && wrist && leftShoulder && leftElbow && leftWrist) {
        const angleR = getAngle(shoulder, elbow, wrist)
        const angleL = getAngle(leftShoulder, leftElbow, leftWrist)
        const avgAngle = (angleR + angleL) / 2
        setProgress(Math.max(0, Math.min(100, ((160 - avgAngle) / 110) * 100)))
        // Rep logic: down < 70, up > 150
        if (avgAngle < 70) isRep.current = true
        if (isRep.current && avgAngle > 150) {
          setRepCount((c) => {
            const newCount = c + 1
            if (onRepCountRef.current) onRepCountRef.current(newCount)
            return newCount
          })
          isRep.current = false
        }
        // Feedback and warnings
        if (avgAngle < 70) setFeedback("Good depth! Chest close to the ground.")
        else if (avgAngle > 150) setFeedback("Lock out at the top.")
        else setFeedback("")
        // Suggestion: if not going low enough
        if (avgAngle > 90 && avgAngle < 150) setWarning("Go lower for a full rep.")
        // Suggestion: if not locking out
        if (avgAngle < 150 && avgAngle > 70) setWarning("Lock your elbows at the top.")
        // Optional: check for hip sag (body not straight)
        const rightHip = kp["right_hip"]
        const leftHip = kp["left_hip"]
        const rightShoulderY = shoulder.y
        const leftShoulderY = leftShoulder.y
        if (rightHip && leftHip) {
          const avgHipY = (rightHip.y + leftHip.y) / 2
          const avgShoulderY = (rightShoulderY + leftShoulderY) / 2
          if (Math.abs(avgHipY - avgShoulderY) > 80) {
            setWarning("Keep your body straight! Don't let your hips sag or pike.")
          }
        }
      }
    }
  }, [exercise])

  React.useEffect(() => {
    setRepCount(0)
    setFeedback("")
    setWarning("")
    setProgress(0)
    isRep.current = false
    if (onRepCountRef.current) onRepCountRef.current(0)
  }, [exercise])

  return { repCount, feedback, warning, progress, processPose }
}

// --- COMPONENT ---
const WorkoutTracker = ({ exerciseName, onRepCount, active }: { exerciseName: ExerciseType, onRepCount: (count: number) => void, active: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { repCount, feedback, warning, progress, processPose } = useWorkoutPose(exerciseName, onRepCount)

  useEffect(() => {
    if (!active) return // Only run pose detection if active
    const setup = async () => {
      await tf.setBackend("webgl")
      await tf.ready()
      const detector = await posedetection.createDetector(
        posedetection.SupportedModels.MoveNet,
        {
          modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        }
      )
      const video = videoRef.current!
      const canvas = canvasRef.current!
      const ctx = canvas.getContext("2d")!
      navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        video.srcObject = stream
        video.play()
        video.onloadeddata = () => {
          function startIfReady() {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              canvas.width = video.videoWidth
              canvas.height = video.videoHeight
              runPoseDetection()
            } else {
              requestAnimationFrame(startIfReady)
            }
          }
          startIfReady()
        }
      })
      let stopped = false
      const runPoseDetection = async () => {
        if (!active || stopped) return
        const poses = await detector.estimatePoses(video)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        if (poses.length > 0) {
          drawKeypoints(ctx, poses[0])
          drawSkeleton(ctx, poses[0])
          processPose(poses[0].keypoints)
        }
        requestAnimationFrame(runPoseDetection)
      }
      // Cleanup on unmount or inactive
      return () => { stopped = true }
    }
    const cleanupPromise = setup()
    return () => { cleanupPromise && cleanupPromise.then(fn => fn && fn()) }
  }, [processPose, active])

  const drawKeypoints = (ctx: CanvasRenderingContext2D, pose: any) => {
    const keypoints = pose.keypoints
    keypoints.forEach((keypoint: any) => {
      const { x, y, score } = keypoint
      if (score > 0.5) {
        ctx.beginPath()
        ctx.arc(x, y, 5, 0, 2 * Math.PI)
        ctx.fillStyle = "red"
        ctx.fill()
      }
    })
  }
  const drawSkeleton = (ctx: CanvasRenderingContext2D, pose: any) => {
    const adjacentPairs = posedetection.util.getAdjacentPairs(
      posedetection.SupportedModels.MoveNet
    )
    adjacentPairs.forEach((pair) => {
      const [i, j] = pair as [number, number]
      const kp1 = pose.keypoints[i]
      const kp2 = pose.keypoints[j]
      if (kp1.score > 0.5 && kp2.score > 0.5) {
        ctx.beginPath()
        ctx.moveTo(kp1.x, kp1.y)
        ctx.lineTo(kp2.x, kp2.y)
        ctx.strokeStyle = "lime"
        ctx.lineWidth = 2
        ctx.stroke()
      }
    })
  }
  return (
    <div className="relative w-full max-w-5xl mx-auto aspect-[16/7] border rounded-2xl overflow-hidden shadow-lg bg-white dark:bg-gray-800 transition-colors duration-300">
      <video ref={videoRef} className="absolute w-full h-[full] object-cover" />
      <canvas ref={canvasRef} className="absolute w-full h-full" />
      {/* Progress Bar */}
      <div className="absolute left-4 top-4 w-[56px] h-[95%] my-auto bg-gray-200 rounded-full flex flex-col justify-end">
        <div
          className="w-full bg-green-500 rounded-full transition-all duration-300"
          style={{ height: `${progress}%` }}
        />
      </div>
      {/* Feedback overlay */}
      {feedback && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-xl text-lg font-semibold shadow-lg pointer-events-none">
          {feedback}
        </div>
      )}
      {/* Warning overlay */}
      {warning && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-yellow-600/90 text-white px-4 py-2 rounded-xl text-md font-semibold shadow-lg pointer-events-none">
          {warning}
        </div>
      )}
    </div>
  )
}

// --- CIRCULAR COUNTDOWN ---
function CircularCountdown({ seconds, onComplete }: { seconds: number, onComplete: () => void }) {
  const [timeLeft, setTimeLeft] = useState(seconds)
  useEffect(() => {
    setTimeLeft(seconds)
    if (seconds <= 0) return
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval)
          onComplete()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [seconds, onComplete])
  const radius = 40
  const stroke = 6
  const normalizedRadius = radius - stroke * 2
  const circumference = normalizedRadius * 2 * Math.PI
  const progress = (timeLeft / seconds) * circumference
  return (
    <div className="flex flex-col items-center">
      <svg height={radius * 2} width={radius * 2}>
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="#10b981"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          strokeDashoffset={circumference - progress}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <div className="absolute text-2xl font-bold text-green-600 dark:text-green-400 mt-4">{timeLeft}s</div>
    </div>
  )
}

// --- BREAK MODAL ---
function BreakModal({ open, onResume, setNum }: { open: boolean, onResume: () => void, setNum: number }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 max-w-sm w-full flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400">Set {setNum} Complete!</h2>
        <p className="mb-2 text-lg text-gray-800 dark:text-gray-200">Take a 30s break before your next set.</p>
        <CircularCountdown seconds={30} onComplete={onResume} />
      </div>
    </div>
  )
}

// --- FINAL MODAL ---
function FinalModal({ open, onClose, sets, exercise }: { open: boolean, onClose: () => void, sets: number[], exercise: ExerciseType }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 max-w-sm w-full flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-4 text-green-600 dark:text-green-400">Workout Complete!</h2>
        <p className="mb-2 text-lg text-gray-800 dark:text-gray-200">You did <span className="font-bold">{sets.length}</span> sets of {exercise === "pushup" ? "Pushups" : "Bicep Curls"}:</p>
        <ul className="mb-4 w-full text-center">
          {sets.map((set, i) => (
            <li key={i} className="text-lg text-blue-600 dark:text-blue-400">Set {i+1}: <span className="font-bold">{set}</span> reps</li>
          ))}
        </ul>
        <button
          className="mt-2 px-6 py-2 rounded bg-blue-600 text-white font-bold hover:bg-blue-700 transition"
          onClick={onClose}
        >Close</button>
      </div>
    </div>
  )
}

export default function WorkoutPage() {
  const { theme, setTheme } = useTheme()
  const [exerciseName, setExerciseName] = useState<ExerciseType>("pushup")
  const [repCount, setRepCount] = useState(0)
  const [lastSetRepBase, setLastSetRepBase] = useState(0)
  const [active, setActive] = useState(false)
  const [showBreak, setShowBreak] = useState(false)
  const [showFinal, setShowFinal] = useState(false)
  const [sets, setSets] = useState<{ [setNum: number]: number }>({})
  const [currentSetNum, setCurrentSetNum] = useState(1)
  const [showModal, setShowModal] = useState(false) // legacy, not used now

  const handleRepCount = React.useCallback((count: number) => {
    if (!active) return
    if (showBreak) return
    // Only count reps for the current set (not cumulative)
    const setReps = count - lastSetRepBase
    setRepCount(setReps)
    if (setReps > 0 && setReps % 15 === 0) {
      setSets(prev => ({ ...prev, [currentSetNum]: setReps }))
      setShowBreak(true)
    }
  }, [active, showBreak, currentSetNum, lastSetRepBase])

  const handleStart = () => {
    setRepCount(0)
    setLastSetRepBase(0)
    setActive(true)
    setShowBreak(false)
    setShowFinal(false)
    setSets({})
    setCurrentSetNum(1)
  }
  const handleEnd = () => {
    setActive(false)
    if (repCount > 0) {
      setSets(prev => ({ ...prev, [currentSetNum]: repCount }))
    }
    setRepCount(0)
    setShowFinal(true)
  }
  const handleBreak = () => {
    if (repCount > 0) {
      setSets(prev => ({ ...prev, [currentSetNum]: repCount }))
      setCurrentSetNum(prev => prev + 1)
      setLastSetRepBase(prev => prev + repCount)
      setRepCount(0)
    }
  }
  const handleCloseFinal = () => setShowFinal(false)
  const handleCloseModal = () => setShowModal(false)
  const handleResume = () => {
    setCurrentSetNum(prev => prev + 1)
    setLastSetRepBase(prev => prev + repCount)
    setRepCount(0)
    setShowBreak(false)
  }

  // For final modal, convert sets hashmap to array of reps per set
  const setsArray = Object.keys(sets)
    .sort((a, b) => Number(a) - Number(b))
    .map(key => sets[Number(key)])

  return (
    <CitizenLayout>
      <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-4 transition-colors duration-300">
        <h1 className="text-blue dark:text-white text-3xl font-bold mb-6 text-center">AI Workout Tracker</h1>
        <div className="w-full flex justify-center mb-6 min-h-[700px]">
          <WorkoutTracker exerciseName={exerciseName} onRepCount={handleRepCount} active={active && !showBreak && !showFinal} />
        </div>
        <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex flex-col md:flex-row items-center justify-between gap-4 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col items-center md:items-start">
            <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">Exercise</span>
            <select
              className="mt-1 px-3 py-2 rounded border bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none"
              value={exerciseName}
              onChange={e => setExerciseName(e.target.value as ExerciseType)}
              disabled={active}
            >
              <option value="curl">Bicep Curl</option>
              <option value="pushup">Pushup</option>
            </select>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">Reps</span>
            {!active ? (
              <button
                className="mt-2 px-6 py-2 rounded bg-green-600 text-white font-bold hover:bg-green-700 transition"
                onClick={handleStart}
              >Start</button>
            ) : (
              <div className="flex gap-2">
                <button
                  className="mt-2 px-6 py-2 rounded bg-red-600 text-white font-bold hover:bg-red-700 transition"
                  onClick={handleEnd}
                >End</button>
                <button
                  className="mt-2 ml-2 w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-lg border-2 border-yellow-300 dark:border-yellow-400 ring-2 ring-yellow-300 dark:ring-yellow-500 hover:from-yellow-500 hover:to-yellow-400 hover:scale-105 transition-all duration-200 relative group focus:outline-none focus:ring-4 focus:ring-yellow-400/60"
                  onClick={handleBreak}
                  title="Take a break and start a new set"
                  aria-label="Break"
                >
                  <PauseCircle className="w-7 h-7 text-yellow-700 dark:text-yellow-300 drop-shadow" />
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg border border-gray-800 dark:border-gray-200">
                    Break
                  </span>
                </button>
              </div>
            )}
            <span className="text-3xl font-extrabold text-green-600 dark:text-green-400 mt-2">{repCount}</span>
          </div>
        </div>
        <BreakModal open={showBreak} onResume={handleResume} setNum={currentSetNum} />
        <FinalModal open={showFinal} onClose={handleCloseFinal} sets={setsArray} exercise={exerciseName} />
      </main>
    </CitizenLayout>
  )
}
