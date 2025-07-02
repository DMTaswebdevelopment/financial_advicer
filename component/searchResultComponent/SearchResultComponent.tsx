import React from "react";
import { Search, Send } from "lucide-react";

interface SearchResultComponentProps {
  input: string;
  setInput: (value: string) => void;
  searchHandler: (e: React.FormEvent | React.KeyboardEvent) => void;
}

const SearchResultComponent: React.FC<SearchResultComponentProps> = ({
  input,
  setInput,
  searchHandler,
}) => {
  return (
    <div className="flex max-w-5xl flex-col items-center">
      <div className="text-center">
        <h1 className="text-xl md:text-4xl font-normal tracking-tight font-playfair text-balance text-gray-900">
          Ask new question
        </h1>
        <p className="lg:text-[15px] leading-normal text-black mx-auto font-sans mt-8">
          Get accurate answers to your complex financial questions with our
          AI-powered advisory tool.
        </p>
      </div>

      <div className="relative mt-10 w-full">
        <div className="flex items-center rounded-full border border-gray-300 bg-white shadow-sm hover:shadow transition-shadow px-2">
          <Search className="h-6 w-6 text-gray-400 ml-3" />
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
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-14 flex flex-col items-center">
        <h2 className="font-playfair leading-normal text-xl md:text-4xl">
          Not sure what to ask?
        </h2>
        <p className="mt-5 font-sans text-[15px] text-center">
          Use the example questions as inspiration! <br />
          Wherever you are in life, we&apos;re here to help.
        </p>

        {/* Speech Bubbles */}
        <div className="mt-16 flex flex-col md:flex-row flex-wrap gap-5 md:gap-6 items-start justify-center font-playfair">
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
              "I'm planning to rent out my investment property. What do I need
              to know?"
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
              "How do I get started with doing my own tax return?"
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
              "My friend and I are starting a new business venture. Any words of
              advice?"
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResultComponent;
