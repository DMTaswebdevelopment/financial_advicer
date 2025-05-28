// import { NextResponse } from "next/server";
// import { db, ref, storage, getDownloadURL } from "@/lib/firebase";
// import { collection, getDocs } from "firebase/firestore";
// import { FirebaseError } from "firebase/app";

// interface FileData {
//   name: string;
//   title: string;
//   category: string;
//   url?: string;
//   storagePath?: string;
//   keyQuestions?: string[];
//   keywords?: string[];
// }

// interface FileEntry extends FileData {
//   id: string;
//   url: string;
// }

// export async function GET() {
//   try {
//     const filesCollection = collection(db, "pdfDocuments");
//     const filesSnapshot = await getDocs(filesCollection);

//     const validFiles: FileEntry[] = [];

//     for (const doc of filesSnapshot.docs) {
//       const fileData = doc.data() as FileData;
//       const fileId = doc.id;

//       let url = fileData.url ?? "";
//       const storagePath = fileData.storagePath;

//       try {
//         if (
//           !url &&
//           typeof storagePath === "string" &&
//           storagePath.trim() &&
//           storagePath !== "/" &&
//           storagePath !== ""
//         ) {
//           const fileRef = ref(storage, storagePath);

//           if (/\.\w{2,5}$/.test(storagePath)) {
//             url = await getDownloadURL(fileRef);
//           } else {
//             console.warn(
//               `⚠️ Skipping ${storagePath} — appears to be a folder or root path.`
//             );
//           }
//         }
//       } catch (storageError) {
//         if (storageError instanceof FirebaseError) {
//           if (storageError.code !== "storage/invalid-root-operation") {
//             console.warn(
//               `⚠️ Skipping ${storagePath} (cannot generate URL):`,
//               storageError.message
//             );
//           }
//         } else {
//           console.warn(
//             `⚠️ Unknown error while fetching ${storagePath}:`,
//             String(storageError)
//           );
//         }
//       }

//       if (url) {
//         const fileEntry: FileEntry = {
//           ...fileData,
//           id: fileId,
//           url,
//         };
//         validFiles.push(fileEntry);
//       }
//     }

//     return NextResponse.json({
//       statusCode: 200,
//       validFiles,
//       total: validFiles.length,
//     });
//   } catch (error) {
//     console.error("❌ Fatal error fetching files:", error);
//     const message = error instanceof Error ? error.message : "Unknown error";
//     return NextResponse.json(
//       {
//         error: "Unexpected error occurred. Partial data may be missing.",
//         details: message,
//       },
//       { status: 200 }
//     );
//   }
// }

import { NextResponse } from "next/server";
import { db, ref, storage, getDownloadURL } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { Pinecone } from "@pinecone-database/pinecone";
import { HfInference } from "@huggingface/inference";
import { FileData, FileEntry } from "@/component/model/interface/FileDocuments";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY!);
const HF_EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2";

async function generateEmbedding(text: string): Promise<number[]> {
  const result = await hf.featureExtraction({
    model: HF_EMBEDDING_MODEL,
    inputs: text,
  });

  return result as number[];
}

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

    const vectors = await Promise.all(
      validFiles.map(async (file) => {
        const combinedText = `${file.title} ${file.name} ${file.category} ${
          Array.isArray(file.keyQuestions) ? file.keyQuestions.join(" ") : ""
        } ${Array.isArray(file.keywords) ? file.keywords.join(" ") : ""}`;

        const embedding = await generateEmbedding(combinedText);

        return {
          id: file.id,
          values: embedding,
          metadata: {
            title: file.title,
            name: file.name,
            category: file.category,
            url: file.url,
            uploadDate: safeStringArray(file.uploadDate),
            pageCount: file.pageCount,
            summary: file.summary,
            documentSeries: file.documentSeries,
            claudeDocumentProfile: file.claudeDocumentProfile,
            fullText: file.fullText.slice(0, 5000), // truncate large fields

            // Flattened arrays
            usefulFor: file.usefulFor,
            keywords: safeStringArray(file.keywords),
            // Key Questions
            keyQuestions: safeStringArray(file.keyQuestions),

            topics: file.topics.map((t) => `${t.topic}:${t.confidence}`),
            financialContext: file.relevanceSignals.financialContext,
            formatSignals: file.relevanceSignals.formatSignals,
            targetAudience: file.relevanceSignals.targetAudience,
            timelinessSignals: file.relevanceSignals.timelinessSignals,

            // Misconceptions
            misconception: file.misconceptions?.text ?? "",
            misconceptionConfidence: file.misconceptions?.confidence ?? 0,
            misconceptionContext: file.misconceptions?.context ?? "",

            // Implicit
            implicitQuestion: file.implicit?.question ?? "",
            implicitConfidence: file.implicit?.confidence ?? 0,
            implicitType: file.implicit?.type ?? "",

            // Readability
            readabilityScore: file.readability?.score ?? 0,
            readabilityDifficulty: file.readability?.difficulty ?? "",
            readabilityEngagement: file.readability?.readerEngagement ?? "",
            readabilityFormatAccessibility:
              file.readability?.formatAccessibilityScore ?? 0,
            readabilityExplanationScore:
              file.readability?.explanationScore ?? 0,

            // DateInfo
            dates: file.dateInfo?.dates ?? [],
            isTimeSensitive: file.dateInfo?.isTimeSensitive ?? false,
            mostRecentYear: file.dateInfo?.mostRecentYear ?? null,
            years: file.dateInfo?.years ?? [],

            // Search metadata
            complexity: file.searchMetadata?.complexity ?? "",
            hasEducationalContent:
              file.searchMetadata?.hasEducationalContent ?? false,
            hasPracticalGuidance:
              file.searchMetadata?.hasPracticalGuidance ?? false,
            documentType: file.searchMetadata?.documentType ?? "",

            // Flattened sub-arrays from searchMetadata
            concernAreas: file.searchMetadata?.concernAreas ?? [],
            lifeStages: file.searchMetadata?.lifeStages ?? [],
            topicAreas: file.searchMetadata?.topicAreas ?? [],
            relevantSituations: file.searchMetadata?.relevantSituations ?? [],
            misconceptionTopics: file.searchMetadata?.misconceptionTopics ?? [],
            painPoints: file.searchMetadata?.painPoints ?? [],
          },
        };
      })
    );

    await index.upsert(vectors);

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
