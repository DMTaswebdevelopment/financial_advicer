import { setIsDocumentNumberSelected } from "@/redux/storageSlice";
import { ChevronDown } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";

export type MessageRole = "user" | "assistant";

export interface Message {
  id?: string;
  role?: MessageRole;
  content: string;
}

interface RecentMessagesProps {
  messages: Message[];
  className?: string;
  input: string | number;
  setInput?: (value: string | number) => void;
  searchHandler?: (
    e:
      | React.MouseEvent<HTMLButtonElement>
      | React.KeyboardEvent<HTMLTextAreaElement>
  ) => void;
}

const RecentMessagesComponent: React.FC<RecentMessagesProps> = ({
  messages,
  className = "",
  input,
  searchHandler,
  setInput,
}) => {
  const dispatch = useDispatch();
  // Get recent user messages only (filter out assistant messages and messages without role)
  const userMessages = messages.filter((msg) => msg.role === "user");

  // Get the last user message
  const lastUserMessage =
    userMessages.length > 0 ? userMessages[userMessages.length - 1] : null;

  const categories = ["Situation", "Document #"];

  const [selectedCategory, setSelectedCategory] = useState<string>("Situation");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    if (selectedCategory !== "Situation") {
      dispatch(setIsDocumentNumberSelected(true));
    }
  }, [selectedCategory, dispatch]);

  // Initialize input with last user message when component mounts or messages change
  useEffect(() => {
    if (lastUserMessage && selectedCategory === "Situation") {
      // Only set if input is currently empty or uninitialized
      if (input === "" || input === 0) {
        setInput?.(lastUserMessage.content);
      }
    }
  }, [lastUserMessage, selectedCategory, input]);

  // This is the handler for selecting handler (start) ======================================================>
  const selectCategoryHandler = (category: string) => {
    setSelectedCategory(category);
    if (category === "Situation" && lastUserMessage) {
      // When switching to Situation, load the last user message
      setInput?.(lastUserMessage.content);
    } else {
      setInput?.(""); // clear input on category change to Document #
    }
    setIsDropdownOpen(false);
  };
  // This is the handler for selecting handler (end) ======================================================>

  return (
    <div className={`${className}`}>
      {/* Input Section */}
      <div className="relative ml-3">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 px-3 py-2 cursor-pointer text-sm text-gray-600 hover:text-gray-800 transition-colors border-r"
        >
          {selectedCategory}
          <ChevronDown className="h-4 w-4" />
        </button>
        {isDropdownOpen && (
          <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            {categories.map((category: string) => (
              <button
                key={category}
                onClick={() => selectCategoryHandler(category)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer first:rounded-t-lg last:rounded-b-lg"
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      <textarea
        placeholder={`${
          selectedCategory !== "Situation"
            ? "Input document number"
            : lastUserMessage
            ? "Edit your last message or type a new one"
            : "e.g., I'm moving away from my hometown to study at university"
        }`}
        value={input}
        onChange={(e) => {
          const value = e.target.value;
          if (selectedCategory === "Situation") {
            setInput?.(value); // allow any string
          } else {
            // Only allow numeric input
            if (/^\d*$/.test(value)) {
              setInput?.(value);
            }
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (e.shiftKey) {
              // Allow Shift+Enter to create new line
              // Let default behavior happen (add new line)
            } else {
              // Enter without Shift submits the form
              e.preventDefault();
              searchHandler?.(e);
            }
          }
        }}
        className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 resize-none overflow-y-auto min-h-[20px] max-h-28 py-6 break-words"
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
          textarea.style.height = Math.min(textarea.scrollHeight, 128) + "px";
          // Scroll to bottom to show latest text
          textarea.scrollTop = textarea.scrollHeight;
        }}
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
          Refresh
        </button>
      </div>
    </div>
  );
};

export default RecentMessagesComponent;
