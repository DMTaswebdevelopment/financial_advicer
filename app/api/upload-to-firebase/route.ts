import { NextRequest, NextResponse } from "next/server";
import { ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";

function detectDocumentSeries(text: string) {
  // Series detection patterns
  const seriesPatterns = [
    {
      pattern: /Missing Lessons Series|ML-|ML |474ML/i,
      name: "Missing Lessons Series",
    },
    {
      pattern: /Checklist Series|CL-|CL |474CL/i,
      name: "Checklist & Practical Guide Series",
    },
    {
      pattern: /Financial Fluency Series|FF-|FF |474FF/i,
      name: "Financial Fluency Series",
    },
    {
      pattern: /Detailed Knowledge Series|DK-|DK |474DK/i,
      name: "Detailed Knowledge Series",
    },
    {
      pattern:
        /Advisory Essentials Series|AE-|AE |Advisor Essentials Series|474AE/i,
      name: "Advisory Essentials Series",
    },
  ];

  // Search for matching patterns in the filename and document content
  for (const seriesInfo of seriesPatterns) {
    if (seriesInfo.pattern.test(text)) {
      return seriesInfo.name;
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    const files = formData.getAll("files[]") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const uploadedFiles = [];
    const errors = [];

    for (const file of files) {
      try {
        // Validate file type
        if (file.type !== "application/pdf") {
          errors.push(`File ${file.name} is not a PDF`);
          continue;
        }

        // Detect document series/category from filename
        const category = detectDocumentSeries(file.name);

        const storagePath = `BAKR/${category}/${file.name}`;

        console.log("storagePath", storagePath);
        // // Upload file to Firebase Storage
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, file);

        uploadedFiles.push({
          fileName: file.name,
          category: category,
          storagePath: storagePath,
          fileId: file.name,
        });
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        errors.push(
          `Failed to upload ${file.name}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    // Return response
    return NextResponse.json({
      success: true,
      uploaded: uploadedFiles.length,
      total: files.length,
      files: uploadedFiles,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully uploaded ${uploadedFiles.length} out of ${files.length} files to Firebase Storage`,
    });
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
