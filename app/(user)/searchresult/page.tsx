"use client";

import { Document } from "@/component/model/interface/Document";
import {
  ChatRequestBody,
  Message,
} from "@/component/model/types/ChatRequestBody";
import { StreamMessageType } from "@/component/model/types/StreamMessage";
import { createSSEParser } from "@/lib/createSSEParser";
import { getTrimMessages } from "@/redux/storageSlice";

import { MessageCircle, Send, X } from "lucide-react";
import React, {
  FormEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid"; // Import UUID for generating unique IDs
import ChatMessageBubbleComponent from "@/components/templates/ChatMessageBubbleComponent/ChatMessageBubbleComponent";
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import DocumentManagementUI from "@/component/ui/DocumentManagement/DocumentManagementUI";
import Link from "next/link";

interface AssistantMessage extends Message {
  _id: string;
  chatId: string;
  createdAt: number;
  isStreaming: boolean;
}

const SearchResultPage = () => {
  // const pathname = usePathname();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const trimMessage = useSelector(getTrimMessages);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Create rotating status messages
  const searchingStatuses = ["Processing relevant documents..."];

  const [messages, setMessages] = useState<Message[]>([]);
  const hasSearched = useRef(false); // 👈 track if handleSearch was already run
  const [input, setInput] = useState<string>(trimMessage || "");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [streamingResponse, setStreamingResponse] = useState<string>("");
  const [currentTool, setCurrentTool] = useState<{
    name: string;
    input: unknown;
  } | null>(null);

  // Keep track of active tool executions
  const toolExecutionStack = useRef<string[]>([]);

  // To track whether a terminal output is currently displayed
  const isTerminalOutputDisplayed = useRef(false);
  interface GroupedDocument {
    title: string;
    key: string[];
    description: string;
    id: string | number;
    category: string[];
  }

  const [allRelevantPDFList, setAllRelevantPDFList] = useState<
    GroupedDocument[]
  >([]);
  const [relevantMLPDFList, setRelevantMLPDFList] = useState<Document[]>([]);
  const [relevantCLPDFList, setRelevantCLPDFList] = useState<Document[]>([]);
  const [relevantDKPDFList, setRelevantDKPDFList] = useState<Document[]>([]);

  console.log("allRelevantPDFList", allRelevantPDFList);
  const [statusIndex, setStatusIndex] = useState(0);

  let accumulatedText = "";
  let accumulatedTextWithDocs = ""; // includes doc lines (with URLs)

  useLayoutEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingResponse]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setStatusIndex((prevIndex) => (prevIndex + 1) % searchingStatuses.length);
    }, 5000); // every 5 seconds

    return () => clearInterval(intervalId); // cleanup on unmount
  }, [searchingStatuses.length]);

  const formatTerminalOutput = (message?: string) => {
    // Always use the provided message or the first status message
    const statusMessage = message || searchingStatuses[statusIndex];

    const terminalHtml = `
    <div class="flex justify-start animate-in fade-in-0 items-center">
        <div class="flex items-center gap-1.5">
            ${[0.3, 0.15, 0]
              .map(
                (delay, i) =>
                  `<div
                key="${i}"
                class="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce"
                style="animation-delay: ${delay}s"
              ></div>`
              )
              .join("")}
        </div>
         <div class="text-start text-sm text-gray-600">
           ${statusMessage}
         </div>                    
      </div>
     `;

    return `----START----\n${terminalHtml}\n----END----`;
  };

  const extractMLDocumentsFromText = (
    text: string
  ): {
    newDocs: Document[];
    hasNew: boolean;
  } => {
    accumulatedText += text;

    console.log("accumulatedText", accumulatedText);
    // Updated regex pattern to capture numbered list items with ID, title, and description
    const pattern =
      /^\d+\.\s+(\d+(?:ML|CL|DK))\s*[-–]\s*(.+?)\s*\n\s+Key:\s*([A-Za-z0-9+/=]+)\s*\n\s*(.+?)(?=\n\d+\.|\n[A-Z]|\n\s*$|$)/gim;

    // const pattern =
    //   /(\d+\s*(ML|CL|DK))\s*[-–]?\s*(.+?)\s+([A-Za-z0-9+/=]{16,})/gi;

    // const pattern =
    //   /(\d+\s*(ML|CL|DK))\s*[-–]?\s*(.+?)\s+([A-Za-z0-9+/=]{16,})\)\s*\n?\s*([^\n]*(?:\n(?!\d+\.)[^\n]*)*)/gi;
    // /(\d+)(ML|CL|DK)\s*[-–]?\s+(.+?)\s+\[([A-Za-z0-9+/=]{16,})\]/gi;

    /**
     * /\d+\.\s+((?:ML|CL|DK)\s*\d+)\s*-\s*(.+?)\s*\nURL:\s*(https:\/\/firebasestorage\.googleapis\.com\/[^\s]+)/gi;
     * /\d+\.\s+(ML\s*\d+)\s*-\s*(.+?)\s*\nURL:\s*(https:\/\/firebasestorage\.googleapis\.com\/[^\s]+)/gi;
     * use this if we will use quality than faster in langgraph
     *  /\d+\.\s+(.+?)\s+(https:\/\/firebasestorage\.googleapis\.com\/[^\s]+)/gi;
     */

    const newDocs: Document[] = [];
    let hasNew = false;

    let match;
    while ((match = pattern.exec(accumulatedText)) !== null) {
      const fullLabel = match[0]?.trim(); // e.g. "595ML-Estate Management..."
      // const id = match[1].replace(/\s+/g, ""); // e.g., "ML596"
      const rawId = match[1].replace(/\s+/g, ""); // e.g. "515DK"
      const title = match[2]?.trim(); // e.g. "Australian Genuine Redundancy - A Tax Guide"
      const key = match[3]?.trim(); // e.g. "NjQzTUwgLUF1c3RyYWxpYW4gR2VudWluZSBSZWR1bmRhb"
      const description = match[4]?.trim(); // e.g. "The document provides an overview..."

      const id = `${rawId}-${title}`;
      const matchIndex = match.index; // position in the stream

      console.log("match", match);
      // Extract category from the ID
      let category = "ML"; // Default category
      if (rawId) {
        if (rawId.includes("CL")) {
          category = "CL";
        } else if (rawId.includes("DK")) {
          category = "DK";
        } else if (rawId.includes("ML")) {
          category = "ML";
        }
      }

      if (id) {
        hasNew = true;

        newDocs.push({
          id,
          title,
          category,
          pdfID: uuidv4(),
          key: key,
          matchIndex, // include the position for tracking
          description: description || "", // Add description if captured
          fullLabel,
        });
      }
    }

    return { newDocs, hasNew };
  };

  const processStream = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    onChunk: (chunk: string) => Promise<void>
  ) => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // await onChunk(new TextDecoder().decode(value));
        const chunkString = new TextDecoder().decode(value);

        await onChunk(chunkString);
        // console.log("onChunk", onChunk);
      }
    } finally {
      reader.releaseLock();
    }
  };

  const clearSearchHandler = async () => {
    try {
      setMessages([]);
      setIsOpen(false);
      setAllRelevantPDFList([]);
      setRelevantMLPDFList([]);
      setRelevantCLPDFList([]);
      setRelevantDKPDFList([]);
    } catch (error) {
      console.log("Error", error);
    }
  };

  const searchHandler = async (e?: FormEvent) => {
    e?.preventDefault();
    setIsOpen(true);
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const chatId = uuidv4();
    // Reset UI state for new message
    setInput("");
    setStreamingResponse("");
    setCurrentTool(null);
    setIsLoading(true);

    const userMessage: AssistantMessage = {
      _id: `user_${Date.now()}`,
      chatId,
      content: trimmedInput,
      role: "user",
      isStreaming: true,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);

    let fullResponse = "";
    try {
      const requestBody: ChatRequestBody = {
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        chatId,
        newMessage: trimmedInput,
      };

      // Initialize SSE connection
      const response = await fetch("api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error(await response.text());
      if (!response.body) throw new Error("No response body available");

      // --------(start) Handle stream ------------
      const parser = createSSEParser();
      const reader = response.body.getReader();

      // Process the stream chunks
      await processStream(reader, async (chunk) => {
        const messages = parser.parse(chunk);

        // Handle each message based on its type
        for (const message of messages) {
          switch (message.type) {
            case StreamMessageType.Token:
              // Handle streaming tokens (normal text response)
              if ("token" in message) {
                const tokenContent = message.token;
                accumulatedTextWithDocs += tokenContent;

                // Process the extracted documents
                const { newDocs, hasNew } =
                  extractMLDocumentsFromText(tokenContent);

                // const docPattern = /\b(\d+(?:ML|CL|DK))\s+(.+?)(?=\n|$)/gi;
                // /\d+\.\s+(.+?)\s+(https:\/\/firebasestorage\.googleapis\.com\/[^\s]+)/gi;

                // const cleanedToken = accumulatedTextWithDocs.replace(
                //   docPattern,
                //   (match, title) => {
                //     console.log("match", match);
                //     // const docNumberMatch = match.match(/^\d+/); // Get the number
                //     // const docNumber = docNumberMatch ? docNumberMatch[0] : "";
                //     return `${match}`;
                //   }
                // );

                if (hasNew && newDocs.length > 0) {
                  // Sort documents by category and update appropriate state
                  const mlDocs = newDocs.filter((doc) => doc.category === "ML");
                  const clDocs = newDocs.filter((doc) => doc.category === "CL");
                  const dkDocs = newDocs.filter((doc) => doc.category === "DK");

                  const mergeAndSortDocuments = (
                    prevList: Document[],
                    newDocs: Document[]
                  ): Document[] => {
                    const map = new Map<number, Document>();

                    // Add existing documents first
                    for (const doc of prevList) {
                      map.set(doc.matchIndex ?? 0, doc);
                    }

                    // Overwrite or insert new documents
                    for (const doc of newDocs) {
                      if (doc.matchIndex !== undefined) {
                        map.set(doc.matchIndex, doc);
                      }
                    }

                    // Convert to array and sort by matchIndex
                    return Array.from(map.values()).sort(
                      (a, b) => (a.matchIndex ?? 0) - (b.matchIndex ?? 0)
                    );
                  };

                  // Update ML documents
                  if (mlDocs.length > 0) {
                    setRelevantMLPDFList((prevList) =>
                      mergeAndSortDocuments(prevList, mlDocs)
                    );
                  }

                  if (clDocs.length > 0) {
                    setRelevantCLPDFList((prevList) =>
                      mergeAndSortDocuments(prevList, clDocs)
                    );
                  }

                  if (dkDocs.length > 0) {
                    setRelevantDKPDFList((prevList) =>
                      mergeAndSortDocuments(prevList, dkDocs)
                    );
                  }

                  // For setAllRelevantGroupedList, group by title
                  // For setAllRelevantGroupedList, group by title
                  setAllRelevantPDFList((prev) => {
                    // Create a map to group documents by title
                    const groupedMap = new Map<string, GroupedDocument>();

                    // Add existing grouped documents to map
                    prev.forEach((doc) => {
                      groupedMap.set(doc.title.toLowerCase(), doc);
                    });

                    // Process new documents
                    newDocs.forEach((doc) => {
                      const titleKey = doc.title.toLowerCase();

                      if (groupedMap.has(titleKey)) {
                        // Document with this title already exists, merge data
                        const existing = groupedMap.get(titleKey);
                        if (existing) {
                          // Add key if not already present
                          if (doc.key && !existing.key.includes(doc.key)) {
                            existing.key.push(doc.key);
                          }

                          // Add category if not already present
                          const docCategory = doc.category || "ML";
                          if (!existing.category.includes(docCategory)) {
                            existing.category.push(docCategory);
                          }

                          existing.description =
                            doc.description || existing.description;
                        }
                      } else {
                        // New document, create grouped entry
                        const docCategory = doc.category || "ML";
                        groupedMap.set(titleKey, {
                          title: doc.title || "",
                          key: [doc.key || ""],
                          description: doc.description || "",
                          id: doc.id || "",
                          category: [docCategory],
                        });
                      }
                    });

                    // Convert map back to array
                    return Array.from(groupedMap.values());
                  });
                }

                // 4. Accumulate cleaned version
                fullResponse = accumulatedTextWithDocs;
                setStreamingResponse(fullResponse);
              }
              break;

            case StreamMessageType.ToolStart:
              // Handle start of tool execution
              if ("tool" in message) {
                setCurrentTool({
                  name: message.tool,
                  input: message.input,
                });

                // Add tool to execution stack
                toolExecutionStack.current.push(message.tool);

                // Only add terminal output if not already displayed
                if (!isTerminalOutputDisplayed.current) {
                  const statusMessage = searchingStatuses[0]; // Use first message for consistency
                  const toolStartOutput = formatTerminalOutput(statusMessage);

                  fullResponse += toolStartOutput;
                  setStreamingResponse(fullResponse);
                  isTerminalOutputDisplayed.current = true;
                }
              }
              break;

            case StreamMessageType.ToolEnd:
              // Handle completion of tool execution
              if ("tool" in message && currentTool) {
                // Remove the tool from the stack
                const toolIndex = toolExecutionStack.current.indexOf(
                  message.tool
                );
                if (toolIndex !== -1) {
                  toolExecutionStack.current.splice(toolIndex, 1);
                }

                // Only remove terminal output if no more tools are executing
                if (
                  toolExecutionStack.current.length === 0 &&
                  isTerminalOutputDisplayed.current
                ) {
                  // Find and remove the previously added terminal output
                  const startMarker = "----START----";
                  const endMarker = "----END----";

                  const startIndex = fullResponse.lastIndexOf(startMarker);
                  const endIndex =
                    fullResponse.lastIndexOf(endMarker) + endMarker.length;

                  if (startIndex !== -1 && endIndex !== -1) {
                    // Remove the formatTerminalOutput content entirely from fullResponse
                    fullResponse =
                      fullResponse.substring(0, startIndex) +
                      fullResponse.substring(endIndex);

                    setStreamingResponse(fullResponse);
                    isTerminalOutputDisplayed.current = false;
                  }
                }

                // Only clear current tool if it matches the one that just ended
                if (currentTool.name === message.tool) {
                  setCurrentTool(null);
                }
                return;
              }
              break;

            case StreamMessageType.Error:
              if ("error" in message) {
                setStreamingResponse("");
                const errorMessage: AssistantMessage = {
                  _id: `error_${Date.now()}`,
                  chatId,
                  content:
                    "Message Overloaded try to refresh the page then wait for a few minutes then try again! Thanks",
                  role: "assistant",
                  isStreaming: false,
                  createdAt: Date.now(),
                };

                setMessages((prev) => [...prev, errorMessage]);

                throw new Error(message.error);
              }
              break;

            case StreamMessageType.Done:
              // Process the fullResponse to remove ML and CL prefixes from document titles
              let processedResponse = fullResponse;

              // Regular expression to match document listings with prefixes
              const docTitleRegex =
                /^\d+\.\s+(\d+(?:ML|CL|DK))\s*[-–]\s*(.+?)\s*\n\s+Key:\s*([A-Za-z0-9+/=]+)\s*\n\s*(.+?)(?=\n\d+\.|\n[A-Z]|\n\s*$|$)/gim;

              // /\b(\d+(?:ML|CL|DK))\s+(.+?)(?=\n|$)/gi;
              // /(\d+)\.\s+(?:ML|CL|DK)\s+(.*?)\s+(https:\/\/firebasestorage\.googleapis\.com\/[^\s]+)/gi;

              // Replace with just the title (without ML/CL prefix)
              processedResponse = processedResponse.replace(
                docTitleRegex,
                function (match, number, key, title, description) {
                  console.log("key", key);
                  console.log("title", title);
                  console.log("number", number);
                  console.log("number", description);
                  console.log("match here", match);
                  return `${key} ${description}`;
                }
              );

              // Add the final assistant message to the messages array
              const assistantMessage: AssistantMessage = {
                _id: `assistant_${Date.now()}`,
                chatId,
                content: processedResponse, // Use the processed response without ML/CL prefixes
                role: "assistant",
                isStreaming: false,
                createdAt: Date.now(),
              };
              // Replace the streaming message with the complete message
              setMessages((prev) => {
                // Remove the last message if it's the streaming placeholder
                const messagesWithoutStreaming = [...prev];

                // Add the complete assistant message
                messagesWithoutStreaming.push(assistantMessage);

                return messagesWithoutStreaming;
              });

              setStreamingResponse("");
              return;
          }
        }
      });
      // --------(end) Handle stream ------------
    } catch (error) {
      // Handle any error during streaming
      console.error("Error sending message:", error);

      // Add an error message
      const errorMessage: AssistantMessage = {
        _id: `error_${Date.now()}`,
        chatId,
        content:
          "An error occurred while processing your request. Please try again.",
        role: "assistant",
        isStreaming: false,
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    // Check if we came from hero section (not a page refresh)
    const cameFromHero = localStorage.getItem("cameFromHero");

    // Call searchHandler if we have a trimMessage, haven't searched yet, and came from hero
    if (!hasSearched.current && trimMessage && cameFromHero === "true") {
      // setInput(trimMessage); // Set the input to show the search term

      setTimeout(() => {
        hasSearched.current = true; // ✅ prevent future runs
        searchHandler();
        // Clear the flag after using it
        localStorage.removeItem("cameFromHero");
      }, 1000);
    }
  }, []);

  return (
    <div className="mx-auto w-full flex-col flex items-center py-14 px-5">
      {/* <div className="w-full flex flex-col items-center py-16"> */}
      {messages.length === 0 && !isOpen ? (
        <div className=" flex max-w-5xl flex-col items-center">
          <div className="text-center">
            <h1 className="text-3xl lg:text-5xl font-normal tracking-tight font-playfair text-balance text-gray-900 ">
              Ask new question
            </h1>
            <p className="text-3xl lg:text-[40px] leading-normal tracking-[-1.6px] text-[#1C1B1A] mx-auto font-playfair mt-8">
              Get accurate answers to your complex financial questions with our
              AI-powered advisory tool.
            </p>
          </div>

          <div className="relative mt-10 w-full">
            <div className="flex items-center rounded-full border border-gray-300 bg-white shadow-sm hover:shadow transition-shadow px-2">
              <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 ml-3" />

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") searchHandler(e);
                }}
                placeholder="E.g., 'How may I help you?'"
                className="w-full px-4 py-6 rounded-full bg-transparent text-gray-700 focus:outline-none"
              />
              <div className="flex gap-2 mr-3">
                <button
                  disabled={input === ""}
                  onClick={searchHandler}
                  className={`bg-black text-white ${
                    input === ""
                      ? "cursor-not-allowed"
                      : "cursor-pointer hover:bg-blue-700"
                  } p-4 rounded-full transition-colors`}
                >
                  <PaperAirplaneIcon className="w-5 h-5 -rotate-20" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-24 flex flex-col items-center">
            <h2 className="font-playfair leading-normal text-3xl lg:text-[40px]">
              Not sure what to ask?
            </h2>
            <p className="mt-11 font-sans text-2xl text-center">
              Use the example questions as inspiration! <br />
              Wherever you are in life, we&apos;re here to help.
            </p>

            {/* Speech Bubbles */}
            <div className=" mt-20 flex flex-col md:flex-row flex-wrap gap-5 md:gap-6 items-start justify-center font-playfair">
              <div style={{ position: "relative", display: "inline-block" }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="347"
                  height="240"
                  viewBox="0 0 347 240"
                  fill="none"
                >
                  <path
                    d="M311.344 0H35.336C15.8208 0 0 15.841 0 35.3811V156.685C0 176.225 15.8208 192.066 35.336 192.066H253.2L285.086 239.642V192.066H311.344C330.859 192.066 346.68 176.225 346.68 156.685V35.3811C346.68 15.841 330.859 0 311.344 0Z"
                    fill="#1C1B1A"
                  />
                </svg>
                <div className="absolute items-center top-10 text-lg md:text-2xl font-playfair text-[#FFF3E5] left-5 right-5 justify-center">
                  {`"I'm planning to rent out my investment property. What do I need to know?"`}
                </div>
              </div>

              <div
                style={{ position: "relative", display: "inline-block" }}
                className="mt-12"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="248"
                  height="276"
                  viewBox="0 0 248 276"
                  fill="none"
                >
                  <path
                    d="M212.412 0.986356H35.5549C16.0397 0.986356 0.218872 16.8274 0.218872 36.3675V193.048C0.218872 212.588 16.0397 228.429 35.5549 228.429H154.273L186.159 276.005V228.429H212.417C231.932 228.429 247.753 212.588 247.753 193.048V36.3627C247.753 16.8226 231.932 0.981567 212.417 0.981567L212.412 0.986356Z"
                    fill="#1C1B1A"
                  />
                </svg>
                <div className="absolute items-center top-16 text-lg md:text-2xl font-playfair text-[#FFF3E5] left-5 right-5 justify-center">
                  {`"How do I get started with doing my own tax return?"`}
                </div>
              </div>

              <div style={{ position: "relative", display: "inline-block" }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="315"
                  height="229"
                  viewBox="0 0 315 229"
                  fill="none"
                >
                  <path
                    d="M35.6281 0.572754H279.664C299.179 0.572754 315 16.4138 315 35.9539V145.265C315 164.805 299.179 180.646 279.664 180.646H93.767L61.8813 228.221V180.646H35.6234C16.1081 180.646 0.287354 164.805 0.287354 145.265V35.9539C0.287354 16.4138 16.1081 0.572754 35.6234 0.572754H35.6281Z"
                    fill="#1C1B1A"
                  />
                </svg>
                <div className="absolute items-center top-10 text-lg md:text-2xl font-playfair text-[#FFF3E5] left-5 right-5 justify-center">
                  {`"My friend and I are starting a new business venture. Any
                  words of advice?"`}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center lg:px-20">
          {allRelevantPDFList.length > 0 && (
            <h1 className="text-6xl font-playfair mb-4">Documents List</h1>
          )}

          <DocumentManagementUI
            documents={allRelevantPDFList}
            relevantMLPDFList={relevantMLPDFList}
            relevantCLPDFList={relevantCLPDFList}
            relevantDKPDFList={relevantDKPDFList}
          />
        </div>
      )}

      {!isOpen && messages.length > 0 && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 cursor-pointer h-14 bg-black text-white rounded-full shadow-lg hover:bg-gray-800 transition-all duration-300 flex items-center justify-center z-50"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 p-5 z-50 h-[35rem] bg-white rounded-3xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 ">
          {/* Header */}
          <div className="flex flex-col items-center justify-between">
            <div className="bg-white px-4 py-3 border-b w-full border-gray-100 flex items-center justify-between">
              <h1 className="text-sm font-medium text-gray-800">
                FinancialAdvisor AI Agent
              </h1>
              <button
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="h-80 relative overflow-y-auto p-4 w-full">
              {messages.map((message, index) => (
                <ChatMessageBubbleComponent
                  key={index}
                  content={message.content}
                  isUser={message.role === "user"}
                />
              ))}

              {streamingResponse && (
                <ChatMessageBubbleComponent content={streamingResponse} />
              )}

              {isLoading && !streamingResponse && (
                <div className="flex justify-start animate-in fade-in-0">
                  <div className="rounded-2xl px-4 py-3 bg-white text-gray-900 rounded-bl-none shadow-sm right-1 ring-inset ring-gray-200">
                    <div className="flex items-center gap-1.5">
                      {[0.3, 0.15, 0].map((delay, i) => (
                        <div
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce"
                          style={{ animationDelay: `${delay}s` }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-3 py-5 border-t border-gray-100 w-full">
              <div className="flex items-center space-x-2 bg-gray-50 rounded-full px-3 py-2 border border-black">
                <input
                  type="text"
                  placeholder="Message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") searchHandler(e);
                  }}
                  className="flex-1 bg-transparent border-none outline-none text-xs text-gray-700 placeholder-gray-400"
                />
                <button
                  disabled={input === ""}
                  onClick={searchHandler}
                  className={`w-6 h-6 bg-black ${
                    input === "" ? "cursor-not-allowed" : "cursor-pointer "
                  } rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors`}
                >
                  <Send className="w-3 h-3 text-white" />
                </button>
              </div>

              {/* Footer Text */}
              <div className="text-center mt-2 flex flex-col items-center justify-center">
                <button
                  onClick={clearSearchHandler}
                  className="flex items-center text-xs bg-black text-white py-3 px-4 rounded-2xl mt-3 justify-between w-1/2"
                >
                  Ask new question <ArrowPathIcon className="w-3 h-3" />
                </button>
                <p className="text-xs text-gray-400 mt-2">
                  By chatting you agree to our{" "}
                  <Link href="/#" className="">
                    privacy policy
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <div ref={messagesEndRef} />
        </div>
      )}
      {/* </div> */}
    </div>
  );
};

export default SearchResultPage;
