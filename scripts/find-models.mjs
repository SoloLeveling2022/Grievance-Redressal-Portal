// Find Working Bedrock Models - Run with: node scripts/find-models.mjs

import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const ACCESS_KEY = "AKIAWJDMSGBPEX3XITTK";
const SECRET_KEY = "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";

console.log("=== Finding Working Bedrock Models ===\n");

const modelsToTest = [
  // Amazon Titan Models (Foundation)
  { id: "amazon.titan-text-premier-v1:0", name: "Amazon Titan Text Premier", format: "titan" },
  { id: "amazon.titan-text-express-v1", name: "Amazon Titan Text Express (old)", format: "titan" },
  { id: "amazon.titan-text-lite-v1", name: "Amazon Titan Text Lite (old)", format: "titan" },
  
  // Amazon Nova Models (2024/2025)
  { id: "amazon.nova-micro-v1:0", name: "Amazon Nova Micro", format: "nova" },
  { id: "amazon.nova-lite-v1:0", name: "Amazon Nova Lite", format: "nova" },
  { id: "amazon.nova-pro-v1:0", name: "Amazon Nova Pro", format: "nova" },
  
  // Anthropic Claude (Usually available)
  { id: "anthropic.claude-3-haiku-20240307-v1:0", name: "Claude 3 Haiku", format: "claude" },
  { id: "anthropic.claude-3-5-sonnet-20241022-v2:0", name: "Claude 3.5 Sonnet", format: "claude" },
  
  // Meta Llama (May require subscription)
  { id: "meta.llama3-8b-instruct-v1:0", name: "Llama 3 8B", format: "llama" },
  
  // AI21 Labs (Usually available)
  { id: "ai21.jamba-1-5-mini-v1:0", name: "AI21 Jamba 1.5 Mini", format: "ai21" },
];

async function testModel(modelId, modelName, format) {
  process.stdout.write(`Testing ${modelName}... `);
  
  const client = new BedrockRuntimeClient({
    region: "us-east-1",
    credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
  });
  
  let payload;
  
  if (format === "titan") {
    payload = { inputText: "Hi", textGenerationConfig: { maxTokenCount: 10 } };
  } else if (format === "nova") {
    payload = {
      schemaVersion: "messages-v1",
      messages: [{ role: "user", content: [{ text: "Hi" }] }],
      inferenceConfig: { maxTokens: 10 },
    };
  } else if (format === "claude") {
    payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 10,
      messages: [{ role: "user", content: "Hi" }],
    };
  } else if (format === "llama" || format === "ai21") {
    payload = { prompt: "Hi", max_gen_len: 10 };
  }
  
  try {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 8000)
    );
    
    const response = await Promise.race([
      client.send(new InvokeModelCommand({
        modelId,
        body: JSON.stringify(payload),
      })),
      timeout
    ]);
    
    console.log("✅ WORKS!");
    return { modelId, modelName, format, works: true };
  } catch (error) {
    if (error.name === "ResourceNotFoundException" || error.message.includes("end of its life")) {
      console.log("❌ Not available (deprecated/not enabled)");
    } else if (error.name === "AccessDeniedException") {
      console.log("❌ No access (may need to accept terms)");
    } else if (error.message === "timeout") {
      console.log("⏱️  Timeout (may be slow)");
    } else {
      console.log(`❌ Error: ${error.name}`);
    }
    return { modelId, modelName, format, works: false, error: error.name };
  }
}

// Test all models
const results = [];
for (const model of modelsToTest) {
  const result = await testModel(model.id, model.name, model.format);
  results.push(result);
}

console.log("\n=== Summary ===\n");

const workingModels = results.filter(r => r.works);

if (workingModels.length > 0) {
  console.log("✅ Working models found:\n");
  workingModels.forEach(m => {
    console.log(`   ${m.modelName}`);
    console.log(`   Model ID: ${m.modelId}`);
    console.log(`   Format: ${m.format}\n`);
  });
  
  console.log("🎯 RECOMMENDED: Use this in your .env.local:\n");
  console.log(`BEDROCK_TEXT_MODEL_ID="${workingModels[0].modelId}"`);
  console.log();
} else {
  console.log("❌ No working models found!");
  console.log("\nPossible fixes:");
  console.log("1. Models may need manual enablement (old AWS accounts)");
  console.log("2. Try different region (us-west-2, eu-west-1)");
  console.log("3. Check AWS Bedrock console for available models");
}
