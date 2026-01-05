// app/api/generate-link/route.ts
import { getBaseUrl } from "@/lib/baseUrl";
import { db, storage } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
  doc,
  setDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const { mdFileName, id } = await request.json();

    if (!mdFileName && !id) {
      return NextResponse.json(
        { error: "mdFileName and id are required" },
        { status: 400 }
      );
    }

    // ✅ Check if file already has a link in Firestore
    const q = query(
      collection(db, "sharedLinks"),
      where("mdFileName", "==", mdFileName),
      where("isActive", "==", true) // optional: only check active links
    );
    const existingDocs = await getDocs(q);

    if (!existingDocs.empty) {
      return NextResponse.json(
        { error: "A link has already been generated for this file." },
        { status: 400 }
      );
    }

    // Generate a unique link ID
    const linkId = uuidv4();
    const baseUrl = getBaseUrl();
    const shareableUrl = `${baseUrl}/content/${linkId}?file=${encodeURIComponent(
      mdFileName
    )}`;
    const liveUrl = `https://www.bakr.com.au/content/${linkId}?file=${encodeURIComponent(
      mdFileName
    )}`;
    let fileUrl = null;

    try {
      const fileName = `shared-files/${id}/${mdFileName}`;
      const storageRef = ref(storage, fileName);

      const blob = new Blob([mdFileName], { type: "text/markdown" });
      const uploadResult = await uploadBytes(storageRef, blob);

      fileUrl = await getDownloadURL(uploadResult.ref);
    } catch (storageError) {
      console.error("Error uploading file to storage:", storageError);
    }

    const linkData = {
      id,
      mdFileName,
      shareableUrl,
      liveUrl,
      fileUrl,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      accessCount: 0,
      isActive: true,
    };

    await setDoc(doc(db, "sharedLinks", id), linkData);

    return NextResponse.json({
      linkId,
      url: shareableUrl,
      liveUrl: liveUrl,
      mdFileName,
      message: "Link generated successfully",
    });
  } catch (error) {
    console.error("Error generating link:", error);
    return NextResponse.json(
      { error: "Failed to generate link" },
      { status: 500 }
    );
  }
}
