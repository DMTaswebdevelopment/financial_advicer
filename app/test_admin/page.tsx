// app/admin/page.tsx - Enhanced admin interface with table view and search
"use client";

import React, { useState, useEffect, useMemo } from "react";

interface UploadedFile {
  name: string;
  fullPath: string;
  downloadURL: string;
}

interface GeneratedLink {
  linkId: string;
  url: string;
  mdFileName: string;
  message: string;
}

export default function AdminPage() {
  const [mdFileName, setMdFileName] = useState("");
  const [mdContent, setMdContent] = useState("");
  const [generatedLink, setGeneratedLink] = useState<GeneratedLink | null>(
    null
  );
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"generate" | "files">("generate");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "date">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [isMDFetching, setIsMDFetching] = useState(true);

  // Load uploaded files on component mount
  useEffect(() => {
    if (isMDFetching) {
      const fetchPdfs = async () => {
        const res = await fetch("/api/upload_markdown");
        console.log("res", res);
        const response = await res.json();
        console.log("response", response);
        setUploadedFiles(response.files);
        setIsMDFetching(false);
      };
      fetchPdfs();
    }
  }, [isMDFetching]);

  // Extract document number from filename (assuming format like "DOC-123.md" or "Document_456.md")
  const extractDocNumber = (filename: string) => {
    const matches = filename.match(/(\d+)/);
    return matches ? matches[0] : "";
  };

  // Get file extension
  const getFileExtension = (filename: string) => {
    return filename.split(".").pop()?.toLowerCase() || "";
  };

  // Filter and sort files
  const filteredAndSortedFiles = useMemo(() => {
    let filtered = uploadedFiles.filter((file) => {
      const matchesSearch =
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        extractDocNumber(file.name).includes(searchQuery) ||
        file.fullPath.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        selectedFilter === "all" ||
        (selectedFilter === "md" && getFileExtension(file.name) === "md") ||
        (selectedFilter === "txt" && getFileExtension(file.name) === "txt") ||
        (selectedFilter === "other" &&
          !["md", "txt"].includes(getFileExtension(file.name)));

      return matchesSearch && matchesFilter;
    });

    // Sort files
    filtered.sort((a, b) => {
      let compareValue = 0;

      if (sortBy === "name") {
        compareValue = a.name.localeCompare(b.name);
      } else if (sortBy === "date") {
        // If you have creation date, use it. For now, we'll sort by name as fallback
        compareValue = a.name.localeCompare(b.name);
      }

      return sortOrder === "asc" ? compareValue : -compareValue;
    });

    return filtered;
  }, [uploadedFiles, searchQuery, selectedFilter, sortBy, sortOrder]);

  // Get unique file types for filter options
  const fileTypes = useMemo(() => {
    const types = new Set(
      uploadedFiles.map((file) => getFileExtension(file.name))
    );
    return Array.from(types).filter(Boolean);
  }, [uploadedFiles]);

  const loadUploadedFiles = async () => {
    try {
      const response = await fetch("/api/upload-markdown");
      console.log("response", response);
      const data = await response.json();
      console.log("data", data);
      if (response.ok) {
        setUploadedFiles(data.files);
      }
    } catch (error) {
      console.error("Error loading files:", error);
    }
  };

  const generateLink = async (fileName: string) => {
    setLoading(true);
    setError("");

    console.log("fileName", fileName);
    try {
      const response = await fetch("/api/generate-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mdFileName: fileName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate link");
      }

      setGeneratedLink(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: "name" | "date") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedFilter("all");
    setSortBy("name");
    setSortOrder("asc");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Markdown Content Manager</h1>

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6 border-b">
        {[
          { key: "generate", label: "Generate Links" },
          { key: "files", label: "Manage Files" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`pb-2 px-4 font-medium ${
              activeTab === tab.key
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-blue-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Generate Links Tab */}
      {activeTab === "generate" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Generate Shareable Links</h2>

          {/* Search and Filter Controls */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* Search Input */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search by filename or document number
                </label>
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* File Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File Type
                </label>
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="md">Markdown (.md)</option>
                  <option value="txt">Text (.txt)</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-600">
              Showing {filteredAndSortedFiles.length} of {uploadedFiles.length}{" "}
              files
            </div>
          </div>

          {/* Files Table */}
          <div className="overflow-x-auto bg-white rounded-lg border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>File Name</span>
                      {sortBy === "name" && (
                        <span className="text-blue-500">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doc Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Storage Path
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedFiles.map((file, index) => (
                  <tr key={file.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {file.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {extractDocNumber(file.name) || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs uppercase">
                        {getFileExtension(file.name) || "unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {file.fullPath}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => generateLink(file.downloadURL)}
                        disabled={loading}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? "Generating..." : "Generate Link"}
                      </button>
                      <a
                        href={file.downloadURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-gray-500 text-white px-3 py-1 rounded text-xs hover:bg-gray-600"
                      >
                        View Raw
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredAndSortedFiles.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {uploadedFiles.length === 0
                    ? "No files uploaded yet."
                    : "No files match your search criteria."}
                </p>
              </div>
            )}
          </div>

          {/* Generated Link Display */}
          {generatedLink && (
            <div className="mt-6 p-4 bg-green-100 border border-green-400 rounded-lg">
              <p className="text-green-800 font-medium mb-2">
                Link generated successfully!
              </p>
              <div className="space-y-2">
                <input
                  type="text"
                  value={generatedLink.url}
                  readOnly
                  className="w-full px-3 py-2 bg-white border border-green-300 rounded text-sm"
                />
                <div className="flex space-x-2">
                  <a
                    href={generatedLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-600"
                  >
                    Visit Link
                  </a>
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(generatedLink.url)
                    }
                    className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600"
                  >
                    Copy URL
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Files Tab */}
      {activeTab === "files" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">
              Uploaded Files ({uploadedFiles.length})
            </h2>
            <button
              onClick={loadUploadedFiles}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Refresh
            </button>
          </div>

          <div className="grid gap-4">
            {uploadedFiles.map((file) => (
              <div key={file.name} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium">{file.name}</h3>
                    <p className="text-sm text-gray-600">{file.fullPath}</p>
                  </div>
                  <div className="flex space-x-2">
                    <a
                      href={file.downloadURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View Raw
                    </a>
                    <button
                      onClick={() => generateLink(file.name)}
                      className="text-green-600 hover:underline text-sm"
                    >
                      Generate Link
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {uploadedFiles.length === 0 && (
            <p className="text-gray-600 text-center py-8">
              No files uploaded yet. Go to the Upload tab to add some content.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
