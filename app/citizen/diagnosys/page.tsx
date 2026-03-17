"use client"
import React, { useState, useRef } from "react"
import jsPDF from "jspdf"
import { CitizenLayout } from "@/components/patient/patient-layout"
import { Button } from "@/components/ui/button"
import ReactMarkdown from 'react-markdown'
import { AlertTriangle, CheckCircle, FileText, Download, Phone, Stethoscope, BookOpen, UserCheck } from "lucide-react"
import Link from "next/link"

// The 5 expected section headings, in order
const SECTION_HEADINGS = [
  '1. Image Type & Region',
  '2. Key Findings',
  '3. Diagnostic Assessment',
  '4. citizen-Friendly Explanation',
  '5. Research Context',
]

// Fallback messages for each section
const SECTION_FALLBACKS: Record<string, string> = {
  '1. Image Type & Region': 'No information provided for image type or region.',
  '2. Key Findings': 'No key findings were identified in this scan.',
  '3. Diagnostic Assessment': 'No diagnostic assessment was provided.',
  '4. citizen-Friendly Explanation': 'No citizen-friendly explanation was provided.',
  '5. Research Context': 'No research context or references were found.',
}

// Helper to extract all markdown sections as a map { heading: content }
function extractSectionsMap(markdown: string): Record<string, string> {
  const sectionRegex = /###\s*([\d.\w &-]+)\n([\s\S]*?)(?=\n###|$)/g
  const sections: Record<string, string> = {}
  let match
  while ((match = sectionRegex.exec(markdown)) !== null) {
    sections[match[1].trim()] = match[2].trim()
  }
  return sections
}

// Helper to render markdown in jsPDF (supports bold, lists, and normal text)
const renderMarkdownToPDF = (doc: any, markdown: string, x: number, y: number, contentWidth: number, pageHeight: number, margin: number) => {
  const lines = markdown.split(/\n|\r/)
  let curY = y
  doc.setFont('helvetica', 'normal')
  lines.forEach(line => {
    if (/^\s*\* |^\s*- /.test(line)) {
      // Bullet list
      if (curY + 8 > pageHeight - margin) {
        doc.addPage()
        curY = margin + 12
        doc.setDrawColor(33, 150, 243)
        doc.setLineWidth(0.7)
        doc.rect(margin / 2, margin / 2 + 10, 210 - margin, pageHeight - margin - 10, 'S')
      }
      doc.text('•', x, curY)
      doc.text(line.replace(/^\s*\* |^\s*- /, ''), x + 5, curY)
      curY += 7
    } else if (/^\s*\d+\. /.test(line)) {
      // Numbered list
      if (curY + 8 > pageHeight - margin) {
        doc.addPage()
        curY = margin + 12
        doc.setDrawColor(33, 150, 243)
        doc.setLineWidth(0.7)
        doc.rect(margin / 2, margin / 2 + 10, 210 - margin, pageHeight - margin - 10, 'S')
      }
      doc.text(line, x, curY)
      curY += 7
    } else if (/\*\*(.+)\*\*/.test(line)) {
      // Bold
      const boldMatch = line.match(/\*\*(.+)\*\*/)
      if (boldMatch) {
        doc.setFont('helvetica', 'bold')
        doc.text(boldMatch[1], x, curY)
        doc.setFont('helvetica', 'normal')
        curY += 7
      }
    } else if (line.trim() !== '') {
      // Normal text
      const split = doc.splitTextToSize(line, contentWidth)
      split.forEach((l: string) => {
        if (curY + 8 > pageHeight - margin) {
          doc.addPage()
          curY = margin + 12
          doc.setDrawColor(33, 150, 243)
          doc.setLineWidth(0.7)
          doc.rect(margin / 2, margin / 2 + 10, 210 - margin, pageHeight - margin - 10, 'S')
        }
        doc.text(l, x, curY)
        curY += 7
      })
    } else {
      curY += 3
    }
  })
  return curY
}

// Helper to extract a title and description from the Gemini markdown
function extractTitleAndDescription(markdown: string): { title: string, description: string } {
  // Try to use the first section heading as title, and first paragraph as description
  const sectionRegex = /###\s*([\d.\w &-]+)\n([\s\S]*?)(?=\n###|$)/g
  let match = sectionRegex.exec(markdown)
  let title = "AI Scan Report"
  let description = ""
  // if (match) {
  //   title = match[1].replace(/^[\d.]+\s*/, "").trim()
  //   // Use the first non-empty line as description
  //   const lines = match[2].split(/\n|\r/).map(l => l.trim()).filter(Boolean)
  //   if (lines.length > 0) {
  //     description = lines[0]
  //   }
  // }
  // Fallback if not found
  if (!description) description = title
  return { title, description }
}

function saveRecordToLocalStorage(record: any) {
  if (typeof window === 'undefined') return;
  try {
    const key = "careconnect_citizen_records";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify([record, ...existing]));
  } catch {}
}

const ScanAnalysisPage = () => {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [gemini, setGemini] = useState<string>("")
  const [modalOpen, setModalOpen] = useState(false)
  const [error, setError] = useState<string>("")
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      setPreview(URL.createObjectURL(f))
      setResult(null)
      setGemini("")
      setError("")
    }
  }

  const handleSubmit = async () => {
    if (!file) return
    setLoading(true)
    setError("")
    setResult(null)
    setGemini("")
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/analyze-xray", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error("Failed to analyze scan")
      const data = await res.json()
      setResult(data.result)
      setGemini(data.gemini)
      setModalOpen(true)
    } catch (e: any) {
      setError(e.message || "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = () => {
    if (!result && !gemini) return
    // Use the diagnosis structure if available, else fallback to gemini string
    const diagnosis = result || { condition: 'AI Scan', confidence: 90, severity: 'N/A', description: gemini, recommendations: [], whenToSeekCare: [], followUp: null }
    const doc = new jsPDF({ unit: "mm", format: "a4" })
    const pageWidth = 210
    const pageHeight = 297
    const margin = 18
    const contentWidth = pageWidth - margin * 2 - 4
    let y = margin

    // Brand Header
    doc.setFillColor(33, 150, 243)
    doc.rect(0, 0, pageWidth, 22, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text("CareConnect Health", pageWidth / 2, y, { align: "center" })
    y += 10
    doc.setFontSize(10)
    doc.text("AI-Powered Scan Analysis Report", pageWidth / 2, y, { align: "center" })
    y += 10
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")

    // Outer Border
    doc.setDrawColor(33, 150, 243)
    doc.setLineWidth(0.7)
    doc.rect(margin / 2, margin / 2 + 10, pageWidth - margin, pageHeight - margin - 10, "S")
    y = margin + 12

    // Report Details
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("Diagnosis Summary", margin + 4, y)
    y += 8
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text(`Condition: `, margin + 4, y)
    doc.setFont("helvetica", "bold")
    doc.text(diagnosis.condition, margin + 38, y)
    doc.setFont("helvetica", "normal")
    y += 7
    doc.text(`Confidence: `, margin + 4, y)
    doc.text(`${diagnosis.confidence}%`, margin + 38, y)
    y += 7
    doc.text(`Severity: `, margin + 4, y)
    doc.text(`${diagnosis.severity}`, margin + 38, y)
    y += 10
    doc.setFont("helvetica", "bold")
    doc.text("Description:", margin + 4, y)
    doc.setFont("helvetica", "normal")
    y += 6
    const descLines = doc.splitTextToSize(diagnosis.description, contentWidth)
    descLines.forEach((line: string) => {
      doc.text(line, margin + 8, y)
      y += 6
    })
    y += 2

    // Recommendations
    doc.setFont("helvetica", "bold")
    doc.text("Recommendations:", margin + 4, y)
    doc.setFont("helvetica", "normal")
    y += 6
    diagnosis.recommendations.forEach((rec: string) => {
      const recLines = doc.splitTextToSize(`• ${rec}`, contentWidth)
      recLines.forEach((line: string) => {
        doc.text(line, margin + 8, y)
        y += 6
      })
    })
    y += 2

    // When to Seek Care
    doc.setFont("helvetica", "bold")
    doc.text("When to Seek Care:", margin + 4, y)
    doc.setFont("helvetica", "normal")
    y += 6
    diagnosis.whenToSeekCare.forEach((w: string) => {
      const wLines = doc.splitTextToSize(`• ${w}`, contentWidth)
      wLines.forEach((line: string) => {
        doc.text(line, margin + 8, y)
        y += 6
      })
    })
    y += 2

    // Follow-up
    if (diagnosis.followUp?.recommended) {
      doc.setFont("helvetica", "bold")
      doc.text("Follow-up:", margin + 4, y)
      doc.setFont("helvetica", "normal")
      y += 6
      const followUpText = `Recommended in ${diagnosis.followUp.timeframe} to ${diagnosis.followUp.reason}`
      const followUpLines = doc.splitTextToSize(followUpText, contentWidth)
      followUpLines.forEach((line: string) => {
        doc.text(line, margin + 8, y)
        y += 6
      })
      y += 2
    }

    // Footer
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.3)
    doc.line(margin / 2, pageHeight - margin + 4, pageWidth - margin / 2, pageHeight - margin + 4)
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text("This report is generated by CareConnect AI. For informational purposes only.", pageWidth / 2, pageHeight - margin + 10, { align: "center" })
    doc.setTextColor(0, 0, 0)
    doc.save("CareConnect_Diagnosis_Report.pdf")
  }

  const getImageDataUrl = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      img.crossOrigin = "Anonymous"
      img.onload = function () {
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")
        ctx?.drawImage(img, 0, 0)
        resolve(canvas.toDataURL("image/jpeg"))
      }
      img.onerror = reject
      img.src = url
    })
  }

  const handleSaveRecord = async () => {
    if (!gemini) return
    setSaveStatus('saving')
    try {
      const { title, description } = extractTitleAndDescription(gemini)
      const diagnosis = result || { condition: title, confidence: 90, severity: 'N/A', description, recommendations: [], whenToSeekCare: [], followUp: null }
      // Save the exact scan result to localStorage
      const record = {
        id: Date.now().toString(),
        source: 'scan',
        response: { gemini, result, diagnosis },
        date: new Date().toISOString()
      }
      saveRecordToLocalStorage(record)
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
    }
  }

  const handleConsultofficers = async () => {
    await handleSaveRecord()
    window.location.href = "/citizen/appointments"
  }

  return (
    <CitizenLayout>
      <div className="max-w-xl mx-auto py-10">
        <h1 className="text-3xl font-bold mb-8 text-center text-blue-700">Medical Scan Analysis</h1>
        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-6 border border-blue-100">
          {/* Upload Area */}
          <label
            htmlFor="scan-upload"
            className="w-full flex flex-col items-center justify-center border-2 border-dashed border-blue-400 rounded-xl p-8 cursor-pointer hover:bg-blue-50 transition group"
          >
            <svg className="w-12 h-12 text-blue-400 mb-2 group-hover:text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0l-4 4m4-4l4 4m-8 4h8a4 4 0 0 0 4-4V7a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v5a4 4 0 0 0 4 4z" /></svg>
            <span className="text-blue-700 font-medium">Click or drag & drop to upload X-ray or MRI image</span>
            <span className="text-xs text-blue-400 mt-1">(Accepted: .jpg, .jpeg, .png, .dcm, .nii)</span>
            <input
              id="scan-upload"
              type="file"
              accept=".jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
          </label>
          {preview && (
            <img src={preview} alt="Preview" className="w-60 h-60 object-contain border rounded-lg shadow mb-2" />
          )}
          <Button
            className="w-full mt-2"
            onClick={handleSubmit}
            disabled={!file || loading}
          >
            {loading ? <span className="animate-spin mr-2">⏳</span> : "Analyze Scan"}
          </Button>
          {error && <div className="text-red-500 text-center mt-2">{error}</div>}
        </div>
        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl w-full relative max-h-[90vh] overflow-y-auto">
              <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => setModalOpen(false)}>✕</Button>
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-500" /> Scan Analysis Result
              </h2>
              {/* Loading State */}
              {loading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <div className="text-lg font-semibold">Analyzing scan...</div>
                  <div className="text-gray-600">AI analysis in progress</div>
                </div>
              )}
              {/* Error State */}
              {error && (
                <div className="text-center py-12">
                  <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <div className="text-lg font-semibold text-red-700">Error</div>
                  <div className="text-gray-600">{error}</div>
                </div>
              )}
              {/* Result State */}
              {!loading && !error && gemini && (
                <div className="space-y-6">
                  {SECTION_HEADINGS.map((heading, idx) => {
                    const sectionsMap = extractSectionsMap(gemini)
                    const content = sectionsMap[heading] || SECTION_FALLBACKS[heading]
                    return (
                      <div key={idx} className="bg-gray-50 border-l-4 border-blue-400 p-4 rounded-lg">
                        <div className="font-semibold text-blue-800 mb-2">{heading}</div>
                        <div className="prose max-w-none text-sm">
                          <ReactMarkdown>{content}</ReactMarkdown>
                        </div>
                      </div>
                    )
                  })}
                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full justify-center items-center mt-4">
                    <Link href="/citizen/appointments" className="w-full sm:w-auto">
                      <Button className="flex-1 px-12 w-full sm:w-auto">
                        <Phone className="h-4 w-4 mr-2" /> Consult officers
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="flex-1 px-12 w-full sm:w-auto"
                      onClick={handleSaveRecord}
                      disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {saveStatus === 'saved' ? 'Saved to My Medical Records' : saveStatus === 'saving' ? 'Saving...' : 'Save to My Medical Records'}
                    </Button>
                    <Button variant="outline" className="flex-1 px-12 w-full sm:w-auto" onClick={handleDownloadPDF}>
                      <Download className="h-4 w-4 mr-2" /> Download PDF
                    </Button>
                  </div>
                  {/* Disclaimer */}
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-6">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Important Disclaimer</h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">This AI-generated analysis is for informational purposes only and should not be considered a substitute for professional medical advice, diagnosis, or treatment.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Show actions if a result is available and not loading or error */}
        {gemini && !loading && !error && (
          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center items-center mt-8">
            <Link href="/citizen/appointments" className="w-full sm:w-auto">
              <Button className="flex-1 px-12 w-full sm:w-auto">
                <Phone className="h-4 w-4 mr-2" /> Consult officers
              </Button>
            </Link>
            <Button
              variant="outline"
              className="flex-1 px-12 w-full sm:w-auto"
              onClick={handleSaveRecord}
              disabled={saveStatus === 'saving' || saveStatus === 'saved'}
            >
              <FileText className="h-4 w-4 mr-2" />
              {saveStatus === 'saved' ? 'Saved to My Medical Records' : saveStatus === 'saving' ? 'Saving...' : 'Save to My Medical Records'}
            </Button>
            <Button variant="outline" className="flex-1 px-12 w-full sm:w-auto" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" /> Download PDF
            </Button>
          </div>
        )}
      </div>
    </CitizenLayout>
  )
}

export default ScanAnalysisPage
