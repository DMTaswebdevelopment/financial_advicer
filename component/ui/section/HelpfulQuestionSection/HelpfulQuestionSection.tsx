"use client";

import React from "react";

const HelpfulQuestionSection: React.FC = () => {
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
    <div
      className={`relative w-full  lg:w-[57%] items-center justify-center transform 2xl:-translate-y-44 lg:pb-28 xl:pb-20 h-[30rem] max-w-4xl mx-auto`}
    >
      <div className="relative flex justify-center items-center">
        <div className="w-full text-center">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-2xl 2xl:text-5xl font-playfair font-light text-[#1C1B1A] mb-5">
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
                  <p className="text-xs md:text-base 2xl:text-2xl font-normal font-playfair">
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
  );
};

export default HelpfulQuestionSection;
