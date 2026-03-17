// Quick Bedrock Test - Run with: node scripts/quick-test.mjs
// This bypasses Next.js to isolate the issue

import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

console.log("=== Quick Bedrock Test ===\n");

// Hardcode your credentials temporarily for testing
const ACCESS_KEY = "AKIAWJDMSGBPEX3XITTK";
const SECRET_KEY = "YLCvHCLZZQv81tCvldr6u6Wh89pL3F0ImgUlg9jG";
const REGION = "us-east-1";

console.log("Creating client...");
const client = new BedrockRuntimeClient({
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
});

console.log("Client created. Testing Amazon Nova Pro model...\n");

const payload = {
  schemaVersion: "messages-v1",
  messages: [
    {
      role: "user",
      content: [{ text: "Say 'Hello from Bedrock!' in one sentence." }],
    },
  ],
  inferenceConfig: {
    maxTokens: 50,
    temperature: 0.7,
  },
};

const command = new InvokeModelCommand({
  modelId: "amazon.nova-pro-v1:0",
  body: JSON.stringify(payload),
  contentType: "application/json",
});

console.log("Sending request...");
console.log("⏳ Waiting for response (max 10 seconds)...\n");

// Hard timeout to prevent infinite hanging
const timeout = new Promise((_, reject) => {
  setTimeout(() => {
    console.error("❌ TIMEOUT: Request hung for 10 seconds");
    console.error("\nPossible causes:");
    console.error("  1. Firewall/Corporate proxy blocking AWS API calls");
    console.error("  2. IAM user has no permissions (silent failure)");
    console.error("  3. AWS endpoint unreachable from your network");
    reject(new Error("Request timeout after 10 seconds"));
  }, 10000);
});

try {
  const response = await Promise.race([
    client.send(command),
    timeout
  ]);
  
  console.log("\n✅ SUCCESS!");
  const body = JSON.parse(new TextDecoder().decode(response.body));
  
  // Nova format response parsing
  const text = body?.output?.message?.content?.[0]?.text || 
               body?.content?.[0]?.text || 
               JSON.stringify(body);
  
  console.log("Response:", text);
  console.log("\n🎉 Amazon Bedrock Nova Pro is working!");
  console.log("You can now use Bedrock in your CitiConnect app!\n");
} catch (error) {
  console.error("\n❌ ERROR:", error.name);
  console.error("Message:", error.message);
  console.error("\nFull error:", error);
  
  if (error.name === "AccessDeniedException") {
    console.log("\n🔧 FIX: Go to AWS IAM Console:");
    console.log("   1. Go to: https://console.aws.amazon.com/iam/");
    console.log("   2. Click 'Users' → Your username");
    console.log("   3. Click 'Add permissions' → 'Attach policies directly'");
    console.log("   4. Search and select: AmazonBedrockFullAccess");
    console.log("   5. Click 'Add permissions'");
    console.log("   6. Wait 1-2 minutes and run this script again");
  } else if (error.name === "ResourceNotFoundException") {
    console.log("\n🔧 FIX: Model not available in your region");
    console.log("   Try changing REGION to 'us-west-2' above");
  }
  
  process.exit(1);
}
