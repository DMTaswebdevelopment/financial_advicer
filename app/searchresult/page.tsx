"use client";

import MessageBubble from "@/component/MessageBubble/MessageBubble";
import { Document } from "@/component/model/interface/Document";
import {
  ChatRequestBody,
  Message,
} from "@/component/model/types/ChatRequestBody";
import { StreamMessageType } from "@/component/model/types/StreamMessage";
import RelevantCLPDFList from "@/component/ui/RelevantCLPDFList/RelevantCLPDFList";
import RelevantDKPDFList from "@/component/ui/RelevantDKPDFList/RelevantDKPDFList";
import RelevantMLPDFList from "@/component/ui/RelevantMLPDFList/RelevantMLPDFList";
import { createSSEParser } from "@/lib/createSSEParser";
import { getTrimMessages } from "@/redux/storageSlice";

import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import React, {
  FormEvent,
  useEffect,
  // useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid"; // Import UUID for generating unique IDs
import { useUser } from "../context/authContext";

interface AssistantMessage extends Message {
  _id: string;
  chatId: string;
  createdAt: number;
  isStreaming: boolean;
}

const SearchResultPage = () => {
  // const pathname = usePathname();
  const route = useRouter();
  const { user } = useUser();

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

  const [relevantMLPDFList, setRelevantMLPDFList] = useState<Document[]>([]);
  const [relevantCLPDFList, setRelevantCLPDFList] = useState<Document[]>([]);
  const [relevantDKPDFList, setRelevantDKPDFList] = useState<Document[]>([]);

  const [statusIndex, setStatusIndex] = useState(0);

  let accumulatedText = "";
  let accumulatedTextWithDocs = ""; // includes doc lines (with URLs)

  // useLayoutEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  // }, [messages, streamingResponse]);

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

    const pattern =
      /(\d+\s*(ML|CL|DK))\s*[-–]?\s*(.+?)\s+([A-Za-z0-9+/=]{16,})/gi;
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
      const rawId = match[1]?.trim();
      const title = match[3]?.trim(); // e.g. "Estate Management..."
      const id = `${rawId}-${title}`;
      const key = match[4]?.trim();
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

      if (id) {
        hasNew = true;

        newDocs.push({
          id,
          title,
          category,
          pdfID: uuidv4(),
          key: key,
          matchIndex, // include the position for tracking
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

  const searchHandler = async (e?: FormEvent) => {
    e?.preventDefault();

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
                /(\d+\s*(ML|CL|DK))\s*[-–]?\s*(.+?)\s+([A-Za-z0-9+/=]{16,})/gi;

              // /\b(\d+(?:ML|CL|DK))\s+(.+?)(?=\n|$)/gi;
              // /(\d+)\.\s+(?:ML|CL|DK)\s+(.*?)\s+(https:\/\/firebasestorage\.googleapis\.com\/[^\s]+)/gi;

              // Replace with just the title (without ML/CL prefix)
              processedResponse = processedResponse.replace(
                docTitleRegex,
                function (match, number, key, title) {
                  console.log("key", key);
                  console.log("number", number);
                  console.log("match here", match[1].trim());
                  return `${title}`;
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

  // Calculate if sidebar should be shown
  const showSidebar = relevantMLPDFList.length > 0;

  return (
    <div className="h-screen py-16">
      <div className="w-full flex flex-col items-center py-16">
        <div className="w-[80rem] bg-gray-700/10 rounded-2xl h-96 relative flex flex-col justify-between">
          {/* Scrollable messages area */}
          <div className="overflow-y-auto px-4 pt-4 pb-2 flex-1">
            <div className="flex flex-col mx-auto w-[60rem]">
              {messages.map((message, index) => (
                <MessageBubble
                  key={index}
                  content={message.content}
                  isUser={message.role === "user"}
                />
              ))}
              {streamingResponse && (
                <MessageBubble content={streamingResponse} />
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

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Fixed input at the bottom */}
          <div className="px-6 py-4 bg-white rounded-b-2xl border-t border-gray-200 flex items-center justify-center w-full">
            <div className="flex items-center rounded-full shadow-lg border border-gray-200 px-4 py-2 w-[40rem] justify-center">
              <Search className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
              <input
                type="text"
                placeholder="E.g., How can I build an emergency fund?"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") searchHandler(e);
                }}
                className="flex-1 text-gray-600 placeholder-gray-400 outline-none text-sm"
              />
              <button
                onClick={searchHandler}
                className={`ml-3 bg-gray-800 text-white rounded-full p-2 hover:bg-gray-700 transition-colors ${
                  isLoading ? "cursor-not-allowed" : "cursor-pointer"
                } `}
              >
                <Search className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              id="relevant_file_section"
              className="w-full p-6 h-[40rem] overflow-scroll"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <h3 className="text-start text-2xl font-bold mb-3">
                Missing Lessons Series:
              </h3>

              {relevantMLPDFList.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{
                    duration: 0.3,
                    staggerChildren: 0.1,
                    delayChildren: 0.1,
                  }}
                  className="space-y-3"
                >
                  {/* relevant ml pdf (start) */}
                  <RelevantMLPDFList pdfLists={relevantMLPDFList} />
                  {/* relevant ml pdf (end) */}

                  <div className="relative flex flex-col space-y-5">
                    {/* Background overlay with centered Subscribe button */}
                    {user?.productId !== "prod_SIo6C0oz646SIN" &&
                      relevantCLPDFList.length > 0 && (
                        <div className="bg-black/20 absolute inset-0 flex justify-center items-center z-10 h-full">
                          <button
                            onClick={() => route.push("/payment/price")}
                            className="bg-blue-500 text-white px-7 py-3 rounded shadow cursor-pointer"
                          >
                            Subscribe
                          </button>
                        </div>
                      )}

                    {/* Content overlaid behind the Subscribe layer */}
                    {relevantCLPDFList.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <h3 className="text-start text-2xl font-bold mb-3">
                          Checklist & Practical Guide Series
                        </h3>

                        <RelevantCLPDFList pdfLists={relevantCLPDFList} />
                      </div>
                    )}

                    {relevantDKPDFList.length > 0 && (
                      <>
                        {/* Content overlaid behind the Subscribe layer */}
                        <h3 className="text-start text-2xl font-bold mb-3">
                          Detailed Knowledge Series
                        </h3>

                        <RelevantDKPDFList pdfLists={relevantDKPDFList} />
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SearchResultPage;
