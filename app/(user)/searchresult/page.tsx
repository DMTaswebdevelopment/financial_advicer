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
import { GroupedDocument } from "@/component/model/interface/GroupedDocument";
import { extractDocumentsFromOutput } from "@/lib/extractDocumentsFromOutput";

interface AssistantMessage extends Message {
  _id: string;
  chatId: string;
  createdAt: number;
  isStreaming: boolean;
}

// Define proper interfaces for the MLDocuments message structure
interface MLDocumentsKwargs {
  content: string;
  // Add other properties if they exist
}

interface MLDocumentsOutput {
  kwargs?: MLDocumentsKwargs;
  // Add other properties that might exist in the output
}

interface MLDocumentsMessage {
  type: StreamMessageType.MLDocuments;
  tool: string;
  output: MLDocumentsOutput;
}

const SearchResultPage = () => {
  const sendMessage = useSelector(getIsMessageSend);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dispatch = useDispatch();
  const trimMessage = useSelector(getTrimMessages);
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

  const [isFindingDocuments, setIsFindingDocuments] = useState<boolean>(false);

  // Keep track of active tool executions
  const toolExecutionStack = useRef<string[]>([]);

  // To track whether a terminal output is currently displayed
  const isTerminalOutputDisplayed = useRef(false);

  const [allRelevantPDFList, setAllRelevantPDFList] = useState<
    GroupedDocument[]
  >([]);
  const [noRelevantPDFListsFound, setNoRelevantPDFListsFound] =
    useState<boolean>(false);

  const [statusIndex, setStatusIndex] = useState(0);

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

  const [isDocumentLoadingDone, setIsDocumentLoadingDone] =
    useState<boolean>(false);

  // this useeffect listen of there is no documents found in pinecone
  useEffect(() => {
    if (isDocumentLoadingDone) {
      if (allRelevantPDFList.length === 0) {
        if (!isFindingDocuments) {
          setNoRelevantPDFListsFound(true);
          setTimeout(() => {}, 10000);
        }
      } else {
        setNoRelevantPDFListsFound(false);
      }
    }
  }, [
    allRelevantPDFList.length,
    allRelevantPDFList,
    isFindingDocuments,
    isDocumentLoadingDone,
  ]);

  const clearSearchHandler = async () => {
    try {
      setMessages([]);
      dispatch(setIsMessageSend(false));
      setIsOpen(false);
      setAllRelevantPDFList([]);
    } catch (error) {
      console.log("Error", error);
    }
  };

  const searchHandler = async (e?: FormEvent) => {
    e?.preventDefault();
    setIsFindingDocuments(true);
    dispatch(setIsMessageSend(true));
    setIsOpen(true);
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    // setAllRelevantPDFList([]);

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

            case StreamMessageType.MLDocuments:
              if ("tool" in message) {
                // Access the content from the nested structure
                const mlMessage = message as MLDocumentsMessage;
                const output = mlMessage.output;

                // Method 1: Direct access if you know the structure
                if (output?.kwargs?.content) {
                  // Extract and save documents to state
                  const { updatedDocs } = extractDocumentsFromOutput(output);

                  if (updatedDocs && updatedDocs.length > 0) {
                    // For setAllRelevantPDFList, use only the updatedDocs (latest documents)
                    setAllRelevantPDFList(() => {
                      // First, create a map of ML documents by their numeric ID
                      const mlTitleMap = new Map<string, string>();

                      updatedDocs.forEach((doc: Document) => {
                        if (doc.category === "ML" && doc.id) {
                          // Extract numeric ID from ML document (e.g., "635" from "635ML-Title")
                          const idString = String(doc.documentNumber);
                          const numericIdMatch = idString;

                          if (numericIdMatch && doc.title) {
                            const numericId = numericIdMatch;
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
                          (doc.category === "CL" ||
                            doc.category === "DK" ||
                            doc.category === "FF" ||
                            doc.category === "AE") &&
                          doc.documentNumber
                        ) {
                          // Extract numeric ID from CL/DK document (e.g., "635" from "635CL-Title" or "635DK-Title")
                          const idString = String(doc.documentNumber);
                          const numericIdMatch = idString;

                          if (numericIdMatch) {
                            const numericId = numericIdMatch;

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
                            documentNumber: doc.documentNumber || "",
                            id: doc.id || "",
                            category: [docCategory],
                          });
                        }
                      });

                      // Convert map back to array - this will only contain the latest documents
                      return Array.from(groupedMap.values());
                    });

                    // setDocuments(updatedDocs);
                  } else {
                    console.log("No documents found in output");
                  }
                }

                // Remove tool from execution stack
                const toolIndex = toolExecutionStack.current.indexOf(
                  message.tool
                );
                if (toolIndex !== -1) {
                  toolExecutionStack.current.splice(toolIndex, 1);
                }
              }

              break;

            case StreamMessageType.ToolEnd:
              // Handle completion of tool execution
              if ("tool" in message && currentTool) {
                // Extract allDocuments from the output

                setIsFindingDocuments(false);

                // Remove tool from execution stack
                const toolIndex = toolExecutionStack.current.indexOf(
                  message.tool
                );
                if (toolIndex !== -1) {
                  toolExecutionStack.current.splice(toolIndex, 1);
                }

                return;
              }
              break;

            case StreamMessageType.Error:
              if ("error" in message) {
                setIsFindingDocuments(false);
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
              // Process the fullResponse to display only title and description
              const processedResponse = fullResponse;
              setIsDocumentLoadingDone(true);
              setIsFindingDocuments(false);

              // Add the final assistant message to the messages array
              const assistantMessage: AssistantMessage = {
                _id: `assistant${Date.now()}`,
                chatId,
                content: processedResponse, // Use the processed response showing only title and description
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
      console.log("Error", error);
      // Handle any error during streaming
      setIsFindingDocuments(false);
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
      setIsFindingDocuments(false);
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
        setIsFindingDocuments(true);
        hasSearched.current = true; // ✅ prevent future runs
        searchHandler();
        // Clear the flag after using it
        localStorage.removeItem("cameFromHero");
      }, 1000);
    }
  }, [searchHandler]);

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
          {noRelevantPDFListsFound ? (
            <>No documents results found. Please try again!</>
          ) : (
            <></>
          )}
          {isFindingDocuments ? (
            <DocumentsLoadingAnimation />
          ) : (
            <DocumentManagementUI documents={allRelevantPDFList} />
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
                <textarea
                  placeholder="Message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (e.shiftKey) {
                        // Allow Shift+Enter to create new line
                        // Let default behavior happen (add new line)
                      } else {
                        // Enter without Shift submits the form
                        e.preventDefault();
                        searchHandler(e);
                      }
                    }
                  }}
                  className="flex-1 bg-transparent border-none outline-none text-xs text-gray-700 placeholder-gray-400 resize-none overflow-y-auto min-h-[20px] max-h-32 break-words"
                  rows={1}
                  style={{
                    height: "auto",
                    minHeight: "20px",
                    maxHeight: "128px",
                    wordWrap: "break-word",
                    whiteSpace: "pre-wrap",
                  }}
                  onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                    const textarea = e.currentTarget;
                    // Reset height to recalculate
                    textarea.style.height = "auto";
                    textarea.style.height =
                      Math.min(textarea.scrollHeight, 128) + "px";
                    // Scroll to bottom to show latest text
                    textarea.scrollTop = textarea.scrollHeight;
                  }}
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
