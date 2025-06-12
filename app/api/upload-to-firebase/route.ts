// API Route (optimized for large files)
import { storage } from "@/lib/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { NextResponse } from "next/server";

interface ExtractedData {
  id: string;
  title: string;
  category: string;
  description: string;
  keyQuestion: string;
  usefulFor: string;
  key: string;
}

interface ExtractedDataWithUrl extends ExtractedData {
  url: string;
  storagePath: string;
  uploadedAt: string;
}

export async function POST(request: Request) {
  try {
    // Parse FormData instead of JSON
    const formData = await request.formData();

    // Extract metadata
    const metadataString = formData.get("metadata") as string;
    if (!metadataString) {
      return NextResponse.json(
        { error: "No metadata provided" },
        { status: 400 }
      );
    }

    const metadata: ExtractedData[] = JSON.parse(metadataString);
    console.log("metadata", metadata);

    const uploadedDocuments: ExtractedDataWithUrl[] = [];
    const errors: string[] = [];

    for (let i = 0; i < metadata.length; i++) {
      const item = metadata[i];

      try {
        // Get the corresponding file from FormData
        const file = formData.get(`files[]`) as File;
        if (!file) {
          throw new Error(`No file provided for item ${i}`);
        }

        // Convert File to ArrayBuffer for Firebase upload
        const arrayBuffer = await file.arrayBuffer();
        const fileBuffer = new Uint8Array(arrayBuffer);

        const storagePath = `pdfDocs/${item.category}/${item.key}`;
        const storageRef = ref(storage, storagePath);

        // Upload with proper content type and metadata
        await uploadBytes(storageRef, fileBuffer, {
          contentType: "application/pdf",
        });

        const downloadURL = await getDownloadURL(storageRef);

        console.log("downloadURL", downloadURL);
        const documentData: ExtractedDataWithUrl = {
          id: item.id,
          title: item.title,
          category: item.category,
          description: item.description,
          keyQuestion: item.keyQuestion,
          usefulFor: item.usefulFor,
          key: item.key,
          url: downloadURL,
          storagePath,
          uploadedAt: new Date().toISOString(),
        };

        uploadedDocuments.push(documentData);
        console.log(`Successfully uploaded: ${item.title}`);
      } catch (itemError) {
        const errorMessage = `Failed to upload ${item.title}: ${
          itemError instanceof Error ? itemError.message : "Unknown error"
        }`;
        errors.push(errorMessage);
        console.error(errorMessage);
      }
    }

    return NextResponse.json({
      success: true,
      uploaded: uploadedDocuments.length,
      total: metadata.length,
      documents: uploadedDocuments,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Firebase upload error:", error);
    return NextResponse.json(
      {
        error: "Failed to upload to Firebase",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
