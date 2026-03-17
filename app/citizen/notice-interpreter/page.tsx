"use client"

import type React from "react"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

// Use lightweight Tesseract.js (client-side). We'll OCR in English and rely on Gemini to translate/simplify.
import Tesseract from "tesseract.js"
import { CitizenLayout } from "@/components/patient/patient-layout"

type Lang = "en" | "hi" | "te"

export default function NoticeInterpreterPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [language, setLanguage] = useState<Lang>("en")
  const [ocrText, setOcrText] = useState<string>("")
  const [resultText, setResultText] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [warning, setWarning] = useState<string | null>(null)
  const [speaking, setSpeaking] = useState(false)

  const onPick = () => fileInputRef.current?.click()

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setImage(f || null)
    if (f) {
      const url = URL.createObjectURL(f)
      setPreview(url)
    } else {
      setPreview(null)
    }
  }

  const speak = () => {
    if (!resultText) return
    if (!("speechSynthesis" in window)) {
      alert("Speech synthesis not supported in this browser.")
      return
    }
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    const utter = new SpeechSynthesisUtterance(resultText)
    // Map to reasonable locales
    utter.lang = language === "hi" ? "hi-IN" : language === "te" ? "te-IN" : "en-US"
    utter.rate = 1
    utter.onend = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.speak(utter)
  }

  const processImage = async () => {
    if (!image) {
      alert("Please select an image.")
      return
    }
    setLoading(true)
    setWarning(null)
    setResultText("")
    try {
      // OCR in English; translate/simplify later via Gemini
      const { data } = await Tesseract.recognize(image, "eng", { logger: () => {} })
      const extracted = data?.text?.trim() || ""
      setOcrText(extracted)

      // Server call to Gemini for simplification + translation
      const res = await fetch("/api/gemini/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extracted, language }),
      })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(`Gemini error: ${t}`)
      }
      const payload = await res.json()
      setResultText(payload.text || "")
      if (payload.langWarning) setWarning(payload.langWarning as string)
    } catch (e: any) {
      console.error("[v0] processImage failed:", e?.message || e)
      alert("Something went wrong while processing the image.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <CitizenLayout>
    <main className="p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-balance">Notice Board Interpreter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <Label>Upload image</Label>
            <div className="flex items-center gap-3">
              <Button onClick={onPick}>Select image</Button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
              <div className="text-sm text-muted-foreground">
                Supported: JPG, PNG, GIF. We will OCR and simplify in your selected language.
              </div>
            </div>
            {preview ? (
              <img
                src={preview || "/placeholder.svg"}
                alt="Selected image preview"
                className="w-full max-h-80 object-contain rounded border"
              />
            ) : null}
          </div>

          <div className="grid gap-3">
            <Label>Language</Label>
            <Select value={language} onValueChange={(v) => setLanguage(v as Lang)}>
              <SelectTrigger className="w-60">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
                <SelectItem value="te">Telugu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={processImage} disabled={loading}>
              {loading ? "Processing..." : "Submit"}
            </Button>
            <Button variant="secondary" onClick={speak} disabled={!resultText}>
              {speaking ? "Stop" : "Speak"}
            </Button>
          </div>

          {ocrText ? (
            <div className="grid gap-2">
              <Label>Extracted OCR Text</Label>
              <Textarea value={ocrText} readOnly rows={6} />
            </div>
          ) : null}

          {resultText ? (
            <div className="grid gap-2">
              <Label>Gemini Response</Label>
              <Textarea value={resultText} readOnly rows={6} />
              {warning ? <p className="text-sm text-amber-600 font-medium">{warning}</p> : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
    </CitizenLayout>
  )
}
