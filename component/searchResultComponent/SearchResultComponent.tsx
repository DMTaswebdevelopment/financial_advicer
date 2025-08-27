"use client";

import React from "react";

import SearchInputComponent from "@/components/templates/SearchInputComponent/SearchInputComponent";

interface SearchResultComponentProps {
  input: string | number;
  setInput?: (value: string | number) => void;
  searchHandler: (e: React.FormEvent | React.KeyboardEvent) => void;
}

const SearchResultComponent: React.FC<SearchResultComponentProps> = ({
  input,
  setInput,
  searchHandler,
}) => {
  interface HelpfulQuestionProps {
    id: number;
    text_one: string;
    text_two: string;
  }

  const helpfulQuestions: HelpfulQuestionProps[] = [
    {
      id: 1,
      text_one: "My manufacturing client bought $500,000 in equipment.",
      text_two:
        "Should they use diminishing value or prime cost method for better tax benefits?",
    },
    {
      id: 2,
      text_one:
        "My landscaping business has great summer revenue but struggles in winter. ",
      text_two: "What financial strategies can help manage seasonal cash flow?",
    },
    {
      id: 3,
      text_one:
        "We're expanding our consulting firm and considering staying as a partnership or  ",
      text_two:
        "incorporating as a company. What are the tax implications of each structure?",
    },
  ];

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
          <SearchInputComponent
            className="flex items-center rounded-full justify-between border border-gray-300 bg-white shadow-sm hover:shadow transition-shadow px-2"
            input={input}
            setInput={setInput}
            searchHandler={(e) => searchHandler(e)}
          />
        </div>
      </div>

      <div className="mt-14 flex flex-col items-center w-full pb-20">
        <div className="relative flex justify-center items-center">
          <div className="w-full text-center">
            {/* Header */}
            <div className="text-center mb-12">
              <h2 className="text-xl 2xl:text-4xl font-playfair font-light text-[#1C1B1A] mb-5">
                Not sure how to describe your situation?
              </h2>
              <p className="text-black xl:text-2xl  max-w-2xl mx-auto leading-relaxed font-sans">
                Use these sample as inspiration!
              </p>
            </div>

            <div className="2xl:mt-16 relative">
              <div className="flex flex-col gap-7 mx-7">
                {helpfulQuestions.map((helpfulQuestion) => (
                  <div key={helpfulQuestion.id}>
                    <p className="text-xs md:text-base 2xl:text-xl font-normal font-playfair">
                      {helpfulQuestion.text_one}
                      <br />
                      {helpfulQuestion.text_two}
                    </p>
                    <hr className="bg-[#1C1B1A] w-full h-[3px] mt-5 2xl:mt-10 2xl:max-w-6xl mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchResultComponent;
