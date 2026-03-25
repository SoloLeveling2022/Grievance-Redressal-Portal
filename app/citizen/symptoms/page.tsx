"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, X, AlertCircle, PhoneCall, CheckCircle } from "lucide-react"
import { CitizenLayout } from "@/components/patient/patient-layout"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Complaint = {
  id: string
  subject: string
  category: string
  description: string
  location?: { lat: number; lng: number } | null
  attachments?: { name: string }[]
  allowAnonymous: boolean
  contactPhone?: string
  contactEmail?: string
  status: "Submitted" | "In Review" | "Resolved" | "Rejected"
  createdAt: string
  updates: { id: string; status: string; message: string; updatedAt: string }[]
}

export default function FileComplaintPage() {
  const { toast } = useToast()
  const [form, setForm] = useState({
    subject: "",
    category: "",
    description: "",
    allowAnonymous: false,
    contactPhone: "",
    contactEmail: "",
    locationConsent: true,
  })
  const [attachments, setAttachments] = useState<File[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavedOpen, setIsSavedOpen] = useState(false) // state for success popup visibility

  // Voice-agent state (pattern preserved from follow-ups)
  const [isCallInitiating, setIsCallInitiating] = useState(false)
  const [callStatus, setCallStatus] = useState<string | null>(null)
  const [callError, setCallError] = useState<string | null>(null)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.subject.trim()) e.subject = "Subject is required"
    if (!form.category.trim()) e.category = "Category is required"
    if (!form.description.trim()) e.description = "Description is required"
    if (!form.allowAnonymous && !form.contactPhone && !form.contactEmail) {
      e.contact = "Provide a phone or email, or select anonymous"
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onFileChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(ev.target.files || [])
    setAttachments((prev) => [...prev, ...files])
  }
  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const getLocationIfConsented = async (): Promise<{ lat: number; lng: number } | null> => {
    if (!form.locationConsent || typeof window === "undefined" || !navigator.geolocation) return null
    try {
      const coords = await new Promise<GeolocationCoordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos.coords),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 8000 },
        )
      })
      return { lat: coords.latitude, lng: coords.longitude }
    } catch {
      return null
    }
  }

  const saveComplaint = (complaint: Complaint) => {
    if (typeof window === "undefined") return
    try {
      const key = "grievance_complaints"
      const existing: Complaint[] = JSON.parse(localStorage.getItem(key) || "[]")
      localStorage.setItem(key, JSON.stringify([complaint, ...existing]))
    } catch {}
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)

    const location = await getLocationIfConsented()
    const complaint: Complaint = {
      id: Date.now().toString(),
      subject: form.subject.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      allowAnonymous: form.allowAnonymous,
      contactPhone: form.allowAnonymous ? undefined : form.contactPhone.trim(),
      contactEmail: form.allowAnonymous ? undefined : form.contactEmail.trim(),
      location,
      attachments: attachments.map((f) => ({ name: f.name })), // placeholder metadata
      status: "Submitted",
      createdAt: new Date().toISOString(),
      updates: [
        {
          id: crypto?.randomUUID?.() || Math.random().toString(36).slice(2),
          status: "Submitted",
          message: "Complaint filed successfully.",
          updatedAt: new Date().toISOString(),
        },
      ],
    }

    saveComplaint(complaint)

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "complaint_saved_popup",
          JSON.stringify({
            id: complaint.id,
            subject: complaint.subject,
            savedAt: new Date().toISOString(),
            message: "File is saved",
          }),
        )
      }
    } catch {}

    setIsSavedOpen(true) // show success popup

    setIsSubmitting(false)
    toast({ title: "Complaint filed", description: "Your grievance has been submitted." })

    // Reset
    setForm({
      subject: "",
      category: "",
      description: "",
      allowAnonymous: false,
      contactPhone: "",
      contactEmail: "",
      locationConsent: true,
    })
    setAttachments([])
  }

  return (
    <CitizenLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">File a Complaint</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Submit a grievance with details and optional attachments. You may file anonymously.
          </p>
        </div>

        {/* Agent Card */}
        {/* <Card className="border-2 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PhoneCall className="h-5 w-5 text-blue-600" />
              <span>Agent for Complaint Filing</span>
            </CardTitle>
            <CardDescription>Get assistance from our AI agent to file your complaint</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              onClick={handleVoiceAgent}
              disabled={isCallInitiating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isCallInitiating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Initiating AI Call...
                </>
              ) : (
                <>
                  <PhoneCall className="h-4 w-4 mr-2" />
                  Start Complaint Agent
                </>
              )}
            </Button>
            {callStatus && <p className="mt-3 text-sm text-blue-700 dark:text-blue-300">{callStatus}</p>}
            {callError && <p className="mt-3 text-sm text-red-600">{callError}</p>}
          </CardContent>
        </Card> */}

        {/* Complaint Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Subject & Category */}
          <Card>
            <CardHeader>
              <CardTitle>Complaint Details</CardTitle>
              <CardDescription>Provide the key information for your grievance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Short title for your complaint"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  className={errors.subject ? "border-red-500" : ""}
                />
                {errors.subject && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.subject}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={form.category} onValueChange={(val) => setForm((f) => ({ ...f, category: val }))}>
                  <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public-services">Public Services</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="corruption">Corruption</SelectItem>
                    <SelectItem value="infrastructure">Infrastructure</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.category}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Explain your grievance with as much detail as possible."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className={errors.description ? "border-red-500" : ""}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle>Attachments (optional)</CardTitle>
              <CardDescription>Upload any documents or images supporting your complaint</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Drag and drop files here, or select to upload</p>
                <input
                  id="complaint-attachments"
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={onFileChange}
                  className="hidden"
                />
                <Label htmlFor="complaint-attachments">
                  <Button type="button" variant="outline" className="cursor-pointer bg-transparent">
                    Select files
                  </Button>
                </Label>
              </div>

              {attachments.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Selected files:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {attachments.map((file, index) => (
                      <div key={index} className="relative">
                        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                          <p className="text-xs text-center p-2">{file.name}</p>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Privacy, Contact, and Location */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy & Contact</CardTitle>
              <CardDescription>Choose whether to remain anonymous and optionally share contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="anonymous"
                  checked={form.allowAnonymous}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, allowAnonymous: Boolean(v) }))}
                />
                <Label htmlFor="anonymous">File anonymously</Label>
              </div>

              {!form.allowAnonymous && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91XXXXXXXXXX"
                      value={form.contactPhone}
                      onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={form.contactEmail}
                      onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="locationConsent"
                  checked={form.locationConsent}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, locationConsent: Boolean(v) }))}
                />
                <Label htmlFor="locationConsent">Include my current location</Label>
              </div>

              {errors.contact && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.contact}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline">
              Save draft
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  File complaint
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Success Popup */}
        <Dialog open={isSavedOpen} onOpenChange={setIsSavedOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>File is saved</DialogTitle>
              <DialogDescription>Your complaint has been saved locally.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setIsSavedOpen(false)}>OK</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CitizenLayout>
  )
}
