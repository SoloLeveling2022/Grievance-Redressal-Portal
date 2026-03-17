// Server route: accepts { text, language } and returns simplified text via Amazon Bedrock Nova
import type { NextRequest } from "next/server"
import { invokeBedrockModel } from "@/lib/bedrock"

export async function POST(req: NextRequest) {
  console.log("[API] /api/gemini/interpret - Request received")
  
  try {
    const body = await req.json()
    console.log("[API] Request body:", { textLength: body?.text?.length, language: body?.language })
    
    const text: string = body?.text || ""
    const language: "hi" | "te" | "en" = body?.language || "hi"

    if (!text) {
      console.log("[API] Error: No text provided")
      return new Response(JSON.stringify({ error: "No text provided" }), { status: 400 })
    }

    const languageMap = {
      hi: "Hindi (हिंदी)",
      te: "Telugu (తెలుగు)",
      en: "English",
    }

    const prompt = `You are assisting citizens who may not be literate. Analyze the following government notice board or circular text. Do the following:

1. Simplify the meaning into easy everyday language.
2. Translate into ${languageMap[language]} if needed.
3. Return ONLY the plain text explanation, nothing else. Keep sentences short and clear.
4. Use simple everyday words that common people understand.

Notice text: ${text}`

    console.log("[API] Calling Bedrock...")
    const resultText = await invokeBedrockModel(prompt)
    console.log("[API] Bedrock response received, length:", resultText.length)

    // Language script validation
    let langWarning: string | null = null
    if (language === "hi") {
      const hasDevanagari = [...resultText].some((c) => c >= "\u0900" && c <= "\u097F")
      if (!hasDevanagari) langWarning = "Warning: Response may not be in Hindi script."
    } else if (language === "te") {
      const hasTelugu = [...resultText].some((c) => c >= "\u0C00" && c <= "\u0C7F")
      if (!hasTelugu) langWarning = "Warning: Response may not be in Telugu script."
    }

    console.log("[API] Sending response to client")
    return new Response(JSON.stringify({ text: resultText, langWarning }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (e: any) {
    console.error("[API] /api/gemini/interpret error:", e?.message || e)
    console.error("[API] Full error:", e)
    return new Response(JSON.stringify({ 
      error: "Server error: " + e?.message,
      details: e?.toString() 
    }), { status: 500 })
  }
}
