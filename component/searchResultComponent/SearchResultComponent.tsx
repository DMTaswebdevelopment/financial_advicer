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
    <>
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
          <div className="flex items-center rounded-full border gap-3 border-gray-300 bg-white shadow-sm hover:shadow transition-shadow px-2">
            <Search className="h-6 w-6 text-gray-400 ml-5" />

            <textarea
              placeholder="E.g., How can I build an emergency fund?"
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
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 resize-none overflow-y-auto min-h-[20px] max-h-32 py-6 break-words"
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
      </div>

      <div className="mt-14 flex flex-col items-center w-full pb-20">
        <div
          style={{ position: "absolute", display: "inline-block" }}
          className="left-72 top"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="455"
            height="231"
            viewBox="0 0 455 231"
            fill="none"
          >
            <path
              d="M33.9541 0H421.046C439.798 0 455 15.2215 455 33.9975V150.558C455 169.334 439.798 184.555 421.046 184.555H196.592L165.954 230.27V184.555H33.9541C15.2021 184.555 0 169.334 0 150.558V33.9975C0 15.2215 15.2021 0 33.9541 0Z"
              fill="#1C1B1A"
            />
          </svg>
          <div className="absolute items-center top-5 text-lg md:text-2xl font-playfair text-[#FFF3E5] left-5 right-5 justify-center">
            “My manufacturing client bought $500,000 in equipment. Should they
            use diminishing value or prime cost method for better tax
            benefits??”
          </div>
        </div>

        <div
          style={{ position: "absolute", display: "inline-block" }}
          className="right-52 top"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="542"
            height="231"
            viewBox="0 0 542 231"
            fill="none"
          >
            <path
              d="M507.546 0L33.9541 0C15.2021 0 0 15.2215 0 33.9975V150.558C0 169.334 15.2021 184.555 33.9541 184.555H451.676L482.315 230.27V184.555H507.546C526.298 184.555 541.5 169.334 541.5 150.558V33.9975C541.5 15.2215 526.298 0 507.546 0Z"
              fill="#1C1B1A"
            />
          </svg>
          <div className="absolute items-center top-5 text-lg md:text-2xl font-playfair text-[#FFF3E5] left-5 right-5 justify-center">
            “We're buying a $650,000 home and heard about mortgage interest
            deductions for investment properties. What are the actual tax
            benefits of property ownership?”
          </div>
        </div>
        <div className="w-full relative">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-xl md:text-4xl font-playfair font-light text-[#1C1B1A] mb-4">
              Not sure what to ask?
            </h1>
            <p className="text-black text-[15px]  max-w-2xl mx-auto leading-relaxed font-sans">
              Use these example questions as inspiration!
              <br />
              Wherever you are in life, we&apos;re here to help.
            </p>
          </div>

          {/* Speech Bubbles */}
          <div className="flex w-full ont-playfair">
            <div
              style={{ position: "absolute", display: "inline-block" }}
              className="left-14 top-72"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="455"
                height="231"
                viewBox="0 0 455 231"
                fill="none"
              >
                <path
                  d="M33.9541 0H421.046C439.798 0 455 15.2215 455 33.9975V150.558C455 169.334 439.798 184.555 421.046 184.555H196.592L165.954 230.27V184.555H33.9541C15.2021 184.555 0 169.334 0 150.558V33.9975C0 15.2215 15.2021 0 33.9541 0Z"
                  fill="#1C1B1A"
                />
              </svg>
              <div className="absolute items-center top-5 text-lg md:text-2xl font-playfair text-[#FFF3E5] left-5 right-5 justify-center">
                “My landscaping business has great summer revenue but struggles
                in winter. What financial strategies can help manage seasonal
                cash flow?”
              </div>
            </div>

            <div
              style={{ position: "absolute", display: "inline-block" }}
              className="left-[33rem] top-96"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="455"
                height="231"
                viewBox="0 0 455 231"
                fill="none"
              >
                <path
                  d="M33.9541 0H421.046C439.798 0 455 15.2215 455 33.9975V150.558C455 169.334 439.798 184.555 421.046 184.555H196.592L165.954 230.27V184.555H33.9541C15.2021 184.555 0 169.334 0 150.558V33.9975C0 15.2215 15.2021 0 33.9541 0Z"
                  fill="#1C1B1A"
                />
              </svg>
              <div className="absolute items-center top-5 text-lg md:text-2xl font-playfair text-[#FFF3E5] left-5 right-5 justify-center">
                “We're expanding our consulting firm and considering staying as
                a partnership or incorporating as a company. What are the tax
                implications of each structure?”
              </div>
            </div>

            {/* right section */}
            <div
              style={{ position: "absolute", display: "inline-block" }}
              className="right-[33.5rem] top-96"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="332"
                height="327"
                viewBox="0 0 332 327"
                fill="none"
              >
                <path
                  d="M33.9541 0H297.546C316.298 0 331.5 15.2215 331.5 33.9975V247.003C331.5 265.779 316.298 281 297.546 281H180.547L149.908 326.715V281H33.9541C15.2021 281 -3.05176e-05 265.779 -3.05176e-05 247.003V33.9975C-3.05176e-05 15.2215 15.2021 0 33.9541 0Z"
                  fill="#1C1B1A"
                />
              </svg>
              <div className="absolute items-center top-5 text-lg md:text-2xl font-playfair text-[#FFF3E5] left-5 right-5 justify-center">
                “My retail client needs to choose between FIFO and weighted
                average cost methods. How will each affect their taxes with
                current inflation?”
              </div>
            </div>

            <div
              style={{ position: "absolute", display: "inline-block" }}
              className="right-8 top-72"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="481"
                height="231"
                viewBox="0 0 481 231"
                fill="none"
              >
                <path
                  d="M446.5 0L33.9541 0C15.2021 0 -7.62939e-06 15.2215 -7.62939e-06 33.9975V150.558C-7.62939e-06 169.334 15.2021 184.555 33.9541 184.555H390.63L421.268 230.27V184.555H446.5C465.252 184.555 480.454 169.334 480.454 150.558V33.9975C480.454 15.2215 465.252 0 446.5 0Z"
                  fill="#1C1B1A"
                />
              </svg>
              <div className="absolute items-center top-5 text-lg md:text-2xl font-playfair text-[#FFF3E5] left-5 right-5 justify-center">
                “I'm 45 earning $85,000 and confused about salary sacrificing vs
                after-tax super contributions. Which strategy is better for my
                situation?”
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchResultComponent;
