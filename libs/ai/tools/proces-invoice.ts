
import { LlamaParseReader } from "@llamaindex/cloud/reader";
import { openai, OpenAIEmbedding } from "@llamaindex/openai";
import { Settings, VectorStoreIndex } from "llamaindex";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Cache directory for storing parsed results
const CACHE_DIR = path.join(process.cwd(), 'cache', 'invoices');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function getCachePath(filePath: string, cacheType: string = 'full'): string {
  const fileHash = crypto.createHash('md5').update(filePath).digest('hex');
  return path.join(CACHE_DIR, `${fileHash}_${cacheType}.json`);
}

function loadFromCache(filePath: string, cacheType: string = 'full'): any | null {
  const cachePath = getCachePath(filePath, cacheType);
  try {
    if (fs.existsSync(cachePath)) {
      const data = fs.readFileSync(cachePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading cache:', error);
  }
  return null;
}

function saveToCache(filePath: string, result: any, cacheType: string = 'full'): void {
  const cachePath = getCachePath(filePath, cacheType);
  try {
    fs.writeFileSync(cachePath, JSON.stringify(result));
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
}

export async function extractTextFromPdf(filePath: string): Promise<[string | null, string | null]> {
  // Check cache first
  // const cachedResult = loadFromCache(filePath, 'llamaparse');
  // if (cachedResult) {
  //   return [cachedResult.rawText, null];
  // }

  try {

    const reader = new LlamaParseReader({
      apiKey: process.env.LLAMA_CLOUD_API_KEY,
      resultType: "markdown",
      baseUrl: 'https://api.cloud.eu.llamaindex.ai',
      fastMode: true,
    });
    const documents = await reader.loadData('https://a7owfwqnran7shxo.public.blob.vercel-storage.com/email_files/unknown/Invoice-TGIBTGSZ-0001-qAsSebtYDO7va7jj82tclDS0TeZCz0.pdf');

    // const parser = new LlamaParseReader({
    //   apiKey: process.env.LLAMA_CLOUD_API_KEY,
    //   baseUrl: 'https://api.cloud.eu.llamaindex.ai',
    //   resultType: 'markdown',
    //   // structured_output: true,
    //   // structured_output_json_schema_name: "invoice",
    //   fastMode: true,
    //   verbose: true,
    //   ignoreErrors: true,
    //   checkInterval: 3,
    // });

    // const documents = await parser.loadData('./test-invoice.pdf');

    console.log('documents', documents);


    // console.log('Processing file:', filePath);

    // let tempFilePath: string | null = null;
    try {
      // const response = await fetch(filePath);
      // if (!response.ok) {
      //   return [null, 'Failed to fetch file from URL'];
      // }
      
      // const arrayBuffer = await response.arrayBuffer();

      // console.log('local file path');

      // // create a temp file
      // tempFilePath = path.join(process.cwd(), 'temp', `temp_${Date.now()}.pdf`);
      // fs.writeFileSync(tempFilePath, new Uint8Array(arrayBuffer));

      // console.log('local file path', tempFilePath);

      // Read the file directly from the filesystem
      const docs = await parser.loadData('./test-invoice.pdf');
      
      console.log('docs', docs);

      if (!docs || docs.length === 0) {
        return [null, 'No content extracted from PDF'];
      }

      // Extract text content
      const rawText = docs.map(doc => doc.text).join('\n');

      // Save to cache
      saveToCache(filePath, { rawText }, 'llamaparse');

      return [rawText, null];
    } catch (error) {
      console.error('error', error);
      return [null, `LlamaParse error: ${error instanceof Error ? error.message : String(error)}`];
    } finally {
      // Clean up temporary file
      // if (tempFilePath && fs.existsSync(tempFilePath)) {
      //   fs.unlinkSync(tempFilePath);
      // }
    }
    
  } catch (error) {
    return [null, `LlamaParse error: ${error instanceof Error ? error.message : String(error)}`];
  }
}