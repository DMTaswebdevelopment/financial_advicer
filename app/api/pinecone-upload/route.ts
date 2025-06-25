// app/api/upload-to-pinecone/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeVector } from "@/component/model/interface/PineconeVector";

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

// Initialize OpenAI Embeddings
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
  apiKey: process.env.OPENAI_API_KEY!,
});

const MAX_CONCURRENCY = 5;

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { validFiles } = body;

    if (!validFiles || !Array.isArray(validFiles)) {
      return NextResponse.json(
        { error: "Invalid request - validFiles array is required" },
        { status: 400 }
      );
    }

    // Utility functions
    const safeStringArray = (value: unknown): string[] =>
      Array.isArray(value) ? value.filter((v) => typeof v === "string") : [];

    const safeSingleString = (value: unknown): string | undefined =>
      typeof value === "string"
        ? value
        : Array.isArray(value) && typeof value[0] === "string"
        ? value[0]
        : undefined;

    const generateSafeId = (originalId: string): string =>
      Buffer.from(originalId)
        .toString("base64")
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 45);

    const estimateSizeInBytes = (obj: unknown): number =>
      Buffer.byteLength(JSON.stringify(obj), "utf8");

    async function batchUpsert(
      vectors: PineconeVector[],
      maxBatchBytes = 4 * 1024 * 1024
    ) {
      let batch: PineconeVector[] = [];
      let batchSize = 0;

      for (const vector of vectors) {
        const vectorSize = estimateSizeInBytes(vector);

        if (batchSize + vectorSize > maxBatchBytes) {
          if (batch.length > 0) {
            console.log(`📤 Upserting batch of ${batch.length} vectors`);
            await index.upsert(batch);
          }
          batch = [vector];
          batchSize = vectorSize;
        } else {
          batch.push(vector);
          batchSize += vectorSize;
        }
      }

      if (batch.length > 0) {
        console.log(`📤 Upserting final batch of ${batch.length} vectors`);
        await index.upsert(batch);
      }
    }

    async function retry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
      try {
        return await fn();
      } catch (err) {
        if (retries <= 0) throw err;
        console.warn(`🔁 Retrying... (${retries} left)`);
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Add delay
        return retry(fn, retries - 1);
      }
    }

    async function processWithConcurrencyLimit<T, R>(
      items: T[],
      limit: number,
      processor: (item: T) => Promise<R>
    ): Promise<R[]> {
      const results: R[] = [];
      let index = 0;

      async function worker() {
        while (index < items.length) {
          const currentIndex = index++;
          try {
            results[currentIndex] = await processor(items[currentIndex]);
          } catch (error) {
            console.error(`❌ Error processing item ${currentIndex}:`, error);
            throw error;
          }
        }
      }

      // Start limited number of workers
      await Promise.all(Array.from({ length: limit }, () => worker()));

      return results;
    }

    // Process files and create vectors
    const vectors: PineconeVector[] = await processWithConcurrencyLimit(
      validFiles,
      MAX_CONCURRENCY,
      async (file) => {
        const combinedText = `${file.title} ${file.name} ${file.category} ${
          file.documentSeries
        } ${
          Array.isArray(file.keyQuestions) ? file.keyQuestions.join(" ") : ""
        } ${Array.isArray(file.keywords) ? file.keywords.join(" ") : ""}`;

        const embedding = await retry(() =>
          embeddings.embedQuery(combinedText)
        );
        const safeId = generateSafeId(file.id);

        console.log(`📄 Indexed: ${file.title} → ${file.url}`);

        return {
          id: safeId,
          values: embedding,
          metadata: {
            url: file.url,
            title: file.title,
            name: file.name,
            key: safeId,
            category: file.category,
            id: file.id,
            description: file.description,
            uploadDate: safeStringArray(file.uploadDate),
            pageCount: file.pageCount,
            summary: file.summary?.slice(0, 60),
            documentSeries: file.documentSeries,
            claudeDocumentProfile: file.claudeDocumentProfile,
            usefulFor: safeSingleString(file.usefulFor),
            keywords: safeStringArray(file.keywords),
            keyQuestions: safeStringArray(file.keyQuestions),
          },
        };
      }
    );

    // Upload to Pinecone
    await batchUpsert(vectors);

    return NextResponse.json({
      statusCode: 200,
      message: "Successfully uploaded to Pinecone",
      validFiles,
      total: validFiles.length,
      pineconeUpserts: vectors.length,
    });
  } catch (error) {
    console.error("❌ Pinecone upload error:", error);
    return NextResponse.json(
      {
        error: "Failed to upload to Pinecone",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
