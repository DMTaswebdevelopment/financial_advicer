import { setIsDocumentNumberSelected } from "@/redux/storageSlice";
import { ChevronDown, Send } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

interface SearchInputProps {
  input: string | number;
  setInput?: (value: string | number) => void;
  className: string;
  searchHandler?: (
    e:
      | React.MouseEvent<HTMLButtonElement>
      | React.KeyboardEvent<HTMLTextAreaElement>
  ) => void;
}
const SearchInputComponent: React.FC<SearchInputProps> = ({
  input,
  setInput,
  searchHandler,
  className,
}) => {
  const categories = ["Situation", "Document #"];
  const dispatch = useDispatch();
  const [selectedCategory, setSelectedCategory] = useState<string>("Situation");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    if (selectedCategory !== "Situation") {
      dispatch(setIsDocumentNumberSelected(true));
    }
  }, [selectedCategory, dispatch]);

  // This is the handler for selecting handler (start) ======================================================>
  const selectCategoryHandler = (category: string) => {
    setSelectedCategory(category);
    setInput?.(""); // clear input on category change
    setIsDropdownOpen(false);
  };
  // This is the handler for selecting handler (end) ======================================================>

  return (
    <div className={`${className}`}>
      {/* Dropdown */}
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
        // disabled={input === "" || input.toString().trim() === ""}
        placeholder={`${
          selectedCategory !== "Situation"
            ? "Input document number"
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
        className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 resize-none overflow-y-auto min-h-[20px] max-h-32 py-6 px-2 break-words"
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
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default SearchInputComponent;
