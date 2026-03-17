"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, Plus, Pill, Calendar, User, Download, Eye, Clock, CheckCircle } from "lucide-react"
import { CitizenLayout } from "@/components/patient/patient-layout"
import { useLanguage } from "@/components/language/language-provider"

interface Prescription {
  id: string
  prescriptionNumber: string
  officersName: string
  officersId: string
  issueDate: string
  expiryDate: string
  status: "active" | "expired" | "filled" | "cancelled"
  medications: {
    name: string
    dosage: string
    frequency: string
    duration: string
    instructions: string
    quantity: number
  }[]
  diagnosis: string
  notes: string
  pharmacyName?: string
  filledDate?: string
  digitalSignature?: string
}

export default function PrescriptionsPage() {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [newPrescription, setNewPrescription] = useState({
    prescriptionCode: "",
    officersVerification: "",
  })

  // TODO: Fetch prescriptions from backend API
  // TODO: Implement real-time prescription updates
  // TODO: Add prescription verification with officers's digital signature
  const mockPrescriptions: Prescription[] = [
    {
      id: "1",
      prescriptionNumber: "RX-2024-001",
      officersName: "Dr. Sarah Smith",
      officersId: "DOC-001",
      issueDate: "2024-01-15",
      expiryDate: "2024-02-15",
      status: "active",
      medications: [
        {
          name: "Amoxicillin",
          dosage: "500mg",
          frequency: "3 times daily",
          duration: "7 days",
          instructions: "Take with food",
          quantity: 21,
        },
        {
          name: "Paracetamol",
          dosage: "650mg",
          frequency: "As needed",
          duration: "5 days",
          instructions: "For fever and pain",
          quantity: 10,
        },
      ],
      diagnosis: "Upper Respiratory Infection",
      notes: "Complete the full course of antibiotics",
      digitalSignature: "verified",
    },
    {
      id: "2",
      prescriptionNumber: "RX-2024-002",
      officersName: "Dr. Michael Johnson",
      officersId: "DOC-002",
      issueDate: "2024-01-10",
      expiryDate: "2024-01-25",
      status: "filled",
      medications: [
        {
          name: "Lisinopril",
          dosage: "10mg",
          frequency: "Once daily",
          duration: "30 days",
          instructions: "Take in the morning",
          quantity: 30,
        },
      ],
      diagnosis: "Hypertension",
      notes: "Monitor blood pressure regularly",
      pharmacyName: "City Pharmacy",
      filledDate: "2024-01-12",
      digitalSignature: "verified",
    },
  ]

  const filteredPrescriptions = mockPrescriptions.filter((prescription) => {
    const matchesSearch =
      prescription.officersName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.prescriptionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.medications.some((med) => med.name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesFilter = filterStatus === "all" || prescription.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "expired":
        return "bg-red-100 text-red-800 border-red-200"
      case "filled":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleAddPrescription = async (e: React.FormEvent) => {
    e.preventDefault()

    // TODO: Verify prescription code with officers's system
    // TODO: Validate digital signature
    // TODO: Add prescription to citizen's records
    // TODO: Send notification to pharmacy if needed

    console.log("Adding prescription:", newPrescription)
    setShowAddModal(false)
    setNewPrescription({ prescriptionCode: "", officersVerification: "" })
  }

  const handleDownloadPrescription = (prescription: Prescription) => {
    // TODO: Generate PDF prescription with digital signature
    // TODO: Include QR code for pharmacy verification
    // TODO: Add watermark and security features
    console.log("Downloading prescription:", prescription.id)
  }

  const handleSendToPharmacy = (prescription: Prescription) => {
    // TODO: Integrate with pharmacy API
    // TODO: Send prescription electronically
    // TODO: Track prescription status
    console.log("Sending to pharmacy:", prescription.id)
  }

  return (
    <CitizenLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("prescriptions")}</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">{t("prescriptionsDesc")}</p>
          </div>

          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("addPrescription")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("addNewPrescription")}</DialogTitle>
                <DialogDescription>{t("addPrescriptionDesc")}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddPrescription} className="space-y-4">
                <div>
                  <Label htmlFor="prescriptionCode">{t("prescriptionCode")}</Label>
                  <Input
                    id="prescriptionCode"
                    placeholder={t("enterPrescriptionCode")}
                    value={newPrescription.prescriptionCode}
                    onChange={(e) => setNewPrescription((prev) => ({ ...prev, prescriptionCode: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="officersVerification">{t("officersVerification")}</Label>
                  <Textarea
                    id="officersVerification"
                    placeholder={t("officersVerificationDesc")}
                    value={newPrescription.officersVerification}
                    onChange={(e) => setNewPrescription((prev) => ({ ...prev, officersVerification: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                    {t("cancel")}
                  </Button>
                  <Button type="submit">{t("addPrescription")}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t("searchPrescriptions")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t("filterByStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allPrescriptions")}</SelectItem>
                  <SelectItem value="active">{t("active")}</SelectItem>
                  <SelectItem value="filled">{t("filled")}</SelectItem>
                  <SelectItem value="expired">{t("expired")}</SelectItem>
                  <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Prescriptions List */}
        <div className="space-y-4">
          {filteredPrescriptions.map((prescription) => (
            <Card key={prescription.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Pill className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold">{prescription.prescriptionNumber}</h3>
                        <Badge className={getStatusColor(prescription.status)}>{t(prescription.status)}</Badge>
                        {prescription.digitalSignature && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {t("verified")}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-300 mb-3">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{prescription.officersName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {t("issued")}: {prescription.issueDate}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {t("expires")}: {prescription.expiryDate}
                          </span>
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="font-medium text-sm mb-1">
                          {t("diagnosis")}: {prescription.diagnosis}
                        </p>
                        <div className="space-y-1">
                          {prescription.medications.map((med, index) => (
                            <div key={index} className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                              <span className="font-medium">{med.name}</span> - {med.dosage}, {med.frequency}
                              {med.instructions && <span className="text-gray-500 ml-2">({med.instructions})</span>}
                            </div>
                          ))}
                        </div>
                      </div>

                      {prescription.pharmacyName && (
                        <p className="text-sm text-green-600">
                          {t("filledAt")}: {prescription.pharmacyName} on {prescription.filledDate}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedPrescription(prescription)}>
                      <Eye className="h-4 w-4 mr-2" />
                      {t("view")}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownloadPrescription(prescription)}>
                      <Download className="h-4 w-4 mr-2" />
                      {t("download")}
                    </Button>
                    {prescription.status === "active" && (
                      <Button variant="default" size="sm" onClick={() => handleSendToPharmacy(prescription)}>
                        {t("sendToPharmacy")}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Prescription Details Modal */}
        {selectedPrescription && (
          <Dialog open={!!selectedPrescription} onOpenChange={() => setSelectedPrescription(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t("prescriptionDetails")}</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">{t("details")}</TabsTrigger>
                  <TabsTrigger value="medications">{t("medications")}</TabsTrigger>
                  <TabsTrigger value="history">{t("history")}</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t("prescriptionNumber")}</Label>
                      <p className="font-medium">{selectedPrescription.prescriptionNumber}</p>
                    </div>
                    <div>
                      <Label>{t("officers")}</Label>
                      <p className="font-medium">{selectedPrescription.officersName}</p>
                    </div>
                    <div>
                      <Label>{t("issueDate")}</Label>
                      <p className="font-medium">{selectedPrescription.issueDate}</p>
                    </div>
                    <div>
                      <Label>{t("expiryDate")}</Label>
                      <p className="font-medium">{selectedPrescription.expiryDate}</p>
                    </div>
                  </div>
                  <div>
                    <Label>{t("diagnosis")}</Label>
                    <p className="font-medium">{selectedPrescription.diagnosis}</p>
                  </div>
                  <div>
                    <Label>{t("notes")}</Label>
                    <p className="font-medium">{selectedPrescription.notes}</p>
                  </div>
                </TabsContent>

                <TabsContent value="medications" className="space-y-4">
                  {selectedPrescription.medications.map((med, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>{t("medication")}</Label>
                            <p className="font-medium">{med.name}</p>
                          </div>
                          <div>
                            <Label>{t("dosage")}</Label>
                            <p className="font-medium">{med.dosage}</p>
                          </div>
                          <div>
                            <Label>{t("frequency")}</Label>
                            <p className="font-medium">{med.frequency}</p>
                          </div>
                          <div>
                            <Label>{t("duration")}</Label>
                            <p className="font-medium">{med.duration}</p>
                          </div>
                          <div className="col-span-2">
                            <Label>{t("instructions")}</Label>
                            <p className="font-medium">{med.instructions}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>
                        {t("prescribed")} - {selectedPrescription.issueDate}
                      </span>
                    </div>
                    {selectedPrescription.filledDate && (
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>
                          {t("filled")} - {selectedPrescription.filledDate}
                        </span>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )}

        {/* Empty State */}
        {filteredPrescriptions.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t("noPrescriptionsFound")}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{t("noPrescriptionsFoundDesc")}</p>
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("addFirstPrescription")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </CitizenLayout>
  )
}
