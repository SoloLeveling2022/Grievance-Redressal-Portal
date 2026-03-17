import { NextRequest, NextResponse } from "next/server";
import { categorizeComplaint } from "@/lib/bedrock";

/**
 * POST /api/grievances/categorize
 * Categorize a citizen complaint using Amazon Bedrock
 * Request: { complaintText: string, location?: string, language?: "hi"|"te"|"en" }
 * Response: { category, priority, department, summary }
 */
export async function POST(req: NextRequest) {
  try {
    const { complaintText, location, language = "en" } = await req.json();

    if (!complaintText || complaintText.trim().length === 0) {
      return NextResponse.json(
        { error: "Complaint text is required" },
        { status: 400 }
      );
    }

    console.log(`[Bedrock] Categorizing complaint: ${complaintText.substring(0, 50)}...`);

    // Use Bedrock to categorize the complaint
    const categorization = await categorizeComplaint(complaintText);

    // TODO: Save to DynamoDB
    // const complaintId = await saveComplaintToDB({
    //   text: complaintText,
    //   ...categorization,
    //   location,
    //   language,
    //   timestamp: new Date().toISOString(),
    // });

    return NextResponse.json({
      success: true,
      ...categorization,
      // complaintId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Bedrock] Categorize complaint error:", error);
    return NextResponse.json(
      { error: "Failed to categorize complaint: " + error?.message },
      { status: 500 }
    );
  }
}
