import { NextResponse } from "next/server";
// import { db, ref, storage, getDownloadURL } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { Pinecone } from "@pinecone-database/pinecone";
import { FileData, FileEntry } from "@/component/model/interface/FileDocuments";
import { OpenAIEmbeddings } from "@langchain/openai";
import { db, getDownloadURL, ref, storage } from "@/lib/firebase";
import { PineconeVector } from "@/component/model/interface/PineconeVector";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
  apiKey: process.env.OPENAI_API_KEY!,
});

const MAX_CONCURRENCY = 5;

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

        console.log("fileEntry", fileEntry);
        validFiles.push(fileEntry);
      }
    }

    // Helper function to clean metadata by removing null/undefined values
    // const cleanMetadata = (
    //   metadata: Record<string, any>
    // ): Record<string, any> => {
    //   const cleaned: Record<string, any> = {};

    //   for (const [key, value] of Object.entries(metadata)) {
    //     // Skip null, undefined values
    //     if (value === null || value === undefined) {
    //       continue;
    //     }

    //     // For arrays, filter out null/undefined elements
    //     if (Array.isArray(value)) {
    //       const cleanedArray = value.filter(
    //         (item) => item !== null && item !== undefined
    //       );
    //       if (cleanedArray.length > 0) {
    //         cleaned[key] = cleanedArray;
    //       }
    //       continue;
    //     }

    //     // For strings, only include non-empty strings
    //     if (typeof value === "string") {
    //       if (value.trim() !== "") {
    //         cleaned[key] = value;
    //       }
    //       continue;
    //     }

    //     // For numbers and booleans, include as-is
    //     if (typeof value === "number" || typeof value === "boolean") {
    //       cleaned[key] = value;
    //       continue;
    //     }
    //   }

    //   return cleaned;
    // };

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
          file.documentNumber
        } ${file.description} ${
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
            documentNumber: file.documentNumber || "",
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
