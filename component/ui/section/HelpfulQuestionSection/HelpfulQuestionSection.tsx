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
      text_one:
        "My manufacturing client has just purchased $500,000 worth of new production equipment. We're weighing up whether to use the diminishing value or prime cost depreciation method to maximise their tax benefits while maintaining accurate financial reporting.",
      text_two:
        "We're weighing up whether to use the diminishing value or prime cost depreciation method to maximise their tax benefits while maintaining accurate financial reporting.",
    },
    {
      id: 2,
      text_one:
        "My landscaping business generates strong revenue during spring and summer months but I face significant cash flow constraints during winter when work is scarce. I need strategies to smooth out income fluctuations and maintain operations year-round.",
      text_two:
        "I need strategies to smooth out income fluctuations and maintain operations year-round.",
    },
    {
      id: 3,
      text_one:
        "We're purchasing our first home for $650,000 and have heard conflicting information about tax benefits related to property ownership. We want to understand the actual tax implications, including potential deductions and whether there are advantages to treating the property as an investment.",
      text_two:
        "We want to understand the actual tax implications, including potential deductions and whether there are advantages to treating the property as an investment.",
    },
  ];

  return (
    <div
      className={`relative w-full  lg:w-[58%] items-center justify-center transform 2xl:-translate-y-44 lg:pb-28 xl:pb-20 h-[40rem] max-w-4xl mx-auto`}
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
                    {/* <br />
                    {helpfulQuestion.text_two} */}
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
