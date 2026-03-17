"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CitizenLayout } from "@/components/patient/patient-layout"
import { Label } from "@/components/ui/label"
import { MessageSquareHeart, PhoneCall } from "lucide-react"

const metrics = [
  { key: "responsiveness", label: "Responsiveness", emojis: ["😞", "😐", "🙂", "😊", "🤩"] },
  { key: "clarity", label: "Clarity of Updates", emojis: ["😞", "😐", "🙂", "😊", "🤩"] },
  { key: "professionalism", label: "Professionalism", emojis: ["😞", "😐", "🙂", "😊", "🤩"] },
]

// Emoji scoring map
const emojiScores: Record<string, number> = {
  "😞": 1,
  "😐": 2,
  "🙂": 3,
  "😊": 4,
  "🤩": 5,
}

// Feedback messages for ranges
const feedbackMessages = [
  { min: 0, max: 20, message: "😢 We're very sorry to hear this. Your experience matters and we’ll prioritize improvements." },
  { min: 21, max: 33, message: "😟 Thank you for sharing. We understand there are issues and will work on them quickly." },
  { min: 34, max: 45, message: "😐 Mixed feedback received. We’ll strive to improve clarity and consistency." },
  { min: 46, max: 55, message: "🙂 We appreciate your feedback! Some areas are working, but we can do better." },
  { min: 56, max: 65, message: "😊 Glad to know you had a fairly positive experience. We’ll keep refining further." },
  { min: 66, max: 75, message: "🤝 Thanks for your trust. We’re happy with the results but won’t stop improving." },
  { min: 76, max: 85, message: "🌟 Great feedback! We’re delighted and motivated to keep up the good work." },
  { min: 86, max: 95, message: "💙 Awesome! Your experience means a lot and shows we’re on the right path." },
  { min: 96, max: 99, message: "🔥 Nearly perfect! We're thrilled your journey was smooth and helpful." },
  { min: 100, max: 100, message: "🎉 Perfect score! Thank you for your trust — we’ll continue to deliver excellence!" },
]

// Calculate message based on score
const getFeedbackMessage = (form: { [k: string]: string }) => {
  const totalScore = Object.values(form).reduce((sum, emoji) => sum + (emojiScores[emoji] || 0), 0)
  const maxScore = metrics.length * 5
  const percentage = Math.round((totalScore / maxScore) * 100)

  const matched = feedbackMessages.find(f => percentage >= f.min && percentage <= f.max)
  return { message: matched ? matched.message : null, percentage }
}

export default function FollowUpsFeedbackPage() {
  const [form, setForm] = useState<{ [k: string]: string }>({ responsiveness: "", clarity: "", professionalism: "" })
  const [history, setHistory] = useState<any[]>([])
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)

  const [isCallInitiating, setIsCallInitiating] = useState(false)
  const [callStatus, setCallStatus] = useState<string | null>(null)
  const [callError, setCallError] = useState<string | null>(null)

  const handleVoiceAICall = async () => {
    setIsCallInitiating(true)
    setCallStatus("Initiating follow-ups voice agent demo...")
    setCallError(null)

    try {
      const response = await fetch("https://api.bolna.ai/call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer bn-06d2bf09278141bea83202353e9893f1`,
        },
        body: JSON.stringify({
          agent_id: "321a8372-145a-44c1-b626-f40d880367d4",
          recipient_phone_number: "+917981367685",
        }),
      })

      const data = await response.json()
      if (response.ok) {
        setCallStatus("✅ Follow-ups voice agent initiated!")
        setTimeout(() => setCallStatus(null), 5000)
      } else {
        setCallError(data.error || "Failed to initiate call")
        setTimeout(() => setCallError(null), 5000)
      }
    } catch (err) {
      setCallError("❌ Error connecting to voice AI service")
      setTimeout(() => setCallError(null), 5000)
    } finally {
      setIsCallInitiating(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const entry = { ...form, date: new Date().toLocaleString() }
    setHistory([entry, ...history])
    const { message } = getFeedbackMessage(form)
    setFeedbackMessage(message)
    setForm({ responsiveness: "", clarity: "", professionalism: "" })
  }

  return (
    <CitizenLayout>
      <div className="max-w-2xl mx-auto py-8 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
            <MessageSquareHeart className="h-7 w-7 text-pink-500" /> Follow-ups & Feedback
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2 text-base">
            Provide feedback on your complaint handling by tapping an emoji for each field.
          </p>
        </div>

        {/* Voice AI Call Section */}
        {/* <Card className="border-2 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PhoneCall className="h-5 w-5 text-blue-600" />
              <span>Voice Agent Demo (Follow-ups)</span>
            </CardTitle>
            <CardDescription>Get a demo call from our AI assistant for follow-ups</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              onClick={handleVoiceAICall}
              disabled={isCallInitiating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isCallInitiating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Initiating Voice AI Call...
                </>
              ) : (
                <>
                  <PhoneCall className="h-4 w-4 mr-2" />
                  Start Follow-ups Voice Agent
                </>
              )}
            </Button>
            {callStatus && <p className="mt-3 text-sm text-blue-700 dark:text-blue-300">{callStatus}</p>}
            {callError && <p className="mt-3 text-sm text-red-600">{callError}</p>}
          </CardContent>
        </Card> */}

        {/* Feedback Form */}
        <Card className="shadow-md border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">Feedback</CardTitle>
            <CardDescription>Tap the emoji that best matches your experience for each field.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-8" onSubmit={handleSubmit}>
              {metrics.map((metric) => (
                <div key={metric.key} className="mb-4">
                  <Label className="block mb-3 font-medium text-gray-800 text-base">{metric.label}</Label>
                  <div className="flex gap-4 justify-center">
                    {metric.emojis.map((emoji) => (
                      <label
                        key={emoji}
                        htmlFor={`${metric.key}-${emoji}`}
                        className="flex flex-col items-center cursor-pointer group"
                      >
                        <input
                          type="radio"
                          id={`${metric.key}-${emoji}`}
                          name={metric.key}
                          value={emoji}
                          checked={form[metric.key] === emoji}
                          onChange={() => setForm((f) => ({ ...f, [metric.key]: emoji }))}
                          className="peer sr-only"
                        />
                        <span
                          className={
                            `text-3xl transition-transform duration-150 ` +
                            (form[metric.key] === emoji
                              ? "scale-125 drop-shadow-lg"
                              : "opacity-60 group-hover:opacity-90")
                          }
                          aria-label={emoji}
                        >
                          {emoji}
                        </span>
                        <span
                          className={
                            form[metric.key] === emoji
                              ? "block mt-1 w-2 h-2 rounded-full bg-blue-500"
                              : "block mt-1 w-2 h-2 rounded-full bg-gray-200"
                          }
                        ></span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex justify-end mt-6">
                <Button
                  type="submit"
                  className="px-8 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow"
                >
                  Submit
                </Button>
              </div>
            </form>

            {/* Dynamic feedback message */}
            {feedbackMessage && (
              <div className="mt-6 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 text-center text-base font-medium">
                {feedbackMessage}
              </div>
            )}

            {/* Feedback history */}
            {history.length > 0 && (
              <div className="mt-6 space-y-3">
                {history.map((entry, idx) => (
                  <div
                    key={idx}
                    className="border rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between bg-gray-50"
                  >
                    <div className="flex gap-6 text-2xl justify-center md:justify-start">
                      <span title="Responsiveness">{entry.responsiveness}</span>
                      <span title="Clarity">{entry.clarity}</span>
                      <span title="Professionalism">{entry.professionalism}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 md:mt-0 text-center md:text-right">{entry.date}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CitizenLayout>
  )
}
