import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";

// Initialize Bedrock client with explicit credentials
console.log("[Bedrock] Initializing client...");
console.log("[Bedrock] Region:", process.env.AWS_REGION || "us-east-1");
console.log("[Bedrock] Access Key:", process.env.AWS_ACCESS_KEY_ID ? "SET" : "MISSING");
console.log("[Bedrock] Secret Key:", process.env.AWS_SECRET_ACCESS_KEY ? "SET" : "MISSING");

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

/**
 * Invoke Bedrock model with text prompt
 * @param prompt The text prompt to send
 * @param modelId The Bedrock model ID (default: Nova Pro)
 * @returns Parsed model response
 */
export async function invokeBedrockModel(
  prompt: string,
  modelId: string = process.env.BEDROCK_TEXT_MODEL_ID || "amazon.titan-text-express-v1"
): Promise<string> {
  console.log("[Bedrock] Starting invocation...");
  console.log("[Bedrock] Model ID:", modelId);
  console.log("[Bedrock] Prompt length:", prompt.length);

  try {
    // Validate credentials before calling
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error("AWS credentials not configured. Check .env.local file.");
    }

    // Different payload formats for different model families
    let payload: any;
    let responseParser: (body: any) => string;

    if (modelId.startsWith("amazon.titan")) {
      // Amazon Titan format
      payload = {
        inputText: prompt,
        textGenerationConfig: {
          maxTokenCount: 2000,
          temperature: 0.7,
          topP: 0.9,
        },
      };
      responseParser = (body) => body?.results?.[0]?.outputText || body?.outputText || "No response";
    } else if (modelId.startsWith("amazon.nova")) {
      // Amazon Nova format (Messages API)
      payload = {
        schemaVersion: "messages-v1",
        messages: [
          {
            role: "user",
            content: [{ text: prompt }],
          },
        ],
        inferenceConfig: {
          temperature: 0.7,
          maxTokens: 2000,
        },
      };
      responseParser = (body) => body?.output?.message?.content?.[0]?.text || body?.content?.[0]?.text || "No response";
    } else if (modelId.startsWith("anthropic.claude")) {
      // Claude format
      payload = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      };
      responseParser = (body) => body?.content?.[0]?.text || "No response";
    } else {
      // Generic fallback
      payload = {
        inputText: prompt,
        textGenerationConfig: {
          maxTokenCount: 2000,
          temperature: 0.7,
        },
      };
      responseParser = (body) => body?.outputText || body?.text || body?.completion || "No response";
    }

    console.log("[Bedrock] Sending request to Bedrock...");
    console.log("[Bedrock] Payload:", JSON.stringify(payload).substring(0, 200));
    
    const command = new InvokeModelCommand({
      modelId,
      body: JSON.stringify(payload),
      contentType: "application/json",
      accept: "application/json",
    });

    console.log("[Bedrock] Command created, sending to AWS...");

    // Reduce timeout to 15 seconds for faster debugging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => {
        console.error("[Bedrock] TIMEOUT - Request took longer than 15 seconds!");
        reject(new Error("Bedrock request timeout after 15s"));
      }, 15000)
    );

    let response: any;
    try {
      console.log("[Bedrock] Awaiting response from AWS SDK...");
      response = await Promise.race([
        bedrockClient.send(command),
        timeoutPromise,
      ]);
      console.log("[Bedrock] Response object received!");
    } catch (sdkError: any) {
      console.error("[Bedrock] SDK Error caught:", sdkError?.name, sdkError?.message);
      throw sdkError;
    }

    console.log("[Bedrock] Response received, parsing...");
    
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log("[Bedrock] Response body keys:", Object.keys(responseBody));

    // Extract text using the appropriate parser
    const text = responseParser(responseBody);

    console.log("[Bedrock] Text extracted, length:", text.length);

    return text;
  } catch (error: any) {
    console.error("[Bedrock] Invocation error:", error);
    console.error("[Bedrock] Error name:", error?.name);
    console.error("[Bedrock] Error message:", error?.message);
    
    // Provide more helpful error messages
    if (error?.name === "UnrecognizedClientException") {
      throw new Error("AWS credentials are invalid. Check your Access Key and Secret Key.");
    } else if (error?.name === "ResourceNotFoundException") {
      throw new Error(`Model ${modelId} not found. Try using "amazon.titan-text-express-v1" instead.`);
    } else if (error?.name === "AccessDeniedException") {
      throw new Error("Access denied. Go to AWS IAM and add AmazonBedrockFullAccess policy to your user.");
    } else if (error?.message?.includes("timeout")) {
      throw new Error("Bedrock request timed out. Try again or check network connectivity.");
    } else if (error?.name === "ValidationException") {
      throw new Error(`Invalid request format for model ${modelId}. ${error.message}`);
    }
    
    throw new Error(`Bedrock API error: ${error?.message || error}`);
  }
}

/**
 * Invoke Bedrock model with streaming (for real-time responses)
 * @param prompt The text prompt to send
 * @param modelId The Bedrock model ID
 * @param onChunk Callback for each streamed chunk
 */
export async function invokeBedrockModelStream(
  prompt: string,
  modelId: string = process.env.BEDROCK_TEXT_MODEL_ID || "amazon.nova-pro-v1:0",
  onChunk?: (chunk: string) => void
): Promise<string> {
  try {
    const payload = {
      schemaVersion: "messages-v1",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    };

    const command = new InvokeModelWithResponseStreamCommand({
      modelId,
      body: JSON.stringify(payload),
    });

    const response = await bedrockClient.send(command);
    let fullResponse = "";

    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;

        if (value) {
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data:")) {
              try {
                const jsonData = JSON.parse(line.substring(5));
                const text = jsonData?.contentBlockDelta?.delta?.text || "";
                if (text) {
                  fullResponse += text;
                  if (onChunk) onChunk(text);
                }
              } catch (e) {
                // Skip parse errors in streaming data
              }
            }
          }
        }
      }
    }

    return fullResponse;
  } catch (error) {
    console.error("Bedrock streaming error:", error);
    throw new Error(`Bedrock streaming error: ${error}`);
  }
}

/**
 * Categorize a grievance complaint using Bedrock
 * @param complaintText The complaint description
 * @returns Categorization result
 */
export async function categorizeComplaint(complaintText: string): Promise<{
  category: string;
  priority: "low" | "medium" | "high" | "critical";
  department: string;
  summary: string;
}> {
  const prompt = `You are a grievance categorization expert. Analyze the following citizen complaint and return a JSON object with: category (string), priority (low/medium/high/critical), department (string), summary (1-2 sentences).

Complaint: "${complaintText}"

Return ONLY valid JSON, no markdown or explanation:`;

  const response = await invokeBedrockModel(prompt);

  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No JSON found in response");
  } catch (error) {
    console.error("Categorization parse error:", error);
    // Return default fallback
    return {
      category: "Other",
      priority: "medium",
      department: "General",
      summary: complaintText.substring(0, 100),
    };
  }
}

/**
 * Generate a citizen-friendly response to a complaint
 * @param complaintText The complaint
 * @param language Language code (hi, te, en)
 * @returns Response text
 */
export async function generateCitizenResponse(
  complaintText: string,
  language: "hi" | "te" | "en" = "en"
): Promise<string> {
  const languageMap = {
    hi: "Hindi",
    te: "Telugu",
    en: "English",
  };

  const prompt = `You are a government complaints coordinator. Generate a short, respectful acknowledgment of this complaint in ${languageMap[language]}. Keep it under 100 words.

Complaint: "${complaintText}"

Respond in ${languageMap[language]} only:`;

  return await invokeBedrockModel(prompt);
}

/**
 * Analyze symptoms (health use case)
 * @param symptoms Description of symptoms
 * @param location Optional location for facility recommendations
 * @returns Health analysis result
 */
export async function analyzeSymptoms(
  symptoms: string,
  location?: string
): Promise<{
  condition: string;
  severity: "mild" | "moderate" | "severe";
  recommendations: string[];
  whenToSeek: string[];
}> {
  const prompt = `You are a medical assistant. Analyze these symptoms and respond with a JSON object containing: condition (string), severity (mild/moderate/severe), recommendations (array of strings), whenToSeek (array of warning signs).

Symptoms: "${symptoms}"
${location ? `Location: ${location}` : ""}

Return ONLY valid JSON:`;

  const response = await invokeBedrockModel(prompt);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No JSON found in response");
  } catch (error) {
    console.error("Symptom analysis parse error:", error);
    return {
      condition: "Unable to determine",
      severity: "moderate",
      recommendations: ["Please consult a officers"],
      whenToSeek: ["Any worsening symptoms"],
    };
  }
}

export { bedrockClient };
