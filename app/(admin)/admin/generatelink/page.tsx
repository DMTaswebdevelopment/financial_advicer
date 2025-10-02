// app/admin/page.tsx - Enhanced admin interface with react-loading-skeleton
"use client";

import FetchingDMFiles from "@/component/model/interface/FetchingDMFiles";
import { getFetchingMDFiles, setFetchingMDFiles } from "@/redux/storageSlice";
import { Download, Link } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface GeneratedLink {
  linkId: string;
  url: string;
  mdFileName: string;
  message: string;
}

export default function AdminPage() {
  const dispatch = useDispatch();
  const fetchingMDFiles = useSelector(getFetchingMDFiles);
  const [generatedLink, setGeneratedLink] = useState<GeneratedLink | null>(
    null
  );

  const [mdFiles, setMdFiles] = useState<FetchingDMFiles[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"name" | "date">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [isMDFetching, setIsMDFetching] = useState<boolean>(true);

  // Load uploaded files on component mount
  useEffect(() => {
    if (isMDFetching) {
      // Check if Redux store has data
      if (fetchingMDFiles && fetchingMDFiles.length > 0) {
        // Use data from Redux store
        setMdFiles(fetchingMDFiles);
        setIsMDFetching(false);
      } else {
        // Redux store is empty, call API
        const fetchPdfs = async () => {
          try {
            const res = await fetch("/api/fetching_mdFile");

            const response = await res.json();
            // Store in local state
            setMdFiles(response.files);

            // Store in Redux
            dispatch(setFetchingMDFiles(response.files));

            setIsMDFetching(false);
          } catch (error) {
            console.error("Error fetching MD files:", error);
            setIsMDFetching(false);
          }
        };
        fetchPdfs();
      }
    }
  }, [isMDFetching, fetchingMDFiles, dispatch]);

  // Extract document number from filename (assuming format like "DOC-123.md" or "Document_456.md")
  const extractDocNumber = (filename: string) => {
    const matches = filename.match(/(\d+)/);
    return matches ? matches[0] : "";
  };

  // Get file extension
  // const getFileExtension = (filename: string) => {
  //   return filename.split(".").pop()?.toLowerCase() || "";
  // };

  // Filter and sort files
  const filteredAndSortedFiles = useMemo(() => {
    if (isMDFetching) return [];

    let filtered = mdFiles
      .filter((file) => {
        const matchesSearch =
          file.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          extractDocNumber(file.name).includes(searchQuery) ||
          file.fullPath.toLowerCase().includes(searchQuery.toLowerCase());

        // Transform category for filtering comparison
        let transformedCategory = file.category;
        switch (file.category) {
          case "Advisory Essentials Series":
            transformedCategory = "AE";
            break;
          case "Checklist Series":
            transformedCategory = "CL";
            break;
          case "Detailed Knowledge Series":
            transformedCategory = "DK";
            break;
          case "Missing Lessons Series":
            transformedCategory = "ML";
            break;
          default:
            transformedCategory = file.category;
        }

        // Fix the filter logic to use the transformed category
        const matchesFilter =
          selectedFilter === "ALL" ||
          selectedFilter === "all" || // Add this for consistency
          (selectedFilter === "AE" && transformedCategory === "AE") ||
          (selectedFilter === "CL" && transformedCategory === "CL") ||
          (selectedFilter === "DK" && transformedCategory === "DK") ||
          (selectedFilter === "ML" && transformedCategory === "ML") ||
          (selectedFilter === "other" &&
            !["AE", "CL", "DK", "ML"].includes(transformedCategory));

        return matchesSearch && matchesFilter;
      })
      .map((file) => {
        // Transform category for display
        let updatedCategory = file.category;
        switch (file.category) {
          case "Advisory Essentials Series":
            updatedCategory = "AE";
            break;
          case "Checklist Series":
            updatedCategory = "CL";
            break;
          case "Detailed Knowledge Series":
            updatedCategory = "DK";
            break;
          case "Missing Lessons Series":
            updatedCategory = "ML";
            break;
          default:
            updatedCategory = file.category;
        }

        return {
          ...file,
          category: updatedCategory, // Return the transformed category for display
        };
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
  }, [mdFiles, searchQuery, selectedFilter, sortBy, sortOrder, isMDFetching]);

  // Get unique file types for filter options
  const fileTypes = useMemo(() => {
    if (isMDFetching) return [];
    const types = new Set(mdFiles.map((file) => file.category));
    return Array.from(types).filter(Boolean);
  }, [mdFiles, isMDFetching]);

  const generateLink = async (fileName: string, id: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mdFileName: fileName, id: id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate link");
      }

      // Update uploadedFiles with the new url
      setMdFiles((prev) =>
        prev.map((file) =>
          file.name === id
            ? { ...file, shareableUrl: data.url } // add a new field `generatedUrl`
            : file
        )
      );

      // Also sync to Redux if needed
      dispatch(
        setFetchingMDFiles(
          mdFiles.map((file) =>
            file.name === id ? { ...file, shareableUrl: data.url } : file
          )
        )
      );

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
    <SkeletonTheme baseColor="#f3f4f6" highlightColor="#e5e7eb">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-2">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Content Manager
                </h1>
                <p className="text-gray-600 mt-5">
                  Manage your markdown files and generate shareable links
                </p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="flex">
              {[
                { key: "generate", label: "Generate Links", icon: "🔗" },
                { key: "files", label: "Manage Files", icon: "📁" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 font-medium transition-all ${
                    activeTab === tab.key
                      ? "bg-blue-50 border-b-2 border-blue-500 text-blue-700"
                      : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div> */}

          {/* Error Alert */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Generate Links Tab */}

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
                    <option value="ALL">All Types</option>
                    <option value="AE">Advisory Essentials Series</option>
                    <option value="CL">Checklist Series</option>
                    <option value="DK">Detailed Knowledge Series</option>
                    <option value="ML">Missing Lessons Series</option>
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
                Showing {filteredAndSortedFiles.length} of {mdFiles.length}{" "}
                files
              </div>
            </div>

            {/* Files Table */}
            <div className="overflow-x-auto bg-white w-[90rem] rounded-lg border">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      #
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3 ${
                        !isMDFetching ? "cursor-pointer hover:bg-gray-100" : ""
                      }`}
                      onClick={() => !isMDFetching && handleSort("name")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>File Name</span>
                        {!isMDFetching && sortBy === "name" && (
                          <span className="text-blue-500">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Doc #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                      Storage Path
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isMDFetching ? (
                    // Skeleton rows
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-3 whitespace-nowrap">
                          <Skeleton width={30} height={20} />
                        </td>
                        <td className="px-4 py-3">
                          <Skeleton width={200} height={20} />
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <Skeleton width={60} height={24} borderRadius={12} />
                        </td>
                        <td className="px-4 py-3">
                          <Skeleton width={250} height={20} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex justify-end space-x-1 items-center">
                            <Skeleton width={60} height={24} />
                            <Skeleton width={30} height={24} />
                            <Skeleton width={30} height={24} />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : filteredAndSortedFiles.length > 0 ? (
                    // Actual data
                    filteredAndSortedFiles.map((file, index) => (
                      <tr key={file.name} className="hover:bg-gray-50">
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {file.name}
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {file.documentNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          <div
                            className="truncate max-w-sm"
                            title={file.fullPath}
                          >
                            {file.fullPath}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                          <div className="flex justify-end space-x-1 items-center">
                            <button
                              onClick={() =>
                                generateLink(file.downloadURL, file.name)
                              }
                              disabled={loading}
                              className="bg-blue-500 text-white px-2 py-2
                                 cursor-pointer rounded text-xs hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {loading ? "Gen..." : "Generate"}
                            </button>
                            <a
                              href={file.downloadURL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-gray-500 text-white px-2 py-2 rounded text-xs hover:bg-gray-600"
                            >
                              <Download className="w-3 h-3" />
                            </a>
                            <button
                              onClick={() => {
                                if (file?.shareableUrl) {
                                  navigator.clipboard.writeText(
                                    file.shareableUrl
                                  );
                                }
                              }}
                              disabled={!file?.shareableUrl}
                              className={`px-2 py-2 rounded text-xs text-white ${
                                file?.shareableUrl
                                  ? "bg-gray-500 hover:bg-gray-600 cursor-pointer"
                                  : "bg-gray-300 cursor-not-allowed"
                              }`}
                            >
                              <Link className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    // Empty state
                    <tr>
                      <td colSpan={5} className="text-center py-8">
                        <p className="text-gray-500">
                          No files match your search criteria.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
        </div>
      </div>
    </SkeletonTheme>
  );
}
