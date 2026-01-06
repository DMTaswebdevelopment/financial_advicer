"use client";

import FetchingDMFiles from "@/component/model/interface/FetchingDMFiles";
import {
  getFetchingMDFiles,
  getMDFilesPage,
  setFetchingMDFiles,
  setMDFilesPage,
} from "@/redux/storageSlice";
import { ChevronLeft, ChevronRight, Link } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { RootState } from "@/redux/store";
import { GeneratedLink } from "@/component/model/interface/GeneratedLink";
import { PaginationInfo } from "@/component/model/interface/PaginationInfo";
import { getBaseUrl } from "@/lib/baseUrl";

export default function AdminPage() {
  const dispatch = useDispatch();
  const baseUrl = getBaseUrl();
  console.log("baseUrl", baseUrl);
  const fetchingMDFiles = useSelector(getFetchingMDFiles);
  const [generatedLink, setGeneratedLink] = useState<GeneratedLink | null>(
    null
  );

  const [mdFiles, setMdFiles] = useState<FetchingDMFiles[]>(fetchingMDFiles);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"name" | "date">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [isMDFetching, setIsMDFetching] = useState<boolean>(true);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    pageSize: 10,
    totalFiles: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // Get cached data for current page
  const cachedPageData = useSelector((state: RootState) =>
    getMDFilesPage(state, currentPage)
  );

  // Simplified useEffect - just check if cache exists
  useEffect(() => {
    const fetchMDFiles = async () => {
      // Use cache if available
      if (cachedPageData) {
        setMdFiles(cachedPageData.files);
        setPagination(cachedPageData.pagination);
        setIsMDFetching(false);
        return;
      }

      // Fetch from API if cache miss
      setIsMDFetching(true);

      try {
        const res = await fetch("/api/fetching_mdFile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page: currentPage }),
        });

        const response = await res.json();

        console.log("response", response);
        if (response.statusCode === 200) {
          setMdFiles(response.files);
          setPagination(response.pagination);
          setIsMDFetching(false);
          // Cache in Redux
          dispatch(
            setMDFilesPage({
              page: currentPage,
              files: response.files,
              pagination: response.pagination,
            })
          );
        }
      } catch (error) {
        console.error("❌ Error fetching MD files:", error);
      } finally {
        setIsMDFetching(false);
      }
    };

    fetchMDFiles();
  }, [currentPage, cachedPageData, dispatch]);

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

    const filtered = mdFiles
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

      console.log("data", data);
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
      setShowPopup(true);
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

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (pagination?.totalPages || 1)) {
      setCurrentPage(newPage);
    }
  };

  const handlePreviousPage = () => {
    if (pagination?.hasPreviousPage) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination?.hasNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  console.log("generatedLink", generatedLink);
  return (
    <SkeletonTheme baseColor="#f3f4f6" highlightColor="#e5e7eb">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 w-full">
        {/* Success Popup */}
        {showPopup && generatedLink && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 bg-opacity-50 animate-fade-in">
            <div className="bg-white rounded-lg shadow-2xl border border-green-200 p-6 w-full max-w-4xl mx-4 animate-scale-in">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">
                    Link Generated Successfully!
                  </h3>

                  <div className="bg-gray-50 p-3 rounded border border-gray-200 mb-3">
                    <input
                      type="text"
                      value={generatedLink.url}
                      readOnly
                      className="w-full bg-transparent text-sm text-gray-700 outline-none"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <a
                      href={generatedLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-600 transition-colors"
                    >
                      <span>Visit</span>
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedLink.url);
                      }}
                      className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600 transition-colors"
                    >
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowPopup(false)}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
        {/* 
<div className="w-full max-w-5xl 2xl:max-w-7xl mx-auto p-6 lg:p-8"></div> */}
        <div className="flex flex-col justify-center mx-auto p-6 w-full lg:p-8 2xl:pl-80 2xl:w-full sm:px-6 lg:px-16">
          {/* Header */}
          <div className="mb-8 ">
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
                      ? "bg-blue-50 border-mb-2 border-blue-500 text-blue-700"
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

            {/* Desktop Table View - Hidden on Mobile */}
            <div className="hidden xl:block overflow-x-auto bg-white rounded-lg border">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      #
                    </th>

                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Doc #
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
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isMDFetching ? (
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
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : filteredAndSortedFiles.length > 0 ? (
                    filteredAndSortedFiles.map((file, index) => (
                      <tr key={file.name} className="hover:bg-gray-50">
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                          {index + 1}
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {file.documentNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900 truncate w-full">
                            {file.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                          <div className="flex justify-end space-x-1 items-center">
                            <button
                              onClick={() =>
                                generateLink(file.downloadURL, file.name)
                              }
                              disabled={loading}
                              className="bg-blue-500 text-white px-2 py-2 cursor-pointer rounded text-xs hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {loading ? "Gen..." : "Generate"}
                            </button>
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

            {/* Mobile Card View - Shown on Mobile/Tablet */}
            <div className="xl:hidden space-y-3">
              {isMDFetching ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg border border-gray-200 p-4"
                  >
                    <Skeleton width="60%" height={20} className="mb-2" />
                    <Skeleton width="40%" height={16} className="mb-3" />
                    <Skeleton width="100%" height={16} className="mb-3" />
                    <div className="flex space-x-2">
                      <Skeleton width={80} height={36} />
                      <Skeleton width={80} height={36} />
                    </div>
                  </div>
                ))
              ) : filteredAndSortedFiles.length > 0 ? (
                filteredAndSortedFiles.map((file, index) => (
                  <div
                    key={file.name}
                    className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 mr-2">
                        <div className="text-sm font-medium text-gray-900 truncate mb-1">
                          {file.name}
                        </div>
                        <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          Doc #{file.documentNumber}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        #{index + 1}
                      </span>
                    </div>

                    <div
                      className="text-xs text-gray-500 mb-3 truncate"
                      title={file.fullPath}
                    >
                      📁 {file.fullPath}
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          generateLink(file.downloadURL, file.name)
                        }
                        disabled={loading}
                        className="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? "Generating..." : "Generate Link"}
                      </button>
                      <button
                        onClick={() => {
                          if (file?.shareableUrl) {
                            navigator.clipboard.writeText(file.shareableUrl);
                          }
                        }}
                        disabled={!file?.shareableUrl}
                        className={`px-3 py-2 rounded text-sm text-white transition-colors ${
                          file?.shareableUrl
                            ? "bg-gray-500 hover:bg-gray-600"
                            : "bg-gray-300 cursor-not-allowed"
                        }`}
                      >
                        <Link className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <p className="text-gray-500">
                    No files match your search criteria.
                  </p>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                {/* Page Info */}
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {pagination.totalPages}
                </div>

                {/* Pagination Buttons */}
                <div className="flex items-center space-x-2">
                  {/* Previous Button */}
                  <button
                    onClick={handlePreviousPage}
                    disabled={!pagination.hasPreviousPage || isMDFetching}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pagination?.hasPreviousPage && !isMDFetching
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {Array.from(
                      { length: pagination.totalPages },
                      (_, i) => i + 1
                    )
                      .filter((pageNum) => {
                        // Show first page, last page, current page, and pages around current
                        return (
                          pageNum === 1 ||
                          pageNum === pagination.totalPages ||
                          Math.abs(pageNum - currentPage) <= 1
                        );
                      })
                      .map((pageNum, index, array) => {
                        // Add ellipsis if there's a gap
                        const showEllipsis =
                          index > 0 && pageNum - array[index - 1] > 1;

                        return (
                          <React.Fragment key={pageNum}>
                            {showEllipsis && (
                              <span className="px-2 text-gray-400">...</span>
                            )}
                            <button
                              onClick={() => handlePageChange(pageNum)}
                              disabled={isMDFetching}
                              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                currentPage === pageNum
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              } ${
                                isMDFetching
                                  ? "cursor-not-allowed opacity-50"
                                  : ""
                              }`}
                            >
                              {pageNum}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={handleNextPage}
                    disabled={!pagination.hasNextPage || isMDFetching}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pagination.hasNextPage && !isMDFetching
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Generated Link Display */}
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
}
