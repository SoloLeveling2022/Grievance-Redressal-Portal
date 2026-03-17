"use client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Globe, Sun, Moon } from "lucide-react"
import { useLanguage } from "./language-provider"
import { Toggle } from "@/components/ui/toggle"
import { useTheme } from "next-themes"

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()
  const { theme, setTheme } = useTheme()
  const storeLang = (value: "en" | "hi") => {
    setLanguage(value)
    localStorage.setItem("language", value)
  }

  return (
    <div className="flex items-center gap-1">
      <Toggle
        aria-label="Toggle theme"
        size="sm"
        variant="outline"
        pressed={theme === "dark"}
        onPressedChange={(pressed) => setTheme(pressed ? "dark" : "light")}
        className="h-10 w-10 p-3 flex items-center justify-center bg-transparent"
      >
        {theme === "dark" ? <Moon className="h-6 w-6" /> : <Sun className="h-16 w-16" />}
      </Toggle>
      <Select value={language} onValueChange={(value: "en" | "hi") => storeLang(value)} >
        <SelectTrigger className="w-24 bg-transparent">
          {/* <Globe className="h-3 w-3 mr-1" /> */}
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="hi">हिंदी</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
