// app/api/upload-markdown/route.ts
import { NextResponse } from "next/server";
import { collection, getDocs } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { FileData, FileEntry } from "@/component/model/interface/FileDocuments";
import { db, getDownloadURL, ref, storage } from "@/lib/firebase";

// POST method to fetch markdown files with pagination (page sent from frontend)
export async function POST(request: Request) {
  try {
    // Get the page parameter from request body
    const body = await request.json();
    const page = parseInt(body.page || "1", 10);
    const pageSize = 5; // Number of files per page

    const filesCollection = collection(db, "mdDocuments");
    const generatedLinksCollection = collection(db, "sharedLinks");

    const generatedLinksSnapshot = await getDocs(generatedLinksCollection);

    // Fetch all files (you might want to add ordering here)
    const filesSnapshot = await getDocs(filesCollection);

    // Create a map of generated links for quick lookup
    const generatedLinksMap = new Map();
    generatedLinksSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      generatedLinksMap.set(doc.id, {
        shareableUrl: data.shareableUrl,
        ...data,
      });
    });

    const validFiles: FileEntry[] = [];

    for (const doc of filesSnapshot.docs) {
      const fileData = doc.data() as FileData;
      const fileId = doc.id;

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
          ...(matchingLink && { shareableUrl: matchingLink.shareableUrl }),
        };

        validFiles.push(fileEntry);
      }
    }

    // Calculate pagination
    const totalFiles = validFiles.length;
    const totalPages = Math.ceil(totalFiles / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    // Get the files for the current page
    const paginatedFiles = validFiles.slice(startIndex, endIndex);

    // Return paginated results
    return NextResponse.json(
      {
        files: paginatedFiles.map((file) => ({
          name: file.name || file.id,
          fullPath: file.storagePath || `mdDocuments/${file.id}`,
          downloadURL: file.url,
          category: file.category || "Uncategorized",
          documentNumber: file.documentNumber || "",
          ...(file.shareableUrl && { shareableUrl: file.shareableUrl }),
        })),
        pagination: {
          currentPage: page,
          pageSize,
          totalFiles,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
        statusCode: 200,
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
