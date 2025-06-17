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
  Download,
  Trash2,
  Plus,
  Search,
} from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
  status: "pending" | "extracting" | "processing" | "completed" | "error";
  extractedData?: ExtractedData;
  error?: string;
  rawText?: string;
}

export default function PDFExtractorUI() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [allExtractedData, setAllExtractedData] = useState<ExtractedData[]>([]);
  const [firebaseData, setFirebaseData] = useState<ExtractedData[]>([]);
  const [isLoadingFirebase, setIsLoadingFirebase] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  console.log("setFirebaseData", setFirebaseData);
  console.log("allExtractedData", allExtractedData);
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

  const handleFiles = useCallback(
    (files: File[]) => {
      const newFiles: UploadedFile[] = files.map((file) => ({
        file,
        status: "pending",
      }));

      setUploadedFiles((prev) => [...prev, ...newFiles]);

      // Start processing each file
      newFiles.forEach((uploadedFile, index) => {
        processFile(uploadedFile, uploadedFiles.length + index);
      });
    },
    [uploadedFiles.length]
  );

  // Extract text from PDF using PDF.js (simulated for demo)
  const extractTextFromPDF = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        // Simulate PDF text extraction
        setTimeout(() => {
          const simulatedText = `Document: ${file.name.replace(".pdf", "")}
          
This document contains comprehensive information about the subject matter, including:

- Detailed analysis and research findings
- Technical specifications and requirements  
- Best practices and recommendations
- Case studies and practical examples
- Implementation guidelines
- Future considerations and roadmap

The content is structured to provide valuable insights for professionals, researchers, 
and practitioners working in this field. It covers both theoretical foundations and 
practical applications, making it suitable for various use cases and audiences.

Key topics include methodology, results analysis, conclusions, and actionable recommendations 
that can be applied in real-world scenarios.`;

          resolve(simulatedText);
        }, 1000);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  // Function to clean title by removing alphanumeric patterns
  const cleanTitle = (title: string): string => {
    const cleanedTitle = title
      .replace(/\b\d+[A-Z]{1,3}\b/g, "")
      .replace(/\b[A-Z]{1,3}\d+\b/g, "")
      .replace(/\b[A-Z]{1,3}\b(?=\s|$)/g, "")
      .replace(/\b\d+[A-Z]*\b/g, "")
      .replace(/\s+/g, " ")
      .replace(/^[\s\-_]+|[\s\-_]+$/g, "")
      .trim();

    if (cleanedTitle.length < 3) {
      return title;
    }

    return cleanedTitle;
  };

  // Call OpenAI API to extract structured data
  const extractDataWithOpenAI = async (text: string, filename: string) => {
    try {
      const response = await fetch("/api/extract-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
          filename: filename,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to extract data with OpenAI");
      }

      const extractedData = await response.json();

      if (extractedData.title) {
        extractedData.title = cleanTitle(extractedData.title);
      }

      return extractedData;
    } catch (error) {
      console.error("OpenAI extraction failed, using fallback:", error);
    }
  };

  const processFile = async (uploadedFile: UploadedFile, index: number) => {
    try {
      setUploadedFiles((prev) =>
        prev.map((file, i) =>
          i === index ? { ...file, status: "extracting" } : file
        )
      );

      const extractedText = await extractTextFromPDF(uploadedFile.file);

      setUploadedFiles((prev) =>
        prev.map((file, i) =>
          i === index
            ? { ...file, status: "processing", rawText: extractedText }
            : file
        )
      );

      const extractedData = await extractDataWithOpenAI(
        extractedText,
        uploadedFile.file.name
      );

      setUploadedFiles((prev) =>
        prev.map((file, i) =>
          i === index ? { ...file, status: "completed", extractedData } : file
        )
      );

      // Add to extracted data array
      setAllExtractedData((prev) => [...prev, extractedData]);
    } catch (error) {
      setUploadedFiles((prev) =>
        prev.map((file, i) =>
          i === index
            ? {
                ...file,
                status: "error",
                error: error instanceof Error ? error.message : "Unknown error",
              }
            : file
        )
      );
    }
  };

  const removeFile = (index: number) => {
    const fileToRemove = uploadedFiles[index];
    if (fileToRemove.extractedData) {
      setAllExtractedData((prev) =>
        prev.filter((data) => data.id !== fileToRemove.extractedData!.id)
      );
    }
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
    setAllExtractedData([]);
  };

  const uploadToFirebase = async () => {
    if (allExtractedData.length === 0) {
      alert("No extracted data to upload");
      return;
    }

    setIsLoadingFirebase(true);

    console.log("allExtractedData", allExtractedData);
    try {
      const formData = new FormData();

      // Method 1: Send metadata as JSON string (RECOMMENDED)
      const metadata = allExtractedData.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        keyQuestion: item.keyQuestion,
        category: item.category,
        usefulFor: item.usefulFor,
        key: item.key,
      }));

      formData.append("metadata", JSON.stringify(metadata));

      uploadedFiles.forEach((file) => {
        formData.append("files[]", file.file); // or just "files" if your backend expects it
      });

      const token = localStorage.getItem("_token");

      console.log("token", token);

      const response = await fetch("/api/upload-to-firebase", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData, // ✅ Send FormData directly
        // Don't set Content-Type header - let browser set it with boundary
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.details || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log("results", result);
      console.log("Upload result:", result.documents.key);

      if (Array.isArray(result.documents)) {
        for (const item of result.documents) {
          console.log("Upload result:", item.id);

          await setDoc(doc(db, "pdfDocs", item.id), {
            id: item.id,
            title: item.title,
            category: item.category,
            description: item.description,
            keyQuestion: item.keyQuestion,
            usefulFor: item.usefulFor,
            key: item.key,
            url: item.url, // use 'url' not 'downloadURL'
            storagePath: item.storagePath,
            uploadedAt: item.uploadedAt,
          });

          uploadToPineconeHandler(item);
        }
      } else {
        console.warn("No documents uploaded.");
      }

      alert(
        `Successfully uploaded ${result.uploaded} out of ${allExtractedData.length} documents to Firebase!` +
          (result.errors ? `\n\nErrors: ${result.errors.length}` : "")
      );

      // loadFirebaseData();
    } catch (error) {
      alert(
        "Error uploading to Firebase: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setIsLoadingFirebase(false);
    }
  };

  const uploadToPineconeHandler = async (item: ExtractedData[]) => {
    setIsLoadingFirebase(true);
    try {
      console.log("item ari", item);
      const response = await fetch("/api/upload-to-pinecone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          item: item,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to load Firebase data");
      }
      const data = await response.json();

      console.log("data", data);
      // setFirebaseData(data);
    } catch (error) {
      alert(
        "Error loading Firebase data: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setIsLoadingFirebase(false);
    }
  };

  // const loadFirebaseData = async (item: ExtractedData[]) => {
  //   setIsLoadingFirebase(true);
  //   try {
  //     console.log("item");
  //     // const response = await fetch("/api/upload-to-pinecone");
  //     // if (!response.ok) {
  //     //   throw new Error("Failed to load Firebase data");
  //     // }
  //     // const data = await response.json();
  //     // setFirebaseData(data);
  //   } catch (error) {
  //     alert(
  //       "Error loading Firebase data: " +
  //         (error instanceof Error ? error.message : "Unknown error")
  //     );
  //   } finally {
  //     setIsLoadingFirebase(false);
  //   }
  // };

  const getStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "pending":
        return <FileText className="h-5 w-5 text-gray-400" />;
      case "extracting":
        return <FileText className="h-5 w-5 text-orange-500 animate-pulse" />;
      case "processing":
        return <Brain className="h-5 w-5 text-blue-500 animate-pulse" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusText = (status: UploadedFile["status"]) => {
    switch (status) {
      case "extracting":
        return "Extracting text...";
      case "processing":
        return "AI analyzing...";
      default:
        return status;
    }
  };

  const getUniqueCategories = (data: ExtractedData[]) => {
    const categories = data.map((item) => item.category);
    return ["All", ...Array.from(new Set(categories))];
  };

  const filteredExtractedData = allExtractedData.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredFirebaseData = firebaseData.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const completedCount = uploadedFiles.filter(
    (f) => f.status === "completed"
  ).length;
  const processingCount = uploadedFiles.filter(
    (f) => f.status === "extracting" || f.status === "processing"
  ).length;
  const errorCount = uploadedFiles.filter((f) => f.status === "error").length;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="text-center bg-white rounded-xl shadow-sm p-8">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <Brain className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          AI-Powered PDF Data Extractor
        </h1>
        <p className="text-gray-600 text-lg">
          Upload multiple PDFs to extract structured data using OpenAI
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Files</p>
              <p className="text-2xl font-bold text-gray-900">
                {uploadedFiles.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {completedCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <Loader2 className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Processing</p>
              <p className="text-2xl font-bold text-gray-900">
                {processingCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Errors</p>
              <p className="text-2xl font-bold text-gray-900">{errorCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* OpenAI Status */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Brain className="h-6 w-6 text-blue-600" />
            <div>
              <span className="font-semibold text-blue-900">
                OpenAI Integration
              </span>
              <span className="ml-3 text-sm text-green-700 bg-green-100 px-3 py-1 rounded-full">
                ✓ Ready
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-700">Extracted Documents</p>
            <p className="text-2xl font-bold text-blue-900">
              {allExtractedData.length}
            </p>
          </div>
        </div>
        <p className="text-sm text-blue-700 mt-3">
          AI automatically analyzes uploaded PDFs and extracts structured
          metadata with cleaned titles
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
            AI will extract structured data from your PDFs automatically
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
              Processing Files
            </h2>
            <div className="flex space-x-3">
              <button
                onClick={clearAllFiles}
                className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All
              </button>
              <button
                onClick={uploadToFirebase}
                disabled={isLoadingFirebase || allExtractedData.length === 0}
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
                    Upload to Firebase ({allExtractedData.length})
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
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      uploadedFile.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : uploadedFile.status === "processing"
                        ? "bg-blue-100 text-blue-800"
                        : uploadedFile.status === "extracting"
                        ? "bg-orange-100 text-orange-800"
                        : uploadedFile.status === "error"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {getStatusText(uploadedFile.status)}
                  </span>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filter */}
      {(allExtractedData.length > 0 || firebaseData.length > 0) && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {getUniqueCategories([
                  ...allExtractedData,
                  ...firebaseData,
                ]).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <button
                onClick={() =>
                  setViewMode(viewMode === "grid" ? "list" : "grid")
                }
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {viewMode === "grid" ? "List" : "Grid"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Extracted Data */}
      {allExtractedData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
              <Brain className="mr-3 h-6 w-6 text-blue-500" />
              AI Extracted Data ({filteredExtractedData.length})
            </h2>
          </div>

          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {filteredExtractedData.map((item, index) => (
              <div
                key={index}
                className={`border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow ${
                  viewMode === "list" ? "flex items-start space-x-4" : ""
                }`}
              >
                <div className={viewMode === "list" ? "flex-1" : ""}>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {item.title}
                    </h3>
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {item.description}
                  </p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Key Question:</strong> {item.keyQuestion}
                    </div>
                    <div>
                      <strong>Useful For:</strong> {item.usefulFor}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Firebase Data */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            Firebase Data ({filteredFirebaseData.length})
          </h2>
          <button
            // onClick={loadFirebaseData}
            disabled={isLoadingFirebase}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {isLoadingFirebase ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Loading...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Load Data
              </>
            )}
          </button>
        </div>

        {firebaseData.length > 0 ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {filteredFirebaseData.map((item, index) => (
              <div
                key={index}
                className={`border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow ${
                  viewMode === "list" ? "flex items-start space-x-4" : ""
                }`}
              >
                <div className={viewMode === "list" ? "flex-1" : ""}>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {item.title}
                    </h3>
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {item.description}
                  </p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Key Question:</strong> {item.keyQuestion}
                    </div>
                    <div>
                      <strong>Useful For:</strong> {item.usefulFor}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gray-100 rounded-full">
                <FileText className="h-12 w-12 text-gray-400" />
              </div>
            </div>
            <p className="text-gray-500 text-lg">
              No data loaded from Firebase
            </p>
            <p className="text-gray-400 text-sm">
              Click Load Data to fetch documents from Firebase
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
