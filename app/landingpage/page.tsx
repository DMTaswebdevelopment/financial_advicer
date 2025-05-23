"use client";

import { FormEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  MagnifyingGlassIcon,
  MicrophoneIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
// import { getPDFList } from "@/redux/storageSlice";
// import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  ChatRequestBody,
  Message,
} from "@/component/model/types/ChatRequestBody";
import { createSSEParser } from "@/lib/createSSEParser";
import { v4 as uuidv4 } from "uuid"; // Import UUID for generating unique IDs
import { StreamMessageType } from "@/component/model/types/StreamMessage";
import MessageBubble from "@/component/MessageBubble/MessageBubble";
import { useRouter } from "next/navigation";
import { useUser } from "../context/authContext";
import { getPDFList } from "@/redux/storageSlice";
import { useSelector } from "react-redux";

interface Document {
  id: number | string;
  title: string;
  url?: string;
  matchIndex?: number;
  storagePath: string;
  category: string;
  filePath?: string;
  pdfID: string;
  key: string;
  fullLabel: string; // <-- Add this
}

interface AssistantMessage extends Message {
  _id: string;
  chatId: string;
  createdAt: number;
  isStreaming: boolean;
}

export default function LandingPage() {
  const route = useRouter();
  const { user } = useUser();

  const pdfList = useSelector(getPDFList);
  const [messages, setMessages] = useState<Message[]>([]);
  const [relevantMLPDFList, setRelevantMLPDFList] = useState<Document[]>([]);
  const [relevantCLPDFList, setRelevantCLPDFList] = useState<Document[]>([]);
  const [relevantDKPDFList, setRelevantDKPDFList] = useState<Document[]>([]);

  console.log("messages", messages);
  // const [relevantFFPDFList, setRelevantFFPDFList] = useState<Document[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [streamingResponse, setStreamingResponse] = useState<string>("");
  const [input, setInput] = useState("");
  const [currentTool, setCurrentTool] = useState<{
    name: string;
    input: unknown;
  } | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Create rotating status messages
  const searchingStatuses = [
    "One moment, I'll search for some information related to this topic.",
    "Still searching...",
    "Won't be long now...",
    "Almost there, still looking...",
    "Processing relevant documents...",
    "Analyzing financial data...",
  ];

  // Keep track of active tool executions
  const toolExecutionStack = useRef<string[]>([]);

  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setStatusIndex((prevIndex) => (prevIndex + 1) % searchingStatuses.length);
    }, 5000); // every 5 seconds

    return () => clearInterval(intervalId); // cleanup on unmount
  }, []);

  // To track whether a terminal output is currently displayed
  const isTerminalOutputDisplayed = useRef(false);

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

  // Clean up any active streams when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useLayoutEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingResponse]);

  let accumulatedText = "";
  let accumulatedTextWithDocs = ""; // includes doc lines (with URLs)

  const processedUrls = new Set<string>();

  const extractMLDocumentsFromText = (
    text: string
  ): {
    newDocs: Document[];
    hasNew: boolean;
  } => {
    accumulatedText += text;

    const pattern =
      /\d+\.\s+(.+?)\s+(https:\/\/firebasestorage\.googleapis\.com\/[^\s]+)/gi;

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
      const id = match[1]?.trim();
      const title = match[1]?.trim(); // e.g. "Estate Management..."
      const url = match[2]?.trim();
      const matchIndex = match.index; // position in the stream

      console.log("match", match);
      let category = "ML"; // Default category
      if (title) {
        const titleLower = title.toLowerCase();
        if (titleLower.includes("dk")) {
          category = "DK";
        } else if (titleLower.includes("cl")) {
          category = "CL";
        } else if (titleLower.includes("ml")) {
          category = "ML";
        }
      }

      if (id && title && url && !processedUrls.has(url)) {
        processedUrls.add(url);
        hasNew = true;

        newDocs.push({
          id,
          title,
          url,
          filePath: url,
          storagePath: url,
          category,
          pdfID: uuidv4(),
          key: uuidv4(),
          matchIndex, // include the position for tracking
          fullLabel,
        });
      }
    }

    return { newDocs, hasNew };
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();

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

    // if (relevantMLPDFList.length > 0) {
    //   setRelevantMLPDFList([]);
    // }
    // if (relevantCLPDFList.length > 0) {
    //   setRelevantCLPDFList([]);
    // }
    // if (relevantDKPDFList.length > 0) {
    //   setRelevantDKPDFList([]);
    // }
    // Add a placeholder streaming message from assistant
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
        pdfLists: pdfList,
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
          console.log("message", message);
          switch (message.type) {
            case StreamMessageType.Token:
              // Handle streaming tokens (normal text response)
              if ("token" in message) {
                const tokenContent = message.token;
                accumulatedTextWithDocs += tokenContent;

                console.log("accumulatedTextWithDocs", accumulatedTextWithDocs);
                //   // Process the extracted documents
                const { newDocs, hasNew } =
                  extractMLDocumentsFromText(tokenContent);

                const docPattern =
                  /\d+\.\s+(.+?)\s+(https:\/\/firebasestorage\.googleapis\.com\/[^\s]+)/gi;

                const cleanedToken = accumulatedTextWithDocs.replace(
                  docPattern,
                  (match, title, url) => {
                    const docNumberMatch = match.match(/^\d+/); // Get the number
                    const docNumber = docNumberMatch ? docNumberMatch[0] : "";
                    console.log("url", url);
                    return `${docNumber}. ${title}`;
                  }
                );

                if (hasNew && newDocs.length > 0) {
                  // Sort documents by category and update appropriate state
                  const mlDocs = newDocs.filter((doc) => doc.category === "ML");
                  const clDocs = newDocs.filter((doc) => doc.category === "CL");
                  const dkDocs = newDocs.filter((doc) => doc.category === "DK");

                  console.log("dkDocs", dkDocs);
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

                console.log("accumulatedTextWithDocs", accumulatedTextWithDocs);
                // 4. Accumulate cleaned version
                fullResponse = cleanedToken;
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

              console.log("fullResponse", fullResponse);
              // Regular expression to match document listings with prefixes
              const docTitleRegex =
                /(\d+)\.\s+(?:ML|CL|DK)\s+(.*?)\s+(https:\/\/firebasestorage\.googleapis\.com\/[^\s]+)/gi;

              // Replace with just the title (without ML/CL prefix)
              processedResponse = processedResponse.replace(
                docTitleRegex,
                function (match, number, title, url) {
                  console.log("match", match);
                  console.log("url", url);
                  return `${number}. ${title}`;
                }
              );

              console.log("processedResponse", processedResponse);
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

  // Calculate if sidebar should be shown
  const showSidebar = relevantMLPDFList.length > 0;

  return (
    <div className="bg-white flex h-[calc(100vh-theme(spacing.14))] flex-col items-center p-4 md:p-16">
      <div className="relative isolate px-6 pt-14 lg:px-8">
        {/* <div
          aria-hidden="true"
          className="absolute inset-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        >
          <div
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
            className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          />
        </div> */}
        <div className="mx-auto max-w-[100rem] flex flex-col">
          <div className="text-center">
            {messages.length === 0 && (
              <>
                <h1 className="text-5xl font-semibold tracking-tight text-balance text-gray-900 sm:text-7xl">
                  Financial Advisor
                </h1>
                <p className="text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
                  Get accurate answers to your complex financial questions with
                  our AI-powered advisory tool.
                </p>
              </>
            )}

            <div className="max-w-7xl flex justify-center items-center mt-10 flex-col">
              <div className="w-full max-w-7xl">
                <AnimatePresence>
                  {messages.length === 0 && (
                    <motion.h2
                      key="prompt"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.4 }}
                      className="text-black text-sm mb-4 font-semibold"
                    >
                      What would you like to know about?
                    </motion.h2>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className={`${showSidebar ? "w-full" : "max-w-3xl"}`}>
              <div className="flex w-full gap-5">
                <motion.div
                  id="chat_section"
                  className="w-full"
                  initial={{ width: "100%" }}
                  animate={{
                    width: showSidebar ? "100%" : "100%",
                  }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  <div
                    className={` ${
                      messages.length === 0 ? "h-auto" : "h-[30rem]"
                    }  overflow-y-auto p-8 w-full`}
                  >
                    {messages.map((message, index) => (
                      <MessageBubble
                        key={index}
                        content={message.content}
                        // isStreaming={message.}
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

                  <div className="relative">
                    <div className="flex items-center rounded-full border border-gray-300 bg-white shadow-sm hover:shadow transition-shadow px-2">
                      <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 ml-3" />

                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSearch(e);
                        }}
                        placeholder="E.g., 'How may I help you?'"
                        className="w-full px-4 py-6 rounded-full bg-transparent text-gray-700 focus:outline-none"
                      />
                      <div className="flex gap-2 mr-3">
                        <button className="text-gray-500 border relative border-gray-400/30 rounded-full w-11 h-11 flex justify-center items-center hover:text-blue-700 hover:border-blue-700 p-1 cursor-pointer hover:scale-95 transition-transform duration-200">
                          <MicrophoneIcon className="w-5 h-5" />
                        </button>
                        <button
                          disabled={input === ""}
                          onClick={handleSearch}
                          className={`bg-blue-600 text-white ${
                            input === ""
                              ? "cursor-not-allowed opacity-70"
                              : "cursor-pointer hover:bg-blue-700"
                          } p-4 rounded-full transition-colors`}
                        >
                          <PaperAirplaneIcon className="w-5 h-5 -rotate-20" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <AnimatePresence>
                  {showSidebar && (
                    <motion.div
                      id="relevant_file_section"
                      className="w-full p-6"
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
                          {relevantMLPDFList.map((pdf, docIndex) => (
                            <motion.div
                              key={docIndex}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                              className="flex w-full gap-5 items-center"
                            >
                              <span className="text-gray-500">
                                {docIndex + 1}.
                              </span>
                              <a
                                href={pdf.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between bg-gray-50 p-3 rounded shadow w-full hover:bg-gray-100 transition-colors overflow-hidden"
                              >
                                <div className="flex items-center">
                                  <Image
                                    src="https://res.cloudinary.com/dmz8tsndt/image/upload/v1745467628/images__1_-removebg-preview_wdcxcf.png"
                                    height={50}
                                    width={50}
                                    alt="pdf_logo"
                                  />
                                  <span className="ml-2 w-full text-start font-bold text-sm">
                                    {pdf.title}
                                  </span>
                                </div>
                              </a>
                            </motion.div>
                          ))}

                          <div className="relative flex flex-col space-y-5">
                            {/* Background overlay with centered Subscribe button */}
                            {user?.productId !== "prod_SIo6C0oz646SIN" && (
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
                              <div className="">
                                <h3 className="text-start text-2xl font-bold mb-3">
                                  Checklist & Practical Guide Series
                                </h3>
                                {relevantCLPDFList.map((pdf, docIndex) => (
                                  <motion.div
                                    key={docIndex}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex w-full gap-5 items-center z-0"
                                  >
                                    <span className="text-gray-500">
                                      {docIndex + 1}.
                                    </span>
                                    <a
                                      href={pdf.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-between bg-gray-50 p-3 rounded shadow w-full hover:bg-gray-100 transition-colors overflow-hidden"
                                    >
                                      <div className="flex items-center">
                                        <Image
                                          src="https://res.cloudinary.com/dmz8tsndt/image/upload/v1745467628/images__1_-removebg-preview_wdcxcf.png"
                                          height={50}
                                          width={50}
                                          alt="pdf_logo"
                                        />
                                        <span className="ml-2 w-full text-start font-bold">
                                          {pdf.id}
                                        </span>
                                      </div>
                                    </a>
                                  </motion.div>
                                ))}
                              </div>
                            )}

                            {relevantDKPDFList.length > 0 && (
                              <>
                                {/* Content overlaid behind the Subscribe layer */}
                                <h3 className="text-start text-2xl font-bold mb-3">
                                  Detailed Knowledge Series
                                </h3>

                                {relevantDKPDFList.map((pdf, docIndex) => (
                                  <motion.div
                                    key={docIndex}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex w-full gap-5 items-center z-0"
                                  >
                                    <span className="text-gray-500">
                                      {docIndex + 1}.
                                    </span>
                                    <a
                                      href={pdf.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-between bg-gray-50 p-3 rounded shadow w-full hover:bg-gray-100 transition-colors overflow-hidden"
                                    >
                                      <div className="flex items-center">
                                        <Image
                                          src="https://res.cloudinary.com/dmz8tsndt/image/upload/v1745467628/images__1_-removebg-preview_wdcxcf.png"
                                          height={50}
                                          width={50}
                                          alt="pdf_logo"
                                        />
                                        <span className="ml-2 w-full text-start font-bold">
                                          {pdf.id}
                                        </span>
                                      </div>
                                    </a>
                                  </motion.div>
                                ))}
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
          </div>
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
        >
          <div
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
            className="relative left-[calc(50%+3rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
          />
        </div>
      </div>
    </div>
  );
}
