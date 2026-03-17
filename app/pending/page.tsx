import { CitizenLayout } from "@/components/patient/patient-layout"
import { Construction } from "lucide-react"

export default function PendingPage() {
  return (
    <CitizenLayout>
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
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
    </CitizenLayout>
  )
}
