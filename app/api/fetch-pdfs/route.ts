import { NextResponse } from "next/server";
import { db, ref, storage, getDownloadURL } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { Pinecone } from "@pinecone-database/pinecone";
import { FileData, FileEntry } from "@/component/model/interface/FileDocuments";
import pLimit from "p-limit";

import { OpenAIEmbeddings } from "@langchain/openai";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

// Initialize OpenAI embeddings with text-embedding-3-large model
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large",
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function GET() {
  try {
    const filesCollection = collection(db, "pdfDocuments");
    const filesSnapshot = await getDocs(filesCollection);

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
          const fileRef = ref(storage, storagePath);

          if (/\.\w{2,5}$/.test(storagePath)) {
            url = await getDownloadURL(fileRef);
          } else {
            console.warn(
              `⚠️ Skipping ${storagePath} — appears to be a folder or root path.`
            );
          }
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

    function safeStringArray(value: unknown): string[] {
      if (Array.isArray(value)) {
        return value.filter((v) => typeof v === "string");
      }

      return [];
    }

    function generateSafeId(originalId: string): string {
      return Buffer.from(originalId)
        .toString("base64")
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 45); // Pinecone allows up to 45 ASCII chars
    }

    function estimateSizeInBytes(obj: any): number {
      return Buffer.byteLength(JSON.stringify(obj), "utf8");
    }

    async function batchUpsert(
      vectors: any[],
      maxBatchBytes = 4 * 1024 * 1024
    ) {
      let batch: any[] = [];
      let batchSize = 0;

      for (const vector of vectors) {
        const vectorSize = estimateSizeInBytes(vector);

        if (batchSize + vectorSize > maxBatchBytes) {
          // Send current batch
          if (batch.length > 0) {
            await index.upsert(batch);
          }
          // Start new batch
          batch = [vector];
          batchSize = vectorSize;
        } else {
          batch.push(vector);
          batchSize += vectorSize;
        }
      }

      // Send the final batch
      if (batch.length > 0) {
        await index.upsert(batch);
      }
    }

    // Retry wrapper
    async function retry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
      try {
        return await fn();
      } catch (err) {
        if (retries <= 0) throw err;
        console.warn(`🔁 Retrying... (${retries} left)`);
        return retry(fn, retries - 1);
      }
    }

    // Limit concurrency (e.g., 5 at a time)
    const limit = pLimit(5);

    const vectors = await Promise.all(
      validFiles.map((file) =>
        limit(async () => {
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

              uploadDate: safeStringArray(file.uploadDate),
              pageCount: file.pageCount,
              summary: file.summary?.slice(0, 60),
              documentSeries: file.documentSeries,
              claudeDocumentProfile: file.claudeDocumentProfile,
              usefulFor: file.usefulFor,
              keywords: safeStringArray(file.keywords),
              keyQuestions: safeStringArray(file.keyQuestions),
            },
          };
        })
      )
    );

    // 🧠 Call this instead of direct upsert:
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
