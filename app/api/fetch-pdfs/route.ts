import { NextResponse } from "next/server";
import { db, ref, storage, getDownloadURL } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export async function GET() {
  try {
    // Access the PDF documents collection from Firestore
    const filesCollection = collection(db, "pdfDocuments");
    const filesSnapshot = await getDocs(filesCollection);

    // Array to store valid file entries
    const validFiles = [];

    // Loop through each document to extract necessary data
    for (const doc of filesSnapshot.docs) {
      const fileData = doc.data();
      const fileId = doc.id;

      let url = fileData.url;
      const storagePath = fileData.storagePath;

      try {
        // Skip if the storagePath is root or empty
        if (
          !url &&
          typeof storagePath === "string" &&
          storagePath.trim() &&
          storagePath !== "/" &&
          storagePath !== ""
        ) {
          const fileRef = ref(storage, storagePath);

          // Check if storagePath has a valid file extension
          if (/\.\w{2,5}$/.test(storagePath)) {
            // Attempt to fetch the download URL
            url = await getDownloadURL(fileRef);
          } else {
            console.warn(
              `⚠️ Skipping ${storagePath} — appears to be a folder or root path.`
            );
          }
        }
      } catch (storageError: any) {
        // Log and ignore any root path errors from Firebase Storage
        if (storageError.code !== "storage/invalid-root-operation") {
          console.warn(
            `⚠️ Skipping ${storagePath} (cannot generate URL):`,
            storageError.message
          );
        }
      }

      // Create the file entry with data, including the URL (if available)
      if (url) {
        const fileEntry = {
          ...fileData,
          id: fileId,
          url: url ?? null,
        };
        // Add the file entry to the validFiles array
        validFiles.push(fileEntry);
      }
    }

    // Return a JSON response with only valid files
    return NextResponse.json({
      statusCode: 200,
      validFiles,
      total: validFiles.length,
    });
  } catch (error) {
    // Log and handle any unexpected errors
    console.error("❌ Fatal error fetching files:", error);
    return NextResponse.json(
      {
        error: "Unexpected error occurred. Partial data may be missing.",
        details: (error as Error).message,
      },
      { status: 200 }
    );
  }
}
