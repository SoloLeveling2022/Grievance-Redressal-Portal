"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Bot, Pill, AlertTriangle, CheckCircle, Clock, Star, Info } from "lucide-react"
import { CitizenLayout } from "@/components/patient/patient-layout"
import { useLanguage } from "@/components/language/language-provider"

interface Symptom {
  id: string
  name: string
  severity: "mild" | "moderate" | "severe"
  duration: string
}

interface PrescriptionSuggestion {
  id: string
  medication: string
  dosage: string
  frequency: string
  duration: string
  reason: string
  confidence: number
  sideEffects: string[]
  contraindications: string[]
  interactions: string[]
  category: "over-the-counter" | "prescription" | "natural"
}

export default function AIPrescriptionsPage() {
  const { t } = useLanguage()
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [newSymptom, setNewSymptom] = useState("")
  const [severity, setSeverity] = useState<"mild" | "moderate" | "severe">("mild")
  const [duration, setDuration] = useState("")
  const [additionalInfo, setAdditionalInfo] = useState("")
  const [allergies, setAllergies] = useState("")
  const [currentMedications, setCurrentMedications] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [suggestions, setSuggestions] = useState<PrescriptionSuggestion[]>([])
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([])

  const addSymptom = () => {
    if (!newSymptom.trim() || !duration) return

    const symptom: Symptom = {
      id: Date.now().toString(),
      name: newSymptom,
      severity,
      duration,
    }

    setSymptoms((prev) => [...prev, symptom])
    setNewSymptom("")
    setDuration("")
  }

  const removeSymptom = (id: string) => {
    setSymptoms((prev) => prev.filter((s) => s.id !== id))
  }

  const handleAnalyze = async () => {
    if (symptoms.length === 0) return

    setIsAnalyzing(true)
    setAnalysisProgress(0)

    // Simulate AI analysis progress
    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 10
      })
    }, 300)

    // TODO: Send symptoms to AI backend for analysis
    // TODO: Use medical knowledge base for suggestions
    // TODO: Check drug interactions and contraindications
    // TODO: Consider citizen's medical history and allergies

    setTimeout(() => {
      // Mock AI suggestions
      const mockSuggestions: PrescriptionSuggestion[] = [
        {
          id: "1",
          medication: "Ibuprofen",
          dosage: "400mg",
          frequency: "Every 6-8 hours",
          duration: "3-5 days",
          reason: "Anti-inflammatory for pain and fever relief",
          confidence: 85,
          sideEffects: ["Stomach upset", "Dizziness", "Headache"],
          contraindications: ["Kidney disease", "Heart conditions"],
          interactions: ["Blood thinners", "ACE inhibitors"],
          category: "over-the-counter",
        },
        {
          id: "2",
          medication: "Acetaminophen",
          dosage: "650mg",
          frequency: "Every 4-6 hours",
          duration: "As needed",
          reason: "Pain relief and fever reduction",
          confidence: 92,
          sideEffects: ["Rare at recommended doses"],
          contraindications: ["Liver disease", "Alcohol dependency"],
          interactions: ["Warfarin", "Phenytoin"],
          category: "over-the-counter",
        },
        {
          id: "3",
          medication: "Honey and Ginger Tea",
          dosage: "1 cup",
          frequency: "2-3 times daily",
          duration: "Until symptoms improve",
          reason: "Natural anti-inflammatory and soothing properties",
          confidence: 78,
          sideEffects: ["None known"],
          contraindications: ["Diabetes (honey)", "Blood thinning medications (ginger)"],
          interactions: ["Anticoagulants"],
          category: "natural",
        },
        {
          id: "4",
          medication: "Amoxicillin",
          dosage: "500mg",
          frequency: "3 times daily",
          duration: "7-10 days",
          reason: "Antibiotic for bacterial infection (if suspected)",
          confidence: 65,
          sideEffects: ["Nausea", "Diarrhea", "Allergic reactions"],
          contraindications: ["Penicillin allergy", "Mononucleosis"],
          interactions: ["Birth control pills", "Methotrexate"],
          category: "prescription",
        },
      ]

      setSuggestions(mockSuggestions)
      setIsAnalyzing(false)
      clearInterval(progressInterval)
    }, 3000)
  }

  const toggleSuggestionSelection = (id: string) => {
    setSelectedSuggestions((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600"
    if (confidence >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "over-the-counter":
        return "bg-green-100 text-green-800"
      case "prescription":
        return "bg-red-100 text-red-800"
      case "natural":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleConsultofficers = () => {
    // TODO: Navigate to appointment booking
    // TODO: Pre-fill appointment with AI suggestions
    console.log("Consulting officers with suggestions:", selectedSuggestions)
  }

  return (
    <CitizenLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            {/* <Bot className="h-8 w-8 text-blue-600" /> */}
            <span>{t("aiPrescriptionSuggestions")}</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">{t("aiPrescriptionDesc")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Symptoms Input */}
            <Card>
              <CardHeader>
                <CardTitle>{t("enterSymptoms")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Input
                      placeholder={t("symptomName")}
                      value={newSymptom}
                      onChange={(e) => setNewSymptom(e.target.value)}
                    />
                  </div>
                  <Select
                    value={severity}
                    onValueChange={(value: "mild" | "moderate" | "severe") => setSeverity(value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mild">{t("mild")}</SelectItem>
                      <SelectItem value="moderate">{t("moderate")}</SelectItem>
                      <SelectItem value="severe">{t("severe")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex space-x-2">
                  <Input
                    placeholder={t("duration")}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={addSymptom} disabled={!newSymptom.trim() || !duration}>
                    {t("add")}
                  </Button>
                </div>

                {/* Current Symptoms */}
                {symptoms.length > 0 && (
                  <div className="space-y-2">
                    <Label>{t("currentSymptoms")}:</Label>
                    {symptoms.map((symptom) => (
                      <div
                        key={symptom.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div>
                          <span className="font-medium">{symptom.name}</span>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {t(symptom.severity)}
                            </Badge>
                            <span className="text-sm text-gray-500">{symptom.duration}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeSymptom(symptom.id)}>
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t("additionalInformation")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="allergies">{t("allergies")}</Label>
                  <Textarea
                    id="allergies"
                    placeholder={t("listAllergies")}
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="currentMeds">{t("currentMedications")}</Label>
                  <Textarea
                    id="currentMeds"
                    placeholder={t("listCurrentMedications")}
                    value={currentMedications}
                    onChange={(e) => setCurrentMedications(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="additionalInfo">{t("additionalNotes")}</Label>
                  <Textarea
                    id="additionalInfo"
                    placeholder={t("anyAdditionalInfo")}
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleAnalyze}
              disabled={symptoms.length === 0 || isAnalyzing}
              className="w-full"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t("analyzing")}
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4 mr-2" />
                  {t("getAISuggestions")}
                </>
              )}
            </Button>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {isAnalyzing && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <Bot className="h-12 w-12 text-blue-500 mx-auto animate-pulse" />
                    <h3 className="text-lg font-semibold">{t("aiAnalyzing")}</h3>
                    <p className="text-gray-600">{t("aiAnalyzingDesc")}</p>
                    <Progress value={analysisProgress} className="w-full" />
                    <p className="text-sm text-gray-500">
                      {analysisProgress}% {t("complete")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {suggestions.length > 0 && !isAnalyzing && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Pill className="h-5 w-5" />
                      <span>{t("aiSuggestions")}</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span>{t("aiDisclaimerShort")}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {suggestions.map((suggestion) => (
                      <div key={suggestion.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={selectedSuggestions.includes(suggestion.id)}
                              onCheckedChange={() => toggleSuggestionSelection(suggestion.id)}
                            />
                            <div>
                              <h4 className="font-semibold text-lg">{suggestion.medication}</h4>
                              <p className="text-sm text-gray-600">{suggestion.reason}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getCategoryColor(suggestion.category)}>
                              {t(suggestion.category.replace("-", ""))}
                            </Badge>
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className={`font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                                {suggestion.confidence}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <Label className="text-xs text-gray-500">{t("dosage")}</Label>
                            <p className="font-medium">{suggestion.dosage}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">{t("frequency")}</Label>
                            <p className="font-medium">{suggestion.frequency}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">{t("duration")}</Label>
                            <p className="font-medium">{suggestion.duration}</p>
                          </div>
                        </div>

                        {/* Side Effects & Warnings */}
                        <div className="space-y-2 text-sm">
                          {suggestion.sideEffects.length > 0 && (
                            <div>
                              <Label className="text-xs text-gray-500 flex items-center space-x-1">
                                <Info className="h-3 w-3" />
                                <span>{t("sideEffects")}</span>
                              </Label>
                              <p className="text-gray-600">{suggestion.sideEffects.join(", ")}</p>
                            </div>
                          )}

                          {suggestion.contraindications.length > 0 && (
                            <div>
                              <Label className="text-xs text-red-500 flex items-center space-x-1">
                                <AlertTriangle className="h-3 w-3" />
                                <span>{t("contraindications")}</span>
                              </Label>
                              <p className="text-red-600">{suggestion.contraindications.join(", ")}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-yellow-800">{t("importantDisclaimer")}</p>
                            <p className="text-yellow-700 mt-1">{t("aiDisclaimerFull")}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          onClick={handleConsultofficers}
                          disabled={selectedSuggestions.length === 0}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {t("consultofficers")}
                        </Button>
                        <Button variant="outline" className="flex-1">
                          <Clock className="h-4 w-4 mr-2" />
                          {t("saveForLater")}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </CitizenLayout>
  )
}
