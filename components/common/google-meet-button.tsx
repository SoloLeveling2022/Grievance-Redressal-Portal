"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Video } from "lucide-react"
import { useLanguage } from "@/components/language/language-provider"

interface GoogleMeetButtonProps {
  citizenName?: string
  onStartCall?: () => void
  size?: "sm" | "default" | "lg"
  variant?: "default" | "outline" | "secondary"
}

export function GoogleMeetButton({
  citizenName,
  onStartCall,
  size = "sm",
  variant = "default",
}: GoogleMeetButtonProps) {
  const { t } = useLanguage()

  const handleStartCall = () => {
    // Always open the provided Google Meet link
    const meetingUrl = "https://meet.google.com/ocw-fmmo-syu"
    window.open(meetingUrl, "_blank")
    onStartCall?.()
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleStartCall}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Video className="h-4 w-4 mr-2" />
            {t("startVideoCall")}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{citizenName ? `${t("startCallWith")} ${citizenName}` : t("opensGoogleMeet")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
