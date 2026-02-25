import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import OpenAI from "openai";

// .env.local を明示的に読み込む
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  const vectorStore = await client.vectorStores.create({
    name: "施工管理-建築工事標準仕様書",
  });

  console.log("✅ Vector Store created:", vectorStore.id);

  const filePath = path.join(process.cwd(), "docs", "spec.pdf");

  if (!fs.existsSync(filePath)) {
    throw new Error(`PDFが見つかりません: ${filePath}`);
  }

  const file = await client.files.create({
    file: fs.createReadStream(filePath),
    purpose: "assistants",
  });

  console.log("✅ File uploaded:", file.id);

  const attached = await client.vectorStores.files.create(vectorStore.id, {
    file_id: file.id,
  });

  console.log("✅ File attached to Vector Store:", attached.id);
  console.log("");
  console.log("▼ これを .env.local に入れてください ▼");
  console.log(`OPENAI_VECTOR_STORE_ID=${vectorStore.id}`);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});