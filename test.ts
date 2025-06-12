import { LlamaParseReader } from "@llamaindex/cloud/reader";
import { openai, OpenAIEmbedding } from "@llamaindex/openai";
import { Settings, VectorStoreIndex } from "llamaindex";

import dotenv from 'dotenv';
dotenv.config();

Settings.llm = openai({
  model: "gpt-4o-mini",
});
Settings.embedModel = new OpenAIEmbedding({
  model: "text-embedding-3-small",
});

async function main() {
  // Load PDF using LlamaParse
  const reader = new LlamaParseReader({
    apiKey: process.env.LLAMA_CLOUD_API_KEY,
    resultType: "markdown",
    baseUrl: 'https://api.cloud.eu.llamaindex.ai',
  });
  const documents = await reader.loadData('https://a7owfwqnran7shxo.public.blob.vercel-storage.com/email_files/unknown/Invoice-TGIBTGSZ-0001-qAsSebtYDO7va7jj82tclDS0TeZCz0.pdf');

  console.log('documents', documents);

  // Split text and create embeddings. Store them in a VectorStoreIndex
  const index = await VectorStoreIndex.fromDocuments(documents);

  // Query the index
  const queryEngine = index.asQueryEngine();
  const response = await queryEngine.query({
    query: "What is the license grant in the TOS?",
  });

  // Output response
  console.log(response.toString());
}

main().catch(console.error);