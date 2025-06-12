import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";

interface ExtractedData {
  id: string;
  title: string;
  category: string;
  description: string;
  keyQuestion: string[];
  usefulFor: string[] | string;
  key: string;
  url: string;
  testing: string;
}

interface PineconeVector {
  id: string;
  values: number[];
  metadata: {
    url: string;
    title: string;
    name: string;
    key: string;
    category: string;
    id: string;
    description: string;
    usefulFor?: string;
    keyQuestions: string[];
  };
}

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
  apiKey: process.env.OPENAI_API_KEY!,
  dimensions: 1536,
});

const MAX_CONCURRENCY = 5;

const estimateSizeInBytes = (obj: object): number =>
  Buffer.byteLength(JSON.stringify(obj), "utf8");

function safeStringArray(val: unknown): string[] {
  if (Array.isArray(val) && val.every((v) => typeof v === "string")) {
    return val;
  }
  if (typeof val === "string") {
    return [val];
  }
  return [];
}

function safeSingleString(val: unknown): string {
  if (typeof val === "string") {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map((v) => String(v)).join(", ");
  }
  return "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      item: ExtractedData | ExtractedData[];
    };
    const items: ExtractedData[] = Array.isArray(body.item)
      ? body.item
      : [body.item];

    console.log("item ari diri gooy", items);

    async function batchUpsert(
      vectors: PineconeVector[],
      maxBatchBytes = 4 * 1024 * 1024
    ): Promise<void> {
      let batch: PineconeVector[] = [];
      let batchSize = 0;

      for (const vector of vectors) {
        const vectorSize = estimateSizeInBytes(vector);
        if (batchSize + vectorSize > maxBatchBytes) {
          if (batch.length > 0) {
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
        await index.upsert(batch);
      }
    }

    async function retry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
      try {
        return await fn();
      } catch (err) {
        if (retries <= 0) throw err;
        console.warn(`🔁 Retrying... (${retries} left)`);
        return retry(fn, retries - 1);
      }
    }

    async function processWithConcurrencyLimit<T, R>(
      inputItems: T[],
      limit: number,
      processor: (item: T) => Promise<R>
    ): Promise<R[]> {
      const results: R[] = new Array(inputItems.length);
      let currentIndex = 0;

      const workers = Array.from({ length: limit }, async () => {
        while (true) {
          const index = currentIndex++;
          if (index >= inputItems.length) break;

          try {
            results[index] = await processor(inputItems[index]);
          } catch (error) {
            console.error(`Error processing item at index ${index}:`, error);
            throw error;
          }
        }
      });

      await Promise.all(workers);
      return results;
    }

    const filteredItem: ExtractedData[] = items.filter(
      (file, index): file is ExtractedData => {
        const isValid =
          file &&
          typeof file === "object" &&
          typeof file.title === "string" &&
          typeof file.category === "string" &&
          typeof file.description === "string" &&
          typeof file.id === "string" &&
          Array.isArray(file.keyQuestion);
        if (!isValid) {
          console.warn(`⚠️ Skipping invalid item at index ${index}:`, file);
        }
        return isValid;
      }
    );

    console.log("filteredItem", filteredItem);

    const vectors: PineconeVector[] = await processWithConcurrencyLimit(
      filteredItem,
      MAX_CONCURRENCY,
      async (file): Promise<PineconeVector> => {
        console.log("file", file);
        const combinedText = `${file.title} ${file.category} ${file.description}, ${file.id}, ${file.keyQuestion}`;

        const embedding = await retry(() =>
          embeddings.embedQuery(combinedText)
        );

        console.log(`📄 Indexed: ${file.title} → ${file.url}`);

        return {
          id: file.id,
          values: embedding,
          metadata: {
            url: file.url,
            title: file.title,
            name: file.id,
            key: file.key,
            category: file.category,
            id: file.id,
            description: file.description,
            keyQuestions: safeStringArray(file.keyQuestion),
            usefulFor: safeSingleString(file.usefulFor),
          },
        };
      }
    );

    await batchUpsert(vectors);

    return NextResponse.json({
      statusCode: 200,
      total: vectors.length,
      pineconeUpserts: vectors.length,
    });
  } catch (error) {
    console.error("Upload error", error);
    return NextResponse.json({
      statusCode: 500,
      error: "Failed to upload vectors to Pinecone.",
    });
  }
}
