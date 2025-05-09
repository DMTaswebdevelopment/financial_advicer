"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  MagnifyingGlassIcon,
  MicrophoneIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { getPDFList } from "@/redux/storageSlice";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

type Role = "user" | "assistant";

interface Document {
  id: string | number;
  title: string;
  url?: string;
  storagePath: string;
  category: string;
  filePath?: string;
  pdfID: string;
  key: string; // Adjust if you have more fields
}

interface Message {
  role: Role;
  content: string;
  documents?: Document[];
  isStreaming?: boolean;
}

interface PDFrelevant {
  ML: Document[];
  FF: Document[];
}

interface StreamChunk {
  type: "loading" | "thinking" | "partial" | "complete" | "error";
  message: string;
  aiResponse?: PDFrelevant;
  isRelated?: boolean;
}

export default function LandingPage() {
  const pdfList = useSelector(getPDFList);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // const [currentStreamingContent, setCurrentStreamingContent] = useState("");
  const [relevantMLPDFList, setRelevantMLPDFList] = useState<Document[]>([]);
  const [relevantFFPDFList, setRelevantFFPDFList] = useState<Document[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);
  const [isAILoading, setIsAILoading] = useState<boolean>(false);

  console.log("isAILoading", isAILoading);
  console.log("relevantMLPDFList", relevantMLPDFList);
  console.log("messages", messages);
  // Clean up any active streams when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  type MessageData =
    | string
    | {
        message?: string;
        intent?: string;
        files?: Document[];
        key?: string;
      };

  const getMessageContent = (data: MessageData): string => {
    // Handle different input types
    if (!data) return "";

    // If it's already a string with no JSON markers, return it directly
    if (
      typeof data === "string" &&
      !data.includes('"message":') &&
      !data.includes('"intent":') &&
      !data.includes('"files":') &&
      !data.trim().startsWith("{") &&
      !data.trim().startsWith('"')
    ) {
      return data;
    }

    // If it's an object with a message property
    if (typeof data === "object" && data !== null) {
      return data.message || "";
    }

    // Try to parse as JSON if it's a string that looks like JSON
    if (
      typeof data === "string" &&
      (data.trim().startsWith("{") || data.includes('"message":'))
    ) {
      try {
        const parsed = JSON.parse(data);
        return parsed.message || "";
      } catch {
        // If JSON parsing fails, try regex extraction
        const messageMatch = data.match(/"message"\s*:\s*"([^"]*)"/);
        if (messageMatch && messageMatch[1]) {
          return messageMatch[1];
        }
      }
    }

    // If all else fails, return the string but remove JSON syntax
    if (typeof data === "string") {
      return data
        .replace(/^\s*[\{\"]/, "")
        .replace(/[\}\"]$/, "")
        .replace(/"message"\s*:\s*"/, "")
        .replace(/"\s*,\s*"files"\s*:\s*\[\]/, "")
        .replace(/",?\s*"files":\s*\[\]\s*\}?\s*$/, "")
        .replace(/",?\s*\}?\s*$/, "");
    }

    return "";
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    // setCurrentStreamingContent("");
    setPdfLoading(false);

    // Create a placeholder for the assistant's response
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "Thinking...",
        isStreaming: true,
      },
    ]);
    setIsAILoading(true);
    // Create a new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/claude_chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          pdf: pdfList,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error("Failed to get response");
      if (!response.body) throw new Error("Response body is null");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let streamedContent = "";
      let finalResponse: StreamChunk | null = null;

      // Process the streaming response chunks
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          const text = decoder.decode(value);
          const lines = text.split("\n").filter((line) => line.trim() !== "");

          for (const line of lines) {
            try {
              const chunk: StreamChunk = JSON.parse(line);
              setIsAILoading(false);
              // Handle PDF-related actions
              if (
                chunk.type === "partial" &&
                chunk.isRelated === true &&
                chunk.aiResponse
              ) {
                setPdfLoading(true);
              }

              // Process the message content
              if (chunk.type === "loading" || chunk.type === "thinking") {
                // Just show thinking state, don't update streamedContent
                // setCurrentStreamingContent("Thinking...");
              } else if (chunk.type === "partial") {
                // Extract clean message content with no JSON artifacts
                const messageContent = getMessageContent(chunk.message);

                if (messageContent && messageContent.trim()) {
                  // If we're transitioning from thinking to content
                  if (
                    streamedContent === "" ||
                    streamedContent === "Thinking..."
                  ) {
                    streamedContent = messageContent;
                  } else {
                    // Append new content
                    streamedContent += messageContent;
                  }

                  // Update UI with clean content
                  // setCurrentStreamingContent(streamedContent);

                  // Update message in the chat
                  setMessages((prev) => {
                    const updatedMessages = [...prev];
                    const lastIndex = updatedMessages.length - 1;
                    updatedMessages[lastIndex] = {
                      ...updatedMessages[lastIndex],
                      content: streamedContent,
                      isStreaming: true,
                    };
                    return updatedMessages;
                  });
                }
              } else if (chunk.type === "complete" || chunk.type === "error") {
                finalResponse = chunk;
              }
            } catch (e) {
              console.error("Error parsing streaming chunk:", e);
            }
          }
        }
      }

      // When streaming is done, update with final response
      if (finalResponse) {
        let finalContent = getMessageContent(finalResponse.message);

        console.log("finalResponse", finalResponse);
        // If somehow we ended up with empty content, use what we've streamed
        if (
          !finalContent.trim() &&
          streamedContent &&
          streamedContent !== "Thinking..."
        ) {
          finalContent = streamedContent;
        }

        // Update the final message
        setMessages((prev) => {
          const updatedMessages = [...prev];
          const lastIndex = updatedMessages.length - 1;
          updatedMessages[lastIndex] = {
            role: "assistant",
            content: finalContent,
            isStreaming: false,
          };
          return updatedMessages;
        });

        // Handle PDF-related responses
        if (finalResponse.isRelated && finalResponse.aiResponse) {
          setRelevantMLPDFList(finalResponse.aiResponse.ML);
          setRelevantFFPDFList(finalResponse.aiResponse.FF);
          setPdfLoading(false);
        }
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Error:", error);
        setMessages((prev) => {
          const updatedMessages = [...prev];
          const lastIndex = updatedMessages.length - 1;
          if (updatedMessages[lastIndex].role === "assistant") {
            updatedMessages[lastIndex] = {
              role: "assistant",
              content: "Sorry, I encountered an error. Please try again.",
              isStreaming: false,
            };
          }
          return updatedMessages;
        });
      }
    } finally {
      setIsLoading(false);
      // setCurrentStreamingContent("");
      abortControllerRef.current = null;
    }
  };

  // Calculate if sidebar should be shown
  const showSidebar = relevantMLPDFList.length > 0 || pdfLoading;

  return (
    <div className="bg-white">
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-32 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        >
          <div
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
            className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          />
        </div>
        <div className="mx-auto max-w-[100rem] flex flex-col">
          <div className="text-center">
            <h1 className="text-5xl font-semibold tracking-tight text-balance text-gray-900 sm:text-7xl">
              Financial Advisor
            </h1>
            <p className="text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
              Get accurate answers to your complex financial questions with our
              AI-powered advisory tool.
            </p>
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
                    width: showSidebar ? "65%" : "100%",
                  }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  {messages.length > 0 && (
                    <div className="h-[25rem] overflow-y-auto p-8 w-full">
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          className={`mb-4 p-4 rounded-lg ${
                            message.role === "user"
                              ? "bg-blue-100 ml-8 text-end"
                              : "bg-gray-100 mr-8 text-start"
                          }`}
                        >
                          <div className="font-bold mb-1 ">
                            {message.role === "user" ? "You" : "Finance AI"}:
                          </div>
                          <div className="prose">
                            {message.content}
                            {message.isStreaming && (
                              <span className="inline-block w-2 h-4 ml-1 bg-blue-500 animate-pulse"></span>
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
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
                      className="w-[50rem] p-6"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 50 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                    >
                      <h3 className="font-medium mb-3">Relevant Documents:</h3>

                      {pdfLoading && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex py-6"
                        >
                          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="ml-3 text-gray-600">
                            Loading documents...
                          </span>
                        </motion.div>
                      )}

                      {relevantMLPDFList.length > 0 && !pdfLoading && (
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
                                  <span className="ml-2 truncate w-96 text-start font-bold">
                                    {pdf.id}
                                  </span>
                                </div>
                              </a>
                            </motion.div>
                          ))}

                          <div className="relative flex flex-col space-y-5">
                            {/* Background overlay with centered Subscribe button */}
                            <div className="bg-black/20 absolute inset-0 flex justify-center items-center z-10">
                              <button className="bg-blue-500 text-white px-7 py-3 rounded shadow cursor-pointer">
                                Subscribe
                              </button>
                            </div>

                            {/* Content overlaid behind the Subscribe layer */}
                            <h1 className="z-0">Financial Fluency</h1>

                            {relevantFFPDFList.map((pdf, docIndex) => (
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
                                    <span className="ml-2 truncate w-96 text-start font-bold">
                                      {pdf.id}
                                    </span>
                                  </div>
                                </a>
                              </motion.div>
                            ))}
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
