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

    const safeStringArray = (value: unknown): string[] =>
      Array.isArray(value) ? value.filter((v) => typeof v === "string") : [];

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
          file.documentSeries
        } ${file.claudeDocumentProfile}  ${file.category} ${
          file.documentNumber
        } ${file.key} ${file.dateInfo.forClaudeAPI} ${file.usefulFor} ${
          file.keyQuestions?.all
        } ${file.url} ${file.key} ${file.description} ${
          file.relevanceSignals?.financialContext
        }  ${file.relevanceSignals?.targetAudience} ${
          file.relevanceSignals?.timelinessSignals
        } ${file.searchMetadata?.concernAreas} ${
          file.searchMetadata?.relevantSituations
        } ${file.searchMetadata?.roleTargets} ${
          file.searchMetadata?.searchTerms
        } ${file.searchMetadata?.semanticTags} ${
          file.searchMetadata?.specificAudiences
        } ${file.searchMetadata?.targetAudience} ${
          file.searchMetadata?.topicAreas
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
            forClaudeAPI: file.dateInfo.forClaudeAPI,
            summary: file.summary?.slice(0, 60),
            documentSeries: file.documentSeries,
            documentNumber: file.documentNumber || "",
            claudeDocumentProfile: file.claudeDocumentProfile,
            usefulFor: file.usefulFor,
            keywords: safeStringArray(file.keywords),
            keyQuestions: file.keyQuestions?.all,
            keyQuestionsImplicit:
              file.keyQuestions?.implicit?.map(
                (i) =>
                  `question: ${i.question} | confidence: ${i.confidence} | source: ${i.source} | type: ${i.type}`
              ) || [],
            misconceptions: Array.isArray(file.misconceptions)
              ? file.misconceptions.map(
                  (m) =>
                    `text: ${m.text} | confidence: ${m.confidence} | context: ${
                      m.context
                    } | topics: ${m.topics?.join(", ")}`
                )
              : [],
            relevanceSignals_contentAttributes: file.relevanceSignals
              ?.contentAttributes
              ? Object.entries(file.relevanceSignals.contentAttributes).map(
                  ([key, value]) => `${key}: ${value}`
                )
              : [],
            relevanceSignals_financialContext:
              file.relevanceSignals?.financialContext,
            relevanceSignals_targetAudience:
              file.relevanceSignals?.targetAudience,
            relevanceSignals_timelinessSignals:
              file.relevanceSignals?.timelinessSignals,
            searchMetadata_concernAreas: file.searchMetadata?.concernAreas,
            searchMetadata_relevantSituations:
              file.searchMetadata?.relevantSituations,
            searchMetadata_roleTargets: file.searchMetadata?.roleTargets,
            searchMetadata_searchTerms: file.searchMetadata?.searchTerms,
            searchMetadata_semanticTags: file.searchMetadata?.semanticTags,
            searchMetadata_specificAudiences:
              file.searchMetadata?.specificAudiences,
            searchMetadata_targetAudiences: file.searchMetadata?.targetAudience,
            searchMetadata_topicAreas: file.searchMetadata?.topicAreas,
            searchMetadata_topicHierarchy: file.searchMetadata?.topicHierarchy,
            // textChunks: Array.isArray(file.textChunks)
            //   ? file.textChunks.map(
            //       (m) =>
            //         `content: ${m.content} | heading: ${m.heading} | index: ${m.index} | isComplete: ${m.isComplete} | nextChuckHeading: ${m.nextChunkHeading} | prevChuckHeading: ${m.prevChunkHeading} `
            //     )
            //   : [],
            topics: Array.isArray(file.topics)
              ? file.topics.map(
                  (m) => `confidence: ${m.confidence} | topic: ${m.topic} `
                )
              : [],
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
