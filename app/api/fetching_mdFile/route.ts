// app/api/upload-markdown/route.ts
import { NextResponse } from "next/server";
import { collection, getDocs } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { FileData, FileEntry } from "@/component/model/interface/FileDocuments";
import { db, getDownloadURL, ref, storage } from "@/lib/firebase";

// GET method to fetch all markdown files from Firestore
export async function GET() {
  try {
    const filesCollection = collection(db, "mdDocuments");
    const generatedLinksCollection = collection(db, "sharedLinks");

    const generatedLinksSnapshot = await getDocs(generatedLinksCollection);
    const filesSnapshot = await getDocs(filesCollection);

    // Create a map of generated links for quick lookup
    const generatedLinksMap = new Map();
    generatedLinksSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      generatedLinksMap.set(doc.id, {
        shareableUrl: data.shareableUrl,
        ...data, // Include any other metadata you might need
      });
    });

    const validFiles: FileEntry[] = [];

    for (const doc of filesSnapshot.docs) {
      const fileData = doc.data() as FileData;
      const fileId = doc.id;

      // Check if there's a matching generated link
      const matchingLink = generatedLinksMap.get(fileId);

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
          // Add shareable URL if there's a matching generated link
          ...(matchingLink && { shareableUrl: matchingLink.shareableUrl }),
        };

        validFiles.push(fileEntry);
      }
    }

    // Return the files in the format expected by your frontend
    return NextResponse.json(
      {
        files: validFiles.map((file) => ({
          name: file.name || file.id,
          fullPath: file.storagePath || `mdDocuments/${file.id}`,
          downloadURL: file.url,
          category: file.category || "Uncategorized",
          documentNumber: file.documentNumber || "",
          // Include shareable URL in the response if it exists
          ...(file.shareableUrl && { shareableUrl: file.shareableUrl }),
        })),
        count: validFiles.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error retrieving files:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve files",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
