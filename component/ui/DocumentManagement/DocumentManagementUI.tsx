"use client";

import React, { useEffect, useState } from "react";
import { Lock, RefreshCw } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { getDocumentsURL, setDocumentsURL } from "@/redux/storageSlice";
import { fetchDocumentURL } from "@/component/data/openDocument/OpenDocument";
import { useRouter } from "next/navigation";
import { LockClosedIcon } from "@heroicons/react/20/solid";
import { getUserLocalStorage } from "@/functions/function";
import { UserNameListType } from "@/component/model/types/UserNameListType";
import ToasterComponent from "@/components/templates/ToastMessageComponent/ToastMessageComponent";
import { GroupedDocument } from "@/component/model/interface/GroupedDocument";

interface Props {
  documents: GroupedDocument[];
}

const DocumentManagementUI: React.FC<Props> = ({ documents }) => {
  const route = useRouter();
  const dispatch = useDispatch();
  const documentUrl = useSelector(getDocumentsURL);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const priceID = process.env.NEXT_PUBLIC_PRICE_ID!;

  // toast state message (start) ==========================================>
  const [showToast, setShowToast] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [toastType, setToastType] = useState<ToastType>("success");
  // toast state message (start) ==========================================>

  const [userData, setUserData] = useState<UserNameListType | null>(null);
  const [isChecklistLocked, setIsChecklistLocked] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Function to check subscription status
  const checkSubscriptionStatus = () => {
    const currentUserData = getUserLocalStorage();
    setUserData(currentUserData);

    if (currentUserData?.productId !== priceID) {
      setIsChecklistLocked(true);
    } else {
      setIsChecklistLocked(false);
    }
  };

  // Initial check on component mount
  useEffect(() => {
    checkSubscriptionStatus();
  }, [priceID]);

  // Refresh subscription status function
  const refreshSubscriptionStatus = async () => {
    setIsRefreshing(true);

    try {
      // Add a small delay to show the loading state
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Re-check the subscription status
      checkSubscriptionStatus();
    } catch (error) {
      console.error("Error refreshing subscription status:", error);
      setMessage("Failed to refresh subscription status. Please try again.");
      setTitle("Error");
      setToastType("error");
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 5000);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Helper function to get the correct key based on column type
  const getKeyForColumnType = (
    pdf: GroupedDocument,
    columnType: string
  ): string => {
    if (!Array.isArray(pdf.key)) {
      return String(pdf.key);
    }

    // Map column types to array indices based on category array ['ML', 'DK', 'CL']
    const keyIndex = {
      ML: 0, // ML - Missing Lessons
      CL: 1, // CL - Checklist
      DK: 2, // DK - Detailed Knowledge
    };

    const index = keyIndex[columnType as keyof typeof keyIndex];
    return pdf.key[index] || pdf.key[0] || String(pdf.key);
  };

  const documentIDHandler = async (
    pdf: GroupedDocument,
    columnType: string
  ) => {
    const stringId = getKeyForColumnType(pdf, columnType);

    if (stringId === "") {
      setMessage(
        "We're sorry, but something went wrong. Kindly refresh the page and try again."
      );
      setTitle("Error");
      setToastType("error");
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 5000);
      return;
    }
    // Check if this document ID already exists in Redux
    const existing = documentUrl.find((doc) => doc.id === stringId);

    if (existing) {
      window.open(existing.url, "_blank");
      return;
    }

    try {
      const { url, error } = await fetchDocumentURL(stringId);

      if (error) {
        // alert(
        //   `We're sorry, but something went wrong. Kindly refresh the page and try again., ${error}`
        // );
        alert(`${error.error}`);
      }

      if (url) {
        dispatch(setDocumentsURL([...documentUrl, { id: stringId, url }]));
        window.open(url, "_blank");
      } else {
        console.error("Failed to fetch document URL", error.error);
      }
    } catch (error) {
      console.log("Wrong ID", error);
    }
  };

  /**
   * This handler use for subscribe button it will check if user already login or not if true
   * then it will proceed to subscription link but if it's not then it will throw an error then push to login
   * */
  const subscribeHandler = async () => {
    try {
      if (userData?.email === undefined) {
        setMessage(
          "You need to log in first. Kindly sign in to your account and try again."
        );
        setTitle("Sorry!");
        setToastType("error");
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
          route.push("/login");
        }, 5000);
      } else {
        const fullUrl = `${window.location.origin}/payment/price`;
        window.open(fullUrl, "_blank");
      }
    } catch (error) {
      console.log("Error", error);
    }
  };

  const handleHeaderClick = (headerType: string) => {
    if (selectedFilter === headerType) {
      setSelectedFilter(null); // Deselect if already selected
    } else {
      setSelectedFilter(headerType);
    }
  };

  const renderDocumentButton = (doc: GroupedDocument, columnType: string) => {
    // Check if this document has this specific category
    const hasCategory = doc.category.includes(columnType);

    const isClickable = hasCategory; // Set your clickable logic here

    const isLocked =
      isChecklistLocked && (columnType === "CL" || columnType === "DK");

    if (isLocked) {
      return (
        <div className="flex items-center justify-center h-12 sm:h-16">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-300 rounded-sm relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
            </div>
          </div>
        </div>
      );
    }

    // If document doesn't have this category, show empty cell
    if (!hasCategory) {
      return (
        <button
          onClick={() =>
            isClickable ? documentIDHandler(doc, columnType) : null
          }
          className={`flex items-center flex-col justify-center h-12 sm:h-16 px-1 ${
            !isClickable ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          }`}
          disabled={!isClickable}
        >
          <span className="text-xs sm:text-sm text-blue-900 text-center leading-tight">
            No link please contact the management
          </span>
        </button>
      );
    }

    return (
      <button
        onClick={() =>
          isClickable ? documentIDHandler(doc, columnType) : null
        }
        className={`flex items-center flex-col justify-center h-12 sm:h-16 px-1 ${
          !isClickable ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        }`}
        disabled={!isClickable}
      >
        <div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-6"
          >
            <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z" />
            <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
          </svg>
        </div>
        {!isClickable && (
          <span className="text-xs sm:text-sm text-blue-900 text-center leading-tight">
            No link please contact the management
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      <ToasterComponent
        isOpen={showToast}
        title={title}
        message={message}
        onClose={setShowToast}
        type={toastType}
        duration={3000} // 3 seconds
        autoClose={true}
      />
      <div className="w-full flex flex-col ">
        <div className="flex-1 p-2 sm:p-4 lg:p-6 overflow-hidden">
          {documents.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              {/* Header - Fixed at top with 4-column grid and refresh button */}
              <div className="bg-gray-50 border-b border-gray-200 font-bold sticky top-0 z-20 flex-shrink-0">
                {/* Refresh Button Row */}
                <div className="flex justify-end p-2 border-b border-gray-100">
                  <button
                    onClick={refreshSubscriptionStatus}
                    disabled={isRefreshing}
                    className={`flex items-center cursor-pointer gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      isRefreshing
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                    }`}
                    title="Refresh subscription status"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${
                        isRefreshing ? "animate-spin" : ""
                      }`}
                    />
                    <span className="hidden sm:inline">
                      {isRefreshing ? "Refreshing..." : "Refresh Status"}
                    </span>
                    <span className="sm:hidden">
                      {isRefreshing ? "..." : "Refresh"}
                    </span>
                  </button>
                </div>

                {/* Column Headers */}
                <div
                  className="grid"
                  style={{ gridTemplateColumns: "2fr 0.3fr 0.3fr 0.3fr" }}
                >
                  <div className="p-2 sm:p-3  flex lg:p-4 font-semibold text-gray-900 border-r border-gray-200 text-xs sm:text-sm lg:text-base items-center">
                    Title
                  </div>
                  <div
                    className={`p-2 sm:p-3 lg:p-4 font-semibold text-gray-900 text-center items-center border-r border-gray-200 cursor-pointer justify-center hover:bg-gray-100 text-xs flex sm:text-sm lg:text-base ${
                      selectedFilter === "missingLessons"
                        ? "bg-blue-100 text-blue-700"
                        : ""
                    }`}
                    onClick={() => handleHeaderClick("missingLessons")}
                  >
                    <span className="hidden sm:inline">Missing Lessons</span>
                    <span className="sm:hidden">ML</span>
                  </div>

                  <div className="p-2 sm:p-3 lg:p-4 font-semibold text-gray-900 text-center text-xs sm:text-sm lg:text-base  border-r border-gray-200 flex justify-center items-center">
                    <span className="hidden sm:inline">Checklist</span>
                    <span className="sm:hidden">CL</span>
                  </div>

                  <div className="p-2 sm:p-3 lg:p-4 font-semibold text-gray-900 text-center border-r border-gray-200 text-xs sm:text-sm lg:text-base">
                    <span className="hidden sm:inline">Detailed Knowledge</span>
                    <span className="sm:hidden">DK</span>
                  </div>
                </div>
              </div>

              {/* Scrollable Content Area with 4-column grid */}
              <div className="flex-1 overflow-auto relative">
                {documents.map((doc, index) => (
                  <div
                    key={doc.id}
                    className={`grid ${
                      index !== documents.length - 1
                        ? "border-b border-gray-200"
                        : ""
                    }`}
                    style={{ gridTemplateColumns: "2fr 0.3fr 0.3fr 0.3fr" }}
                  >
                    <div className="p-3 sm:p-4 lg:p-6 border-r border-gray-200">
                      <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900 mb-1 sm:mb-2 lg:mb-3">
                        {doc.title}
                      </h3>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {doc.description}
                      </p>
                    </div>

                    {/* Missing Lessons Column */}
                    <div className="flex items-center justify-center border-r border-gray-200">
                      {renderDocumentButton(doc, "ML")}
                    </div>

                    {/* Checklist Column */}
                    <div className="flex items-center justify-center border-r border-gray-200">
                      {renderDocumentButton(doc, "CL")}
                    </div>

                    {/* Detailed Knowledge Column */}
                    <div className="flex items-center justify-center">
                      {renderDocumentButton(doc, "DK")}
                    </div>
                  </div>
                ))}

                {/* Lock Overlay - positioned to cover last 2 columns */}
                {isChecklistLocked && (
                  <div className="absolute top-0 w-[20.7%] right-0 bg-zinc-300/20 backdrop-blur-[10.15px] pointer-events-auto flex items-center justify-center  h-full">
                    <div className="flex flex-col items-center justify-center text-gray-800">
                      <LockClosedIcon className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 mb-2 lg:mb-4" />
                      <button
                        onClick={subscribeHandler}
                        className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-2 rounded-md transition-colors"
                      >
                        <span className="hidden sm:inline">
                          Subscribe to Unlock
                        </span>
                        <span className="sm:hidden">Subscribe</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DocumentManagementUI;
