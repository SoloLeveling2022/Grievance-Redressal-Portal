import { NextRequest, NextResponse } from "next/server";
import { invokeBedrockModel } from "@/lib/bedrock";

export async function POST(req: NextRequest) {
  try {
    const { symptoms, additionalInfo, location } = await req.json();

    if (!symptoms) {
      return NextResponse.json({ error: "No symptoms provided" }, { status: 400 });
    }

    const enhancedPrompt = `You are a highly accurate medical assistant. Analyze the following symptoms and provide structured medical guidance. Return ONLY a valid JSON object, no markdown, no explanation.

Respond with this JSON structure:
{
  "condition": "string (most likely condition)",
  "confidence": number (0-100),
  "severity": "mild|moderate|severe",
  "description": "short description",
  "recommendations": ["array of home remedies"],
  "whenToSeekCare": ["warning signs"],
  "followUp": {
    "recommended": boolean,
    "timeframe": "string",
    "reason": "string"
  },
  "medications": [
    {
      "name": "string",
      "dosage": "string",
      "precautions": ["array"]
    }
  ],
  "officersVideoScript": "positive, empathetic script (max 2 min)"
}

Symptoms: ${symptoms}
Additional Info: ${additionalInfo || "None"}
Location: ${location ? JSON.stringify(location) : "Not available"}

Respond ONLY with valid JSON, no extra text.`;

    const response = await invokeBedrockModel(enhancedPrompt);

    // Try to parse the JSON from the model's response
    let diagnosis = null;
    try {
      // Find the first JSON object in the text
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        diagnosis = JSON.parse(jsonMatch[0]);
      }
    } catch (err) {
      console.error("JSON parse error:", err);
      diagnosis = null;
    }

    if (diagnosis) {
      return NextResponse.json({ diagnosis });
    } else {
      return NextResponse.json(
        {
          error: "Could not parse diagnosis JSON.",
          raw: response,
        },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error("Symptom analysis error:", error);
    return NextResponse.json({ error: "Failed to analyze symptoms: " + error?.message }, { status: 500 });
  }
}
