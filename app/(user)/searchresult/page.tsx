"use client";

import { Document } from "@/component/model/interface/Document";
import {
  ChatRequestBody,
  Message,
} from "@/component/model/types/ChatRequestBody";
import { StreamMessageType } from "@/component/model/types/StreamMessage";
import { createSSEParser } from "@/lib/createSSEParser";
import {
  getIsMessageSend,
  getTrimMessages,
  setIsMessageSend,
} from "@/redux/storageSlice";

import { MessageCircle, Send, X } from "lucide-react";
import React, {
  FormEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid"; // Import UUID for generating unique IDs
import ChatMessageBubbleComponent from "@/components/templates/ChatMessageBubbleComponent/ChatMessageBubbleComponent";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import DocumentManagementUI from "@/component/ui/DocumentManagement/DocumentManagementUI";
import Link from "next/link";
import SearchResultComponent from "@/component/searchResultComponent/SearchResultComponent";
import DocumentsLoadingAnimation from "@/component/ui/DocumentsLoadingAnimation";

interface AssistantMessage extends Message {
  _id: string;
  chatId: string;
  createdAt: number;
  isStreaming: boolean;
}

const SearchResultPage = () => {
  // const pathname = usePathname();
  const sendMessage = useSelector(getIsMessageSend);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dispatch = useDispatch();
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
    // matchIndex: number | undefined;
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
    updatedDocs: Document[]; // Return updated list
  } => {
    accumulatedText += text;

    // Updated regex pattern to capture numbered list items with ID, title, and description
    // const pattern =
    //   /^\d+\.\s+(?:\[)?(\d+(?:ML|CL|DK))(?:\])?\s*[-–]?\s*(.+?)(?:\s*\n\s+Key:\s*([A-Za-z0-9+/=]+)\s*\n\s*(.+?))?(?=\n\d+\.|\n[A-Z]|\n\s*$|$)/gim;
    // /^\d+\.\s+(?:\[)?(\d+(?:ML|CL|DK))(?:\])?\s*[-–]?\s*(.+?)\s*\n\s+Key:\s*([A-Za-z0-9+/=]+)\s*\n\s*(.+?)(?=\n\d+\.|\n[A-Z]|\n\s*$|$)/gim;
    // /^\d+\.\s+(?:\[)?(\d+(?:ML|CL|DK))(?:\])?\s*[-–]?\s*(.+?)(?:\s*\n\s+Key:\s*([A-Za-z0-9+/=]+)\s*\n\s*(.+?))?(?=\n\d+\.|\n[A-Z]|\n\s*$|$)/gim;
    // /^\d+\.\s+(?:\[)?(\d+(?:ML|CL|DK))(?:\])?\s*[-–]?\s*(.+?)\s*\n\s+Key:\s*([A-Za-z0-9+/=]+)\s*\n\s*(.+?)(?=\n\d+\.|\n[A-Z]|\n\s*$|$)/gim;
    //  /^\d+\.\s+(?:\[)?(\d+(?:ML|CL|DK))(?:\])?\s*[-–]?\s*(.+?)\s*\n\s+Key:\s*([A-Za-z0-9+/=]+)\s*\n\s*(.+?)(?=\n\d+\.|\n[A-Z]|\n\s*$|$)/gim;

    // const alternativePattern =
    //   /^\d+\.\s+(?:\[)?(\d+(?:ML|CL|DK))(?:\])?\s*[-–]?\s*(.+?)(?:\s*\n\s+Key:\s*([A-Za-z0-9+/=]+)\s*\n\s*(.+?))?(?=\n\d+\.|\n[A-Z]|\n\s*$|$)/gim;
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

    // Primary regex pattern
    const primaryPattern =
      /^\d+\.\s+(?:\[)?(\d+(?:ML|CL|DK))(?:\])?\s*[-–]?\s*(.+?)(?:\s*\n\s+Key:\s*([A-Za-z0-9+/=]+)\s*\n\s*(.+?))?(?=\n\d+\.|\n[A-Z]|\n\s*$|$)/gim;

    // Fallback regex pattern for when key is undefined
    const fallbackPattern =
      /^\d+\.\s+(\d+(?:ML|CL|DK))-(.+?)\s*\n\s*Key:\s*([A-Za-z0-9+/=]+)\s*\n\s*(.+?)(?=\n\d+\.|\n[A-Z][^:]*:|\n\s*$|$)/gim;

    // const allMatches: Document[] = [];
    // const finalDocs: Document[] = [];
    const matchesByIndex = new Map<number, Document>();
    let hasNew = false;

    // Function to process matches from a given pattern
    const processMatches = (pattern: RegExp, isPrimary: boolean = true) => {
      let match;
      while ((match = pattern.exec(accumulatedText)) !== null) {
        let rawId: string;
        let title: string;
        let key: string | undefined;
        let description: string | undefined;

        if (isPrimary) {
          // Primary pattern structure
          rawId = match[1].replace(/\s+/g, ""); // e.g. "515DK"
          title = match[2]?.trim(); // e.g. "Australian Genuine Redundancy - A Tax Guide"
          key = match[3]?.trim(); // e.g. "NjQzTUwgLUF1c3RyYWxpYW4gR2VudWluZSBSZWR1bmRhb"
          description = match[4]?.trim(); // e.g. "The document provides an overview..."
        } else {
          // Fallback pattern structure
          rawId = match[1].replace(/\s+/g, ""); // e.g. "515DK"
          title = match[2]?.trim(); // e.g. "Australian Genuine Redundancy - A Tax Guide"
          key = match[3]?.trim(); // e.g. "NjQzTUwgLUF1c3RyYWxpYW4gR2VudWluZSBSZWR1bmRhb"
          description = match[4]?.trim(); // e.g. "The document provides an overview..."
        }

        const fullLabel = match[0]?.trim(); // e.g. "595ML-Estate Management..."
        const id = `${rawId}-${title}`;
        const matchIndex = match.index; // position in the stream

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

        if (id && matchIndex !== undefined) {
          const newDoc: Document = {
            id,
            title,
            category,
            pdfID: uuidv4(),
            key: key,
            matchIndex,
            description: description || "",
            fullLabel,
          };

          // Check if we already have a document at this index
          const existingDoc = matchesByIndex.get(matchIndex);

          if (existingDoc) {
            console.log(`Replacing document at index ${matchIndex}:`);
            console.log(`  Old: ${existingDoc.id}`);
            console.log(`  New: ${newDoc.id}`);
          } else {
            console.log(
              `Adding new document at index ${matchIndex}: ${newDoc.id}`
            );
          }

          // Always keep the latest match for this index (overwrites existing)
          matchesByIndex.set(matchIndex, newDoc);
          hasNew = true;
        }
      }
    };

    // First, try the primary pattern
    processMatches(primaryPattern, true);

    // Check if we have any matches without keys, and if so, try the fallback pattern
    const matchesWithoutKeys = Array.from(matchesByIndex.values()).filter(
      (doc) => !doc.key
    );

    if (matchesWithoutKeys.length > 0) {
      console.log(
        `Found ${matchesWithoutKeys.length} matches without keys, trying fallback pattern...`
      );

      // Reset the pattern's lastIndex to start from beginning
      fallbackPattern.lastIndex = 0;

      // Process with fallback pattern
      processMatches(fallbackPattern, false);
    }

    // Convert map to array, sorted by matchIndex
    const finalDocs = Array.from(matchesByIndex.values()).sort(
      (a, b) => (a.matchIndex ?? 0) - (b.matchIndex ?? 0)
    );

    finalDocs.forEach((doc) => {
      console.log(
        `  Index ${doc.matchIndex}: ${doc.id} - Key: ${
          doc.key ? "Present" : "Missing"
        }`
      );
    });

    return {
      newDocs: finalDocs,
      hasNew,
      updatedDocs: finalDocs,
    };
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
      dispatch(setIsMessageSend(false));
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
    dispatch(setIsMessageSend(true));
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
                const { newDocs, hasNew, updatedDocs } =
                  extractMLDocumentsFromText(tokenContent);

                if (hasNew && newDocs.length > 0 && updatedDocs.length > 0) {
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

                  // For setAllRelevantPDFList, use only the updatedDocs (latest documents)
                  setAllRelevantPDFList(() => {
                    // First, create a map of ML documents by their numeric ID
                    const mlTitleMap = new Map<string, string>();

                    updatedDocs.forEach((doc: Document) => {
                      if (doc.category === "ML" && doc.id) {
                        // Extract numeric ID from ML document (e.g., "635" from "635ML-Title")
                        const idString = String(doc.id);
                        const numericIdMatch = idString.match(/^(\d+)ML-/);

                        if (numericIdMatch && doc.title) {
                          const numericId = numericIdMatch[1];
                          mlTitleMap.set(numericId, doc.title);
                        }
                      }
                    });

                    // Create a map to group documents by title using only the latest updatedDocs
                    const groupedMap = new Map<string, GroupedDocument>();

                    // Process ONLY the updatedDocs (which are already deduplicated by matchIndex)
                    updatedDocs.forEach((doc: Document) => {
                      let titleToUse = doc.title;

                      // For CL and DK documents, try to use ML title if available
                      if (
                        (doc.category === "CL" || doc.category === "DK") &&
                        doc.id
                      ) {
                        // Extract numeric ID from CL/DK document (e.g., "635" from "635CL-Title" or "635DK-Title")
                        const idString = String(doc.id);
                        const numericIdMatch =
                          idString.match(/^(\d+)(?:CL|DK)-/);

                        if (numericIdMatch) {
                          const numericId = numericIdMatch[1];
                          const mlTitle = mlTitleMap.get(numericId);
                          if (mlTitle) {
                            titleToUse = mlTitle; // Use ML title instead of CL/DK title
                          }
                        }
                      }

                      const titleKey = titleToUse.toLowerCase();

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
                          title: titleToUse || "",
                          key: [doc.key || ""],
                          description: doc.description || "",
                          id: doc.id || "",
                          category: [docCategory],
                        });
                      }
                    });

                    // Convert map back to array - this will only contain the latest documents
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
                /^\d+\.\s+(\d+(?:ML|CL|DK))-(.+?)\s*\n\s*Key:\s*([A-Za-z0-9+/=]+)\s*\n\s*(.+?)(?=\n\d+\.|\n[A-Z][^:]*:|\n\s*$|$)/gim;

              // /^\d+\.\s+(?:\[)?(\d+(?:ML|CL|DK))(?:\])?\s*[-–]?\s*(.+?)\s*\n\s+Key:\s*([A-Za-z0-9+/=]+)\s*\n\s*(.+?)(?=\n\d+\.|\n[A-Z]|\n\s*$|$)/gim;
              // /^\d+\.\s+(\d+(?:ML|CL|DK))\s*[-–]\s*(.+?)\s*\n\s+Key:\s*([A-Za-z0-9+/=]+)\s*\n\s*(.+?)(?=\n\d+\.|\n[A-Z]|\n\s*$|$)/gim;

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
    <div className="mx-auto w-full flex-col flex items-center py-14 px-5 h-screen">
      {/* <div className="w-full flex flex-col items-center py-16"> */}
      {!sendMessage ? (
        <SearchResultComponent
          input={input}
          setInput={setInput}
          searchHandler={searchHandler}
        />
      ) : (
        <div className="w-full flex flex-col items-center lg:px-20">
          <h1 className="text-6xl font-playfair mb-4">Documents List</h1>
          {allRelevantPDFList.length === 0 ? (
            <DocumentsLoadingAnimation />
          ) : (
            <DocumentManagementUI
              documents={allRelevantPDFList}
              relevantMLPDFList={relevantMLPDFList}
              relevantCLPDFList={relevantCLPDFList}
              relevantDKPDFList={relevantDKPDFList}
            />
          )}
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
