import { NextResponse } from "next/server";
// import { db, ref, storage, getDownloadURL } from "@/lib/firebase";
import { db, storage, admin } from "@/lib/firebase-admin";
import { collection, getDocs } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { Pinecone } from "@pinecone-database/pinecone";
import { FileData, FileEntry } from "@/component/model/interface/FileDocuments";
import { OpenAIEmbeddings } from "@langchain/openai";

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
    uploadDate: string[];
    pageCount?: number;
    summary?: string;
    description: string;
    documentSeries?: string;
    claudeDocumentProfile?: string;
    usefulFor?: string; // ✅ should be string, not string[]
    keywords: string[];
    keyQuestions: string[];
  };
}

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large",
  apiKey: process.env.OPENAI_API_KEY!,
});

const MAX_CONCURRENCY = 5;

export async function GET() {
  try {
    const filesSnapshot = await db.collection("pdfDocuments").get();
    // const filesSnapshot = await getDocs(filesCollection);

    const validFiles: FileEntry[] = [];

    for (const doc of filesSnapshot.docs) {
      const fileData = doc.data() as FileData;
      const fileId = doc.id;

      let url = fileData.url ?? "";
      const storagePath = fileData.storagePath;

      try {
        if (
          !url &&
          typeof storagePath === "string" &&
          storagePath.trim() &&
          storagePath !== "/" &&
          storagePath !== ""
        ) {
          const bucketName = process.env.FIREBASE_STORAGE_BUCKET;

          const file = storage.bucket(bucketName).file(storagePath);
          const [signedUrl] = await file.getSignedUrl({
            action: "read",
            expires: Date.now() + 60 * 60 * 1000, // 1 hour
          });
          url = signedUrl;
        }
      } catch (storageError) {
        if (storageError instanceof FirebaseError) {
          if (storageError.code !== "storage/invalid-root-operation") {
            console.warn(
              `⚠️ Skipping ${storagePath} (cannot generate URL):`,
              storageError.message
            );
          }
        } else {
          console.warn(
            `⚠️ Unknown error while fetching ${storagePath}:`,
            String(storageError)
          );
        }
      }

      if (url) {
        const fileEntry: FileEntry = {
          ...fileData,
          id: fileId,
          url,
        };

        validFiles.push(fileEntry);
      }
    }

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
      items: T[],
      limit: number,
      processor: (item: T) => Promise<R>
    ): Promise<R[]> {
      const results: R[] = [];
      let index = 0;

      async function worker() {
        while (index < items.length) {
          const currentIndex = index++;
          results[currentIndex] = await processor(items[currentIndex]);
        }
      }

      // Start limited number of workers
      await Promise.all(Array.from({ length: limit }, () => worker()));

      return results;
    }

    const vectors: PineconeVector[] = await processWithConcurrencyLimit(
      validFiles,
      MAX_CONCURRENCY,
      async (file) => {
        const combinedText = `${file.title} ${file.name} ${file.category} ${
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

    await batchUpsert(vectors);

    return NextResponse.json({
      statusCode: 200,
      validFiles,
      total: validFiles.length,
      pineconeUpserts: vectors.length,
    });
  } catch (error) {
    console.error("❌ Fatal error fetching files:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Unexpected error occurred. Partial data may be missing.",
        details: message,
      },
      { status: 200 }
    );
  }
}
