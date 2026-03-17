"use client"
import { CitizenLayout } from "@/components/patient/patient-layout"
import { Construction } from "lucide-react"
import { useRouter } from "next/navigation"

export default function PendingPage() {
  const router = useRouter()
  return (
    // <citizenLayout>
    
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <button
        onClick={() => router.push("/auth")}
        className="absolute top-4 left-4 z-20 flex items-center px-3 py-1.5 rounded-md bg-white/80 dark:bg-slate-800/80 border border-gray-200 dark:border-gray-700 shadow hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
      >
        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        <span className="font-medium text-gray-700 dark:text-gray-200">Back</span>
      </button>
      <div className="text-center space-y-6 p-8">
        <div className="flex justify-center">
          <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/20 p-6">
            <Construction className="h-16 w-16 text-yellow-600 dark:text-yellow-500" strokeWidth={1.5} />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Under Development
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            This feature is currently being built and will be available soon.
          </p>
        </div>
      </div>
    </div>
    // </citizenLayout>
  )
}
