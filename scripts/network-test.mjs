// Network Connectivity Test for AWS Bedrock
// Run with: node scripts/network-test.mjs

console.log("=== AWS Network Connectivity Test ===\n");

// Test 1: Can we reach AWS endpoints?
console.log("Test 1: Checking if AWS Bedrock endpoint is reachable...");

const bedrockEndpoint = "https://bedrock-runtime.us-east-1.amazonaws.com";

try {
  const response = await fetch(bedrockEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  
  console.log("✅ AWS endpoint is reachable!");
  console.log(`   Status: ${response.status}`);
  console.log(`   (403 is expected - means endpoint exists but auth is needed)\n`);
} catch (error) {
  console.error("❌ Cannot reach AWS endpoint!");
  console.error(`   Error: ${error.message}\n`);
  
  if (error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED")) {
    console.log("🔧 ISSUE: Network connectivity problem");
    console.log("   Possible fixes:");
    console.log("   1. Check your internet connection");
    console.log("   2. Check if corporate firewall blocks AWS");
    console.log("   3. Try using a VPN or different network");
    console.log("   4. Check proxy settings\n");
  }
  
  process.exit(1);
}

// Test 2: Check IAM credentials are valid format
console.log("Test 2: Validating AWS credentials format...");

const ACCESS_KEY = "AKIAWJDMSGBPEX3XITTK";
const SECRET_KEY = "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";

if (!ACCESS_KEY.startsWith("AKIA")) {
  console.error("❌ Access Key format invalid (should start with AKIA)\n");
  process.exit(1);
}

if (SECRET_KEY.length < 40) {
  console.error("❌ Secret Key too short (should be 40 characters)\n");
  process.exit(1);
}

console.log("✅ Credentials format looks valid\n");

// Test 3: Try IAM authentication test
console.log("Test 3: Testing IAM authentication...");
console.log("(This will timeout if firewall blocks AWS or IAM has no permissions)\n");

import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";

const stsClient = new STSClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
});

const identityTimeout = new Promise((_, reject) => {
  setTimeout(() => reject(new Error("STS request timeout")), 8000);
});

try {
  const identity = await Promise.race([
    stsClient.send(new GetCallerIdentityCommand({})),
    identityTimeout
  ]);
  
  console.log("✅ IAM authentication successful!");
  console.log(`   Account: ${identity.Account}`);
  console.log(`   User ARN: ${identity.Arn}\n`);
  
  // Test 4: Now test Bedrock specifically
  console.log("Test 4: Testing Bedrock API access...");
  
  const { BedrockRuntimeClient, InvokeModelCommand } = await import("@aws-sdk/client-bedrock-runtime");
  
  const bedrockClient = new BedrockRuntimeClient({
    region: "us-east-1",
    credentials: {
      accessKeyId: ACCESS_KEY,
      secretAccessKey: SECRET_KEY,
    },
  });
  
  const payload = {
    inputText: "test",
    textGenerationConfig: { maxTokenCount: 10 },
  };
  
  const bedrockTimeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Bedrock timeout")), 10000);
  });
  
  const bedrockResponse = await Promise.race([
    bedrockClient.send(new InvokeModelCommand({
      modelId: "amazon.titan-text-express-v1",
      body: JSON.stringify(payload),
    })),
    bedrockTimeout
  ]);
  
  console.log("✅ Bedrock API works!");
  console.log("\n🎉 All tests passed! Your AWS setup is correct.\n");
  
} catch (error) {
  console.error("\n❌ Test failed:", error.name);
  console.error(`   Message: ${error.message}\n`);
  
  if (error.message.includes("timeout")) {
    console.log("🔧 ISSUE: Request timeout");
    console.log("   This means:");
    console.log("   • Network/Firewall is blocking AWS API calls");
    console.log("   • Corporate proxy might be interfering");
    console.log("   • Try running from a different network (home wifi, mobile hotspot)");
  } else if (error.name === "AccessDeniedException") {
    console.log("🔧 ISSUE: No Bedrock permissions");
    console.log("   Fix: Add AmazonBedrockFullAccess policy to your IAM user");
    console.log("   URL: https://console.aws.amazon.com/iam/");
  } else if (error.name === "UnrecognizedClientException") {
    console.log("🔧 ISSUE: Invalid credentials");
    console.log("   Fix: Create new access keys in IAM console");
  }
  
  console.log();
  process.exit(1);
}
