"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Calendar, FileText, Phone, Download } from "lucide-react"
import { useLanguage } from "@/components/language/language-provider"
import Link from "next/link"
import jsPDF from "jspdf"
import { useState } from "react"
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Diagnosis {
  condition: string
  confidence: number
  severity: "mild" | "moderate" | "severe" | string
  description: string
  recommendations: string[]
  whenToSeekCare: string[]
  followUp: {
    recommended: boolean
    timeframe: string
    reason: string
  }
  nearbyFacilities?: {
    name: string;
    type: string;
    address: string;
    phone: string;
    mapsLink: string;
    directions?: string;
  }[];
  medications?: {
    name: string;
    links?: {
      provider: string;
      url: string;
    }[];
  }[];
  officersVideoScript?: string;
}

interface DiagnosisModalProps {
  isOpen: boolean
  onClose: () => void
  diagnosis: Diagnosis | null
  error?: string | null
  diagnosisMarkdown?: string | null
}

function parseMarkdownSections(markdown: string) {
  // Very basic parser for the expected markdown structure
  // Returns an object with keys: diagnosis, facilities, medications, videoScript
  const sections: any = {};
  const diagnosisMatch = markdown.match(/### 1\. Diagnosis[\s\S]*?(?=---|###|$)/i);
  const facilitiesMatch = markdown.match(/### 2\. Nearby Facilities[\s\S]*?(?=---|###|$)/i);
  const medicationsMatch = markdown.match(/### 3\. Suggested Medications[\s\S]*?(?=---|###|$)/i);
  const videoScriptMatch = markdown.match(/### 4\. AI Video Script[\s\S]*?(?=---|###|$)/i);
  if (diagnosisMatch) sections.diagnosis = diagnosisMatch[0];
  if (facilitiesMatch) sections.facilities = facilitiesMatch[0];
  if (medicationsMatch) sections.medications = medicationsMatch[0];
  if (videoScriptMatch) sections.videoScript = videoScriptMatch[0];
  return sections;
}

export function DiagnosisModal({ isOpen, onClose, diagnosis, error, diagnosisMarkdown }: DiagnosisModalProps) {
  const { t } = useLanguage()
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

  let markdownSections: any = null;
  if (diagnosisMarkdown) {
    markdownSections = parseMarkdownSections(diagnosisMarkdown);
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600"
    if (confidence >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "mild":
        return "bg-green-100 text-green-800"
      case "moderate":
        return "bg-yellow-100 text-yellow-800"
      case "severe":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleDownloadPDF = () => {
    if (!diagnosis) return
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
    doc.text("AI-Powered Symptom Analysis Report", pageWidth / 2, y, { align: "center" })
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
    diagnosis.recommendations.forEach((rec) => {
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
    diagnosis.whenToSeekCare.forEach((w) => {
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

    // Nearby Facilities
    if (diagnosis.nearbyFacilities && diagnosis.nearbyFacilities.length > 0) {
      doc.setFont("helvetica", "bold")
      doc.text("Nearby Facilities:", margin + 4, y)
      doc.setFont("helvetica", "normal")
      y += 6
      diagnosis.nearbyFacilities.forEach((facility) => {
        const facilityLines = doc.splitTextToSize(`• ${facility.name} (${facility.type})`, contentWidth)
        facilityLines.forEach((line: string) => {
          doc.text(line, margin + 8, y)
          y += 6
        })
        doc.text(`Address: ${facility.address}`, margin + 8, y)
        doc.text(`Phone: ${facility.phone}`, margin + 8, y)
        doc.text(`Maps: ${facility.mapsLink}`, margin + 8, y)
        if (facility.directions) {
          doc.text(`Directions: ${facility.directions}`, margin + 8, y)
        }
        y += 6
      })
      y += 2
    }

    // Medications
    if (diagnosis.medications && diagnosis.medications.length > 0) {
      doc.setFont("helvetica", "bold")
      doc.text("Recommended Medications:", margin + 4, y)
      doc.setFont("helvetica", "normal")
      y += 6
      diagnosis.medications.forEach((med) => {
        const medLines = doc.splitTextToSize(`• ${med.name}`, contentWidth)
        medLines.forEach((line: string) => {
          doc.text(line, margin + 8, y)
          y += 6
        })
        if (med.links && med.links.length > 0) {
          med.links.forEach((link) => {
            doc.text(`Order from: ${link.provider} (${link.url})`, margin + 8, y)
            y += 6
          })
        }
        y += 2
      })
    }

    // officers Video Script
    if (diagnosis.officersVideoScript) {
      doc.setFont("helvetica", "bold")
      doc.text("officers Video Script:", margin + 4, y)
      doc.setFont("helvetica", "normal")
      y += 6
      const scriptLines = doc.splitTextToSize(diagnosis.officersVideoScript, contentWidth)
      scriptLines.forEach((line: string) => {
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

  const handleSaveToRecords = async () => {
    if (!diagnosis) return
    setSaveStatus("saving")
    try {
      const res = await fetch("/api/citizen/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(diagnosis),
      })
      if (res.ok) {
        setSaveStatus("saved")
      } else {
        setSaveStatus("error")
      }
    } catch {
      setSaveStatus("error")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <span>{t("aiDiagnosisResult")}</span>
          </DialogTitle>
          <DialogDescription>{t("aiDiagnosisDesc")}</DialogDescription>
        </DialogHeader>

        {/* Render markdown sections as cards if markdown is present */}
        {!diagnosis && diagnosisMarkdown && markdownSections && (
          <>
            {markdownSections.diagnosis && (
              <Card>
                <CardHeader>
                  <CardTitle>Diagnosis, Severity, and Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownSections.diagnosis}</ReactMarkdown>
                </CardContent>
              </Card>
            )}
            {markdownSections.facilities && (
              <Card>
                <CardHeader>
                  <CardTitle>Nearby Facilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownSections.facilities}</ReactMarkdown>
                </CardContent>
              </Card>
            )}
            {markdownSections.medications && (
              <Card>
                <CardHeader>
                  <CardTitle>Suggested Medications</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownSections.medications}</ReactMarkdown>
                </CardContent>
              </Card>
            )}
            {markdownSections.videoScript && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Video Script</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownSections.videoScript}</ReactMarkdown>
                </CardContent>
              </Card>
            )}
            {/* Fallback: if no sections parsed, render all markdown */}
            {!markdownSections.diagnosis && !markdownSections.facilities && !markdownSections.medications && !markdownSections.videoScript && (
              <div className="prose max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{diagnosisMarkdown}</ReactMarkdown>
              </div>
            )}
          </>
        )}

        {/* Existing logic for JSON diagnosis ... */}
        {!diagnosis && !error && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className="text-lg font-semibold">{t("analyzingSymptoms")}</div>
            <div className="text-gray-600">{t("aiAnalysisInProgress")}</div>
          </div>
        )}
        {error && (
          <div className="text-center py-12">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <div className="text-lg font-semibold text-red-700">{t("error")}</div>
            <div className="text-gray-600">{error}</div>
          </div>
        )}
        {diagnosis && (
          <>
            {/* Main Diagnosis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{t("primaryDiagnosis")}</span>
                  <Badge className={getSeverityColor(diagnosis.severity)}>
                    {t(diagnosis.severity)} {t("severity")}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold">{diagnosis.condition}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mt-2">{diagnosis.description}</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{t("confidenceLevel")}</span>
                      <span className={`text-sm font-bold ${getConfidenceColor(diagnosis.confidence)}`}>
                        {diagnosis.confidence}%
                      </span>
                    </div>
                    <Progress value={diagnosis.confidence} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>{t("recommendations")}</CardTitle>
                <CardDescription>{t("followRecommendations")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {diagnosis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* When to Seek Care */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <span>{t("whenToSeekCare")}</span>
                </CardTitle>
                <CardDescription>{t("seekCareDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {diagnosis.whenToSeekCare.map((warning, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{warning}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Follow-up */}
            {diagnosis.followUp?.recommended && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <span>{t("followUp")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">
                    {t("followUpRecommended")} {diagnosis.followUp.timeframe} {t("to")} {diagnosis.followUp.reason.toLowerCase()}.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Nearby Facilities Section */}
            {diagnosis.nearbyFacilities && (
              <Card>
                <CardHeader>
                  <CardTitle>Nearby Hospitals, Clinics, and Pharmacies</CardTitle>
                  <CardDescription>Facilities near your location with directions and contact info.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {diagnosis.nearbyFacilities.map((facility, idx) => (
                      <li key={idx} className="mb-2">
                        <div className="font-semibold">{facility.name} <span className="text-xs text-gray-500">({facility.type})</span></div>
                        <div className="text-sm">{facility.address}</div>
                        <div className="text-sm">Phone: <a href={`tel:${facility.phone}`} className="text-blue-600 underline">{facility.phone}</a></div>
                        <div className="text-sm mt-1">
                          <a href={facility.mapsLink} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">Google Maps Directions</a>
                        </div>
                        {facility.directions && (
                          <div className="text-xs text-gray-700 mt-1">Directions: {facility.directions}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {/* Medications Section */}
            {diagnosis.medications && (
              <Card>
                <CardHeader>
                  <CardTitle>Recommended Medications</CardTitle>
                  <CardDescription>Order online from trusted pharmacies.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {diagnosis.medications.map((med, idx) => (
                      <li key={idx} className="mb-2">
                        <span className="font-semibold">{med.name}</span>
                        {med.links && med.links.length > 0 && (
                          <span className="ml-2 text-xs">[
                            {med.links.map((link, lidx) => (
                              <a key={lidx} href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-1">{link.provider}</a>
                            ))}
                          ]</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {/* officers Video Script Section */}
            {/* {diagnosis.officersVideoScript && (
              <Card>
                <CardHeader>
                  <CardTitle>officers Video Script</CardTitle>
                  <CardDescription>Share this script with your AI video assistant.</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded border border-gray-200">{diagnosis.officersVideoScript}</pre>
                </CardContent>
              </Card>
            )} */}

            {/* Actions */}
            {/* Always show action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Link href="/citizen/appointments">
                <Button className="flex-1 px-12">
                  <Phone className="h-4 w-4 mr-2" />
                  {t("consultofficers")}
                </Button>
              </Link>
              <Button
                variant="outline"
                className="flex-1 px-12"
                onClick={handleSaveToRecords}
                disabled={!diagnosis || saveStatus === "saving" || saveStatus === "saved"}
              >
                <FileText className="h-4 w-4 mr-2" />
                {saveStatus === "saved" ? t("savedToRecords") : t("saveToRecords")}
              </Button>
              <Button
                variant="outline"
                className="flex-1 px-12"
                onClick={handleDownloadPDF}
                disabled={!diagnosis}
              >
                <Download className="h-4 w-4 mr-2" />
                {t("downloadReport")}
              </Button>
            </div>

            {/* Disclaimer */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">{t("importantDisclaimer")}</h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">{t("aiDisclaimerText")}</p>
                </div>
              </div>
            </div>

            {saveStatus === "error" && (
              <div className="text-red-600 text-sm mt-2">{t("saveToRecordsError")}</div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
