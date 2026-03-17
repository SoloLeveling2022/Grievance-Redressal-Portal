/**
 * Test script to diagnose Bedrock connectivity and model access
 * Run with: node --loader ts-node/esm scripts/test-bedrock.mjs
 * Or: tsx scripts/test-bedrock.ts
 */

import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

console.log("=== Bedrock Diagnostic Test ===\n");

// Check environment variables
console.log("1. Environment Variables:");
console.log("   AWS_REGION:", process.env.AWS_REGION || "NOT SET");
console.log("   AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID ? "SET ✓" : "NOT SET ✗");
console.log("   AWS_SECRET_ACCESS_KEY:", process.env.AWS_SECRET_ACCESS_KEY ? "SET ✓" : "NOT SET ✗");
console.log("   BEDROCK_TEXT_MODEL_ID:", process.env.BEDROCK_TEXT_MODEL_ID || "NOT SET");
console.log("");

// Initialize client
console.log("2. Initializing Bedrock Client...");
const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});
console.log("   Client initialized ✓\n");

// Test models in order of reliability
const modelsToTest = [
  { id: "amazon.titan-text-express-v1", name: "Amazon Titan Text Express" },
  { id: "amazon.titan-text-lite-v1", name: "Amazon Titan Text Lite" },
  { id: "anthropic.claude-3-haiku-20240307-v1:0", name: "Claude 3 Haiku" },
  { id: "amazon.nova-micro-v1:0", name: "Amazon Nova Micro" },
  { id: "amazon.nova-lite-v1:0", name: "Amazon Nova Lite" },
  { id: "amazon.nova-pro-v1:0", name: "Amazon Nova Pro" },
];

async function testModel(modelId: string, modelName: string) {
  console.log(`3. Testing ${modelName} (${modelId})...`);
  
  try {
    const payload = {
      inputText: "Hello, respond with 'OK' if you can hear me.",
      textGenerationConfig: {
        maxTokenCount: 50,
        temperature: 0.7,
      },
    };

    const command = new InvokeModelCommand({
      modelId,
      body: JSON.stringify(payload),
      contentType: "application/json",
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    console.log("   ✓ SUCCESS!");
    console.log("   Response:", JSON.stringify(responseBody, null, 2).substring(0, 200));
    console.log("\n   🎉 THIS MODEL WORKS! Use this model ID in your .env.local:");
    console.log(`   BEDROCK_TEXT_MODEL_ID="${modelId}"\n`);
    
    return true;
  } catch (error: any) {
    console.log("   ✗ FAILED");
    console.log("   Error:", error.name, "-", error.message);
    console.log("");
    return false;
  }
}

// Run tests
(async () => {
  for (const model of modelsToTest) {
    const success = await testModel(model.id, model.name);
    if (success) {
      console.log("=== Test Complete ===");
      process.exit(0);
    }
  }
  
  console.log("❌ None of the models worked. Possible issues:");
  console.log("   1. IAM permissions not set (need bedrock:InvokeModel)");
  console.log("   2. Wrong AWS region");
  console.log("   3. Models not enabled in your account");
  console.log("\nTo fix:");
  console.log("   1. Go to AWS IAM → Your User → Add AmazonBedrockFullAccess policy");
  console.log("   2. Wait 1-2 minutes for permissions to propagate");
  console.log("   3. Run this script again");
})();
