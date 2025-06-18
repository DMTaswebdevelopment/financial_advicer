"use client";

import React, { useState, useCallback } from "react";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  Brain,
  Trash2,
  Plus,
} from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db, getDownloadURL, ref, storage } from "@/lib/firebase";
import { FileData, FileEntry } from "@/component/model/interface/FileDocuments";

interface ExtractedData {
  id: string;
  title: string;
  category: string;
  description: string;
  keyQuestion: string;
  usefulFor: string;
  key: string;
}

interface UploadedFile {
  file: File;
  status: "pending" | "uploading" | "completed" | "error";
  extractedData?: ExtractedData;
  error?: string;
  rawText?: string;
}

interface fileDatas {
  fileId: string;
  fileName: string;
  category: string;
  storagePath: string;
}

export default function PDFExtractorUI() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoadingFirebase, setIsLoadingFirebase] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (file) => file.type === "application/pdf"
    );
    handleFiles(files);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files = Array.from(e.target.files);
        handleFiles(files);
      }
    },
    []
  );

  const handleFiles = useCallback((files: File[]) => {
    const newFiles: UploadedFile[] = files.map((file) => ({
      file,
      status: "pending",
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
  };

  const uploadToFirebase = async () => {
    if (uploadedFiles.length === 0) {
      alert("No files to upload");
      return;
    }

    setIsLoadingFirebase(true);

    // Update all files to uploading status
    setUploadedFiles((prev) =>
      prev.map((file) => ({ ...file, status: "uploading" as const }))
    );

    try {
      const formData = new FormData();

      // Add all PDF files to FormData
      uploadedFiles.forEach((uploadedFile) => {
        formData.append("files[]", uploadedFile.file);
      });

      const token = localStorage.getItem("_token");

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch("/api/upload-to-firebase", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.details || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log("Upload result:", result);

      // Extract the document IDs from the upload result
      const uploadedDocumentIds =
        result.files?.map((file: fileDatas) => file.fileId) || [];

      const filesCollection = collection(db, "pdfDocuments");
      const filesSnapshot = await getDocs(filesCollection);

      const validFiles: FileEntry[] = [];

      // Only process documents that match the uploaded IDs
      for (const doc of filesSnapshot.docs) {
        const fileId = doc.id;

        // FIXED: Create a more robust matching function
        const isDocumentUploaded = (docId: string, uploadedIds: string[]) => {
          return uploadedIds.some((uploadedId) => {
            // Remove file extension from uploaded ID for comparison
            const normalizedUploadedId = uploadedId.replace(/\.pdf$/i, "");
            return normalizedUploadedId === docId || uploadedId === docId;
          });
        };

        // Skip if this document ID is not in our uploaded list
        if (!isDocumentUploaded(fileId, uploadedDocumentIds)) {
          continue;
        }

        const fileData = doc.data() as FileData;
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
          console.log("storageError", storageError);
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

      if (validFiles.length === 0) {
        alert("No valid files found for the uploaded documents");
        return;
      }

      const res = await fetch("/api/pinecone-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          validFiles: validFiles,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.details || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const reshere = await res.json();
      console.log("✅ Pinecone auto-upload successful:", reshere);

      // Update file statuses based on result
      setUploadedFiles((prev) =>
        prev.map((file) => {
          const wasUploaded = result.files?.some(
            (uploadedFile: any) => uploadedFile.fileName === file.file.name
          );
          return {
            ...file,
            status: wasUploaded ? "completed" : "error",
            error: wasUploaded ? undefined : "Upload failed",
          };
        })
      );

      alert(
        `Successfully uploaded ${result.uploaded} out of ${result.total} files to Firebase Storage!` +
          (result.errors ? `\n\nErrors: ${result.errors.length}` : "") +
          `\n\nProcessed metadata for ${validFiles.length} documents` +
          "\n\nYour Firebase trigger will now process the PDFs and extract metadata automatically."
      );
    } catch (error) {
      console.error("Upload error:", error);

      // Update all files to error status
      setUploadedFiles((prev) =>
        prev.map((file) => ({
          ...file,
          status: "error" as const,
          error: error instanceof Error ? error.message : "Upload failed",
        }))
      );

      alert(
        "Error uploading to Firebase: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setIsLoadingFirebase(false);
    }
  };

  const getStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "pending":
        return <FileText className="h-5 w-5 text-gray-400" />;
      case "uploading":
        return <Upload className="h-5 w-5 text-blue-500 animate-pulse" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusText = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
        return "Uploading to Firebase...";
      case "completed":
        return "Uploaded successfully";
      case "error":
        return "Upload failed";
      default:
        return status;
    }
  };
  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center bg-white rounded-xl shadow-sm p-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Brain className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            PDF Upload to Firebase
          </h1>
          <p className="text-gray-600 text-lg">
            Upload PDFs to Firebase Storage - automatic extraction via trigger
          </p>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-xl shadow-sm">
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
              isDragOver
                ? "border-blue-400 bg-blue-50 scale-105"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gray-100 rounded-full">
                <Upload className="h-12 w-12 text-gray-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Drop PDF files here or click to upload
            </h3>
            <p className="text-gray-500 mb-6">
              Files will be uploaded to Firebase Storage for automatic
              processing
            </p>
            <input
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors"
            >
              <Plus className="mr-2 h-5 w-5" />
              Select Files
            </label>
          </div>
        </div>

        {/* Processing Files */}
        {uploadedFiles.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                Files Ready for Upload
              </h2>
              <div className="flex space-x-3">
                <button
                  onClick={clearAllFiles}
                  disabled={isLoadingFirebase}
                  className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All
                </button>
                <button
                  onClick={uploadToFirebase}
                  disabled={isLoadingFirebase || uploadedFiles.length === 0}
                  className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoadingFirebase ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload to Firebase ({uploadedFiles.length})
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid gap-4">
              {uploadedFiles.map((uploadedFile, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(uploadedFile.status)}
                    <div>
                      <p className="font-medium text-gray-900">
                        {uploadedFile.file.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      {uploadedFile.error && (
                        <p className="text-sm text-red-500">
                          {uploadedFile.error}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        uploadedFile.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : uploadedFile.status === "uploading"
                          ? "bg-blue-100 text-blue-800"
                          : uploadedFile.status === "error"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {getStatusText(uploadedFile.status)}
                    </span>
                    <button
                      onClick={() => removeFile(index)}
                      disabled={isLoadingFirebase}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
