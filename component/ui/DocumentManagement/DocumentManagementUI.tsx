"use client";

import React, { useEffect, useState } from "react";
import { Lock, RefreshCw } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  // getDocumentsURL,
  getMDDocumentsURL,
  // setDocumentsURL,
  setMDDocumentsURL,
} from "@/redux/storageSlice";
import { fetchDocumentURL } from "@/component/data/openDocument/OpenDocument";
import { useRouter } from "next/navigation";
import { getUserLocalStorage } from "@/functions/function";
import { UserNameListType } from "@/component/model/types/UserNameListType";
import ToasterComponent from "@/components/templates/ToastMessageComponent/ToastMessageComponent";
import { GroupedDocument } from "@/component/model/interface/GroupedDocument";
import FullPageLoadingComponent from "@/components/templates/FullPageLoadingComponent/FullPageLoadingComponent";
import InfoTipComponent from "@/components/templates/InfoTipComponent/InfoTipComponent";

import ModalComponent from "@/components/templates/ModalComponent/ModalComponent";
import {
  CheckBadgeIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/20/solid";
import { marked } from "marked";
import ModalMDComponent from "@/components/templates/ModalMDComponent/ModalMDComponent";

interface Props {
  documents: GroupedDocument[];
}

const DocumentManagementUI: React.FC<Props> = ({ documents }) => {
  const route = useRouter();
  const dispatch = useDispatch();
  // const documentUrl = useSelector(getDocumentsURL);
  const mdHTML = useSelector(getMDDocumentsURL);

  const essentialPriceID = process.env.NEXT_PUBLIC_PRICE_ID!;
  const professionalPriceID = process.env.NEXT_PUBLIC_PROFESSIONAL_PRICE_ID!;

  let isClickable: boolean = false;
  let isLocked: boolean = false;

  // toast state message (start) ==========================================>
  const [showToast, setShowToast] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [toastType, setToastType] = useState<ToastType>("success");
  // toast state message (start) ==========================================>

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [userData, setUserData] = useState<UserNameListType | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [subscriptionLevel, setSubscriptionLevel] = useState<
    "none" | "essential" | "professional"
  >("none");

  const hasLockedColumns = subscriptionLevel !== "professional";

  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);
  const [clickedTooltip, setClickedTooltip] = useState<string | null>(null);

  const [showModal, setShowModal] = useState<boolean>(false);
  const [showMDModal, setShowMDModal] = useState<boolean>(false);
  const [content, setContent] = useState<string>("");
  const [descriptions, setDescriptions] = useState<string>("");
  // const [descriptions, setDescriptions] = useState<string[] | undefined>([]);

  // const descriptionShowHandler = async (description: string[] | undefined) => {
  const descriptionShowHandler = async (description: string) => {
    try {
      setShowModal(true);
      setDescriptions(description);
    } catch (error) {
      console.log("Error", error);
    }
  };

  // Function to check subscription status
  const checkSubscriptionStatus = () => {
    const currentUserData = getUserLocalStorage();
    setUserData(currentUserData);

    if (currentUserData?.productId === essentialPriceID) {
      setSubscriptionLevel("essential");
    } else if (currentUserData?.productId === professionalPriceID) {
      setSubscriptionLevel("professional");
    } else {
      setSubscriptionLevel("none");
    }
  };

  // Initial check on component mount
  useEffect(() => {
    checkSubscriptionStatus();
  }, [essentialPriceID, professionalPriceID]);

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
      FF: 3, // FF - Financial Fluency
      AE: 4, // AE - Advisory Essentials
    };

    const index = keyIndex[columnType as keyof typeof keyIndex];
    return pdf.key[index] || pdf.key[0] || String(pdf.key);
  };

  // Helper function to check if a column is locked based on subscription level
  const isColumnLocked = (columnType: string): boolean => {
    if (subscriptionLevel === "professional") {
      return false; // Professional has access to everything
    }

    if (subscriptionLevel === "essential") {
      // Essential has access to ML, CL, DK but not FF, AE
      return columnType === "FF" || columnType === "AE";
    }

    // No subscription - lock CL, DK, FF, AE (only ML is free)
    return (
      columnType === "CL" ||
      columnType === "DK" ||
      columnType === "FF" ||
      columnType === "AE"
    );
  };

  const documentIDHandler = async (
    pdf: GroupedDocument,
    columnType: string
  ) => {
    isLocked = isColumnLocked(columnType);
    if (isLocked) {
      return;
    }

    const stringId = getKeyForColumnType(pdf, columnType);
    setIsLoading(true);
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
    // const existing = documentUrl.find((doc) => doc.id === stringId);
    const existingMd = mdHTML.find((doc) => doc.id === stringId);
    if (existingMd) {
      setContent(existingMd.desc);
      setShowMDModal(true);
      setIsLoading(false);
      return; // ⛔ Prevents calling API
    }

    try {
      const { url, error } = await fetchDocumentURL(stringId);
      if (error) {
        alert(error.error);
        setIsLoading(false);
        return;
      }

      const res = await fetch(`/api/markdowns?url=${encodeURIComponent(url)}`);

      if (res.status === 200) {
        const mdText = await res.text();
        const htmlContent: string = await marked(mdText); // returns HTML
        dispatch(
          setMDDocumentsURL([...mdHTML, { id: stringId, desc: htmlContent }])
        );

        setContent(htmlContent);
        setShowMDModal(true);
        setIsLoading(false);
      } else {
        alert(`no URL`);
        setIsLoading(false);
      }
    } catch (error) {
      console.log("Wrong ID", error);
    } finally {
      setIsLoading(false);
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

  const renderDocumentButton = (doc: GroupedDocument, columnType: string) => {
    // Check if this document has this specific category
    const hasCategory = doc.category.includes(columnType);

    isClickable = hasCategory; // Set your clickable logic here

    isLocked = isColumnLocked(columnType);

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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="size-7 lg:size-10"
          >
            <path
              d="M5.625 1.5C4.589 1.5 3.75 2.34 3.75 3.375V20.625C3.75 21.66 4.59 22.5 5.625 22.5H18.375C19.41 22.5 20.25 21.66 20.25 20.625V12.75C20.25 11.7554 19.8549 10.8016 19.1517 10.0983C18.4484 9.39509 17.4946 9 16.5 9H14.625C14.1277 9 13.6508 8.80246 13.2992 8.45083C12.9475 8.09919 12.75 7.62228 12.75 7.125V5.25C12.75 4.25544 12.3549 3.30161 11.6517 2.59835C10.9484 1.89509 9.99456 1.5 9 1.5H5.625Z"
              fill="#B7B7B7"
            />
            <path
              d="M12.9709 1.81598C13.7975 2.76894 14.2517 3.98853 14.2499 5.24998V7.12498C14.2499 7.33198 14.4179 7.49998 14.6249 7.49998H16.4999C17.7614 7.49823 18.981 7.95246 19.9339 8.77898C19.494 7.10569 18.6175 5.57928 17.3941 4.35587C16.1706 3.13245 14.6442 2.25594 12.9709 1.81598Z"
              fill="#B7B7B7"
            />
          </svg>
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
            className="size-7 lg:size-10"
          >
            <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z" />
            <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
          </svg>
        </div>
        {!isClickable && (
          <div className="cursor-not-allowed">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="size-7 lg:size-10"
            >
              <path
                d="M5.625 1.5C4.589 1.5 3.75 2.34 3.75 3.375V20.625C3.75 21.66 4.59 22.5 5.625 22.5H18.375C19.41 22.5 20.25 21.66 20.25 20.625V12.75C20.25 11.7554 19.8549 10.8016 19.1517 10.0983C18.4484 9.39509 17.4946 9 16.5 9H14.625C14.1277 9 13.6508 8.80246 13.2992 8.45083C12.9475 8.09919 12.75 7.62228 12.75 7.125V5.25C12.75 4.25544 12.3549 3.30161 11.6517 2.59835C10.9484 1.89509 9.99456 1.5 9 1.5H5.625Z"
                fill="#B7B7B7"
              />
              <path
                d="M12.9709 1.81598C13.7975 2.76894 14.2517 3.98853 14.2499 5.24998V7.12498C14.2499 7.33198 14.4179 7.49998 14.6249 7.49998H16.4999C17.7614 7.49823 18.981 7.95246 19.9339 8.77898C19.494 7.10569 18.6175 5.57928 17.3941 4.35587C16.1706 3.13245 14.6442 2.25594 12.9709 1.81598Z"
                fill="#B7B7B7"
              />
            </svg>
          </div>
        )}
      </button>
    );
  };

  // const [isFileEmpty, setIsFileEmpty] = useState<boolean>(false);

  // useEffect(() => {
  //   if (isClickable) {
  //     setIsFileEmpty(true);
  //   } else {
  //     setIsFileEmpty(false);
  //   }
  // }, [isClickable]);

  return (
    <>
      {isLoading && <FullPageLoadingComponent />}

      <ToasterComponent
        isOpen={showToast}
        title={title}
        message={message}
        onClose={setShowToast}
        type={toastType}
        duration={3000} // 3 seconds
        autoClose={true}
      />

      <ModalComponent
        modalShow={showModal}
        setModalShow={setShowModal}
        paragraph={descriptions}
        handleClick={() => {
          // Your action
          setShowModal(false);
        }}
      />

      <ModalMDComponent
        modalShow={showMDModal}
        setModalShow={setShowMDModal}
        content={content}
        buttonText="Confirm"
        handleClick={() => {
          // Your action
          setShowModal(false);
        }}
      />
      <div className="w-full flex flex-col">
        <div className="flex-1 p-2 sm:p-4 ">
          {documents.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
              {/* Header - Fixed at top with refresh button */}
              <div
                className={`sticky bg-gray-50 border-b border-gray-200 font-bold top-0 ${
                  hoveredColumn === null ? " z-20" : "z-0"
                } flex-shrink-0`}
              >
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

                {/* scrollbar */}
                {/* Scrollable Header Container */}
                <div className="flex-1 scrollbar">
                  <div className="relative">
                    {/* Column Headers */}
                    <div
                      style={{
                        minWidth: "1536px", // Minimum width for horizontal scroll
                      }}
                    >
                      <div
                        className={`grid grid-cols-[1fr_0.3fr_0.3fr_0.3fr_0.3fr_0.3fr] lg:grid-cols-[2fr_0.3fr_0.3fr_0.3fr_0.3fr_0.3fr] flex-wrap break-words`}
                        // style={{
                        //   gridTemplateColumns:
                        //     "2fr 0.3fr 0.3fr 0.3fr 0.3fr 0.3fr",
                        //   minWidth: "1536px", // Ensures minimum width for horizontal scroll
                        // }}
                      >
                        <div className="font-sans p-2 sm:p-3 lg:p-4 font-semibold text-gray-900 border-r border-gray-200 text-xs sm:text-sm lg:text-base flex items-center">
                          Title
                        </div>
                        <div className="font-sans p-2 sm:p-3 lg:p-4 font-semibold text-gray-900 text-center text-xs sm:text-sm lg:text-base border-r border-gray-200 flex justify-center items-center relative">
                          {/* Radix Tooltip */}
                          <InfoTipComponent
                            tooltip="Perfect for beginners and anyone wanting to start fresh. These guides assume you're completely new to the topic and break everything down into easy-to-understand concepts."
                            onHover={() => setHoveredColumn("ML")}
                            onLeave={() => {
                              if (clickedTooltip !== "ML")
                                setHoveredColumn(null);
                            }}
                            onClick={() => {
                              setClickedTooltip((prev) =>
                                prev === "ML" ? null : "ML"
                              );
                              setHoveredColumn("ML");
                            }}
                            isClicked={clickedTooltip === "ML"}
                            setClickedTooltip={setClickedTooltip}
                            id="ML"
                          />

                          {/* Label */}
                          <div className="flex items-center justify-center h-full">
                            <span className="hidden lg:inline">
                              Missing <br /> Lessons <br /> Series
                            </span>
                            <span className="lg:hidden">ML</span>
                          </div>
                        </div>

                        {/* Checklist Column */}
                        <div className="font-sans p-2 sm:p-3 lg:p-4 font-semibold text-gray-900 text-center text-xs sm:text-sm lg:text-base border-r border-gray-200 flex justify-center items-center relative">
                          {/* Radix Tooltip */}
                          <InfoTipComponent
                            tooltip="Want to take action now? These straightforward lists give you practical steps you can implement immediately."
                            onHover={() => setHoveredColumn("CL")}
                            onLeave={() => {
                              if (clickedTooltip !== "CL")
                                setHoveredColumn(null);
                            }}
                            onClick={() => {
                              setClickedTooltip((prev) =>
                                prev === "CL" ? null : "CL"
                              );
                              setHoveredColumn("CL");
                            }}
                            isClicked={clickedTooltip === "CL"}
                            setClickedTooltip={setClickedTooltip}
                            id="CL"
                          />

                          {/* Label */}
                          <div className="font-sans flex items-center justify-center h-full">
                            <span className="hidden lg:inline">
                              Checklist Series
                            </span>
                            <span className="lg:hidden">CL</span>
                          </div>
                        </div>

                        {/* Detailed Knowledge Column */}
                        <div className="font-sans relative p-2 sm:p-3 lg:p-4 font-semibold text-gray-900 text-center border-r border-gray-200 text-xs sm:text-sm lg:text-base">
                          <InfoTipComponent
                            tooltip="Ready for the full picture? These comprehensive resources take you beyond the basics with thorough explanations and analysis. You'll get the most out of these if you already understand fundamental financial terms and concepts."
                            onHover={() => setHoveredColumn("DK")}
                            onLeave={() => {
                              if (clickedTooltip !== "DK")
                                setHoveredColumn(null);
                            }}
                            onClick={() => {
                              setClickedTooltip((prev) =>
                                prev === "DK" ? null : "DK"
                              );
                              setHoveredColumn("DK");
                            }}
                            isClicked={clickedTooltip === "DK"}
                            setClickedTooltip={setClickedTooltip}
                            id="DK"
                          />

                          <div className="flex items-center justify-center h-full">
                            <span className="hidden lg:inline">
                              Detailed Knowledge Series
                            </span>
                            <span className="lg:hidden">DK</span>
                          </div>
                        </div>

                        {/* Financial Fluency Column */}
                        <div className="font-sans relative p-2 sm:p-3 lg:p-4 font-semibold text-gray-900 text-center border-r border-gray-200 text-xs sm:text-sm lg:text-base">
                          <InfoTipComponent
                            tooltip="Financial planning strategies, investment insights, and money management techniques.Build your financial literacy and make informed decisions about your wealth."
                            onHover={() => setHoveredColumn("FF")}
                            onLeave={() => {
                              if (clickedTooltip !== "FF")
                                setHoveredColumn(null);
                            }}
                            onClick={() => {
                              setClickedTooltip((prev) =>
                                prev === "FF" ? null : "FF"
                              );
                              setHoveredColumn("FF");
                            }}
                            isClicked={clickedTooltip === "FF"}
                            setClickedTooltip={setClickedTooltip}
                            id="FF"
                          />

                          <div className="flex items-center justify-center h-full">
                            <span className="hidden lg:inline">
                              Financial Fluency <br /> Series
                            </span>
                            <span className="lg:hidden">FF</span>
                          </div>
                        </div>

                        {/* Advisory Essentials Column */}
                        <div className="font-sans relative p-2 sm:p-3 lg:p-4 font-semibold text-gray-900 text-center border-r border-gray-200 text-xs sm:text-sm lg:text-base">
                          <InfoTipComponent
                            tooltip="Professional advisory content for consultants and experts. Advanced frameworks, client management strategies, and business development insights."
                            onHover={() => setHoveredColumn("AE")}
                            onLeave={() => {
                              if (clickedTooltip !== "AE")
                                setHoveredColumn(null);
                            }}
                            onClick={() => {
                              setClickedTooltip((prev) =>
                                prev === "AE" ? null : "AE"
                              );
                              setHoveredColumn("AE");
                            }}
                            isClicked={clickedTooltip === "AE"}
                            setClickedTooltip={setClickedTooltip}
                            id="AE"
                          />

                          <div className="flex items-center justify-center h-full">
                            <span className="hidden lg:inline">
                              Advisory Essentials Series
                            </span>
                            <span className="lg:hidden">AE</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 relative overflow-y-auto">
                        <div
                          className="max-h-screen"
                          // style={{
                          //   minWidth: "1536px", // Minimum width for horizontal scroll
                          // }}
                        >
                          {documents.map((doc, index) => (
                            <div
                              key={doc.id}
                              className={`font-sans grid  grid-cols-[1fr_0.3fr_0.3fr_0.3fr_0.3fr_0.3fr] lg:grid-cols-[2fr_0.3fr_0.3fr_0.3fr_0.3fr_0.3fr]  ${
                                index !== documents.length - 1
                                  ? "border-b border-gray-200"
                                  : ""
                              }
                              bg-white
                              `}
                            >
                              {/* Title Column - Now scrolls with the rest */}
                              <div className="p-3 sm:p-4 border-r border-gray-200 bg-white">
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900 ">
                                    {doc.title}
                                  </h3>
                                  <button
                                    onClick={() =>
                                      descriptionShowHandler(doc.description)
                                    }
                                    className="flex items-start text-black text-sm rounded-full transition-colors cursor-pointer hover:underline"
                                  >
                                    <span>more Info</span>
                                    <QuestionMarkCircleIcon className="w-4 h-4 text-red-500" />
                                  </button>
                                </div>

                                {doc.mostUsefulFor?.map((useful, index) => (
                                  <div
                                    key={index}
                                    className="text-xs text-gray-600 leading-relaxed font-normal font-sans"
                                  >
                                    <div className="flex  items-center gap-2 mb-2">
                                      <CheckBadgeIcon className="w-4 h-4 text-green-500" />{" "}
                                      <p>{useful}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Missing Lessons Column */}
                              <div
                                onClick={() =>
                                  isClickable
                                    ? documentIDHandler(doc, "ML")
                                    : null
                                }
                                className={`flex items-center justify-center  border-r border-gray-200 hover:bg-blue-600/1 cursor-pointer transition-colors`}
                              >
                                {renderDocumentButton(doc, "ML")}
                              </div>

                              {/* Checklist Column */}
                              <div
                                onClick={() =>
                                  isClickable
                                    ? documentIDHandler(doc, "CL")
                                    : null
                                }
                                className="flex items-center justify-center border-r border-gray-200 hover:bg-blue-600/10 cursor-pointer transition-colors"
                              >
                                {renderDocumentButton(doc, "CL")}
                              </div>

                              {/* Detailed Knowledge Column */}
                              <div
                                onClick={() =>
                                  isClickable
                                    ? documentIDHandler(doc, "DK")
                                    : null
                                }
                                className="flex items-center justify-center border-r border-gray-200 hover:bg-blue-600/10 cursor-pointer transition-colors"
                              >
                                {renderDocumentButton(doc, "DK")}
                              </div>

                              {/* Financial Fluency Column */}
                              <div
                                onClick={() =>
                                  isClickable
                                    ? documentIDHandler(doc, "FF")
                                    : null
                                }
                                className="flex items-center justify-center border-r border-gray-200 hover:bg-blue-600/10 cursor-pointer transition-colors"
                              >
                                {renderDocumentButton(doc, "FF")}
                              </div>

                              {/* Advisory Essentials Column */}
                              <div
                                onClick={() =>
                                  isClickable
                                    ? documentIDHandler(doc, "AE")
                                    : null
                                }
                                className="flex items-center justify-center hover:bg-blue-600/10 cursor-pointer transition-colors"
                              >
                                {renderDocumentButton(doc, "AE")}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Lock Overlay - positioned to cover last 2 columns */}
                        {hasLockedColumns && (
                          <div
                            className={`absolute top-0 right-0 bottom-0 bg-zinc-300/20 backdrop-blur-sm pointer-events-auto flex items-center justify-center h-full ${
                              subscriptionLevel === "essential"
                                ? "w-[40%] sm:w-[35%] lg:w-[24%]"
                                : "w-[48.1%] lg:w-[34.4%]"
                            }`}
                            // style={{
                            //   width: getOverlayWidth(),
                            // }}
                          >
                            <div className="flex flex-col items-center justify-center text-gray-800">
                              <Lock className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 mb-2 lg:mb-4" />
                              <button
                                onClick={subscribeHandler}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-2 rounded-md transition-colors"
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
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DocumentManagementUI;
