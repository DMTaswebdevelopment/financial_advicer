"use client";

import React, { useEffect, useState } from "react";

const HelpfulQuestionSection: React.FC = () => {
  const [windowWidth, setWindowWidth] = useState<number>(0);

  useEffect(() => {
    // Function to update state
    const handleResize = () => setWindowWidth(window.screen.width);

    // Set initial width
    handleResize();

    // Listen to resize
    window.addEventListener("resize", handleResize);

    // Clean up listener
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const biggerScreen = windowWidth >= 1884;

  return (
    <div
      className={`w-full items-center justify-center transform 2xl:-translate-y-20 lg:pb-28 xl:pb-20 hidden lg:block  ${
        biggerScreen ? "max-w-[1884px] mx-auto" : ""
      }`}
    >
      <div className="relative flex justify-center items-center">
        <div
          className={`transform  ${
            biggerScreen ? "-translate-y-1" : "-translate-y-10"
          }`}
        >
          <div
            className={`speechBubble text-white ${
              biggerScreen
                ? "w-[455px] text-[30px] tracking-[-1.2px] "
                : "lg:w-[239.363px] 2xl:w-[479px] 2xl:text-2xl xl:text-[18px] xl:w-[395px] tracking-[-0.72px]"
            }  h-auto  font-playfair rounded-4xl font-normal not-italic `}
          >
            “My manufacturing client bought $500,000 in equipment. Should they
            use diminishing value or prime cost method for better tax benefits?”
          </div>
        </div>
        <div className="lg:w-[24rem] xl:w-[17rem] 2xl:w-96">
          {/* Header */}
          <div className="text-center mb-12">
            <h3 className="text-2xl 2xl:text-4xl font-playfair font-light text-[#1C1B1A] mb-4">
              Not sure how to describe your situation?
            </h3>
            <p className="text-black 2xl:text-[15px] xl:text-[12px]  max-w-2xl mx-auto leading-relaxed font-sans">
              Use these sample as inspiration!
            </p>
          </div>
        </div>
        <div
          className={`transform  ${
            biggerScreen ? "-translate-y-1" : "-translate-y-5"
          }`}
        >
          <div
            className={`speechBubble1 text-white h-auto ${
              biggerScreen
                ? " w-[541.1px] text-[30px]"
                : "lg:w-[284.869px] xl:w-[348.628px] xl:text-[18px] 2xl:text-[24px] 2xl:w-[478px] "
            } font-playfair rounded-4xl   font-normal not-italic tracking-[-1.2px]`}
          >
            “We're buying a $650,000 home and heard about mortgage interest
            deductions for investment properties. What are the actual tax
            benefits of property ownership?”
          </div>
        </div>
      </div>
      <div className="w-full justify-center items-center">
        <div
          className={`flex justify-between ${
            biggerScreen
              ? " pt-16 px-7"
              : "lg:pt-5 xl:pt-10 lg:px-4 xl:px-10 lg:max-w-[1024px] xl:max-w-[1280px] 2xl:max-w-[1536px]"
          } mx-auto`}
        >
          <div className="flex">
            <div
              className={`speechBubble2 shrink-0 text-white ${
                biggerScreen
                  ? " w-[455px]  text-[30px] h-[230px]"
                  : "lg:w-[250px] lg:text-base  xl:text-lg xl:w-[307.101px] xl:h-[148px] 2xl:text-[24px] 2xl:w-[380px] 2xl:h-[230.27px]  "
              } font-playfair rounded-4xl   font-normal not-italic tracking-[-1.2px]`}
            >
              “My landscaping business has great summer revenue but struggles in
              winter. What financial strategies can help manage seasonal cash
              flow?”
            </div>

            {biggerScreen && (
              <div
                className={` transform ${
                  biggerScreen
                    ? "translate-x-9 translate-y-16"
                    : "translate-x-9 translate-y-10"
                } `}
              >
                <div className="speechBubble1 text-white h-auto w-[431.954px] font-playfair rounded-4xl  text-[30px] font-normal not-italic tracking-[-1.2px]">
                  “We're expanding our consulting firm and considering staying
                  as a partnership or incorporating as a company. What are the
                  tax implications of each structure?”
                </div>
              </div>
            )}

            {windowWidth < 1279 && (
              <div className=" transform translate-x-3 translate-y-10">
                <div
                  className={`speechBubble4 text-white md:w-[227.239px] font-playfair rounded-4xl  text-base font-normal not-italic tracking-[-1.2px]`}
                >
                  “We're expanding our consulting firm and considering staying
                  as a partnership or incorporating as a company. What are the
                  tax implications of each structure?”
                </div>
              </div>
            )}
          </div>

          <div className="flex relative">
            {biggerScreen && (
              <div
                className={`transform ${
                  biggerScreen
                    ? " -translate-x-9 translate-y-16"
                    : " -translate-x-9 translate-y-10"
                } `}
              >
                <div className="speechBubble2 text-white h-auto w-[331.5px] font-playfair rounded-4xl  text-[30px] font-normal not-italic tracking-[-1.2px]">
                  “My retail client needs to choose between FIFO and weighted
                  average cost methods. How will each affect their taxes with
                  current inflation?”
                </div>
              </div>
            )}

            {windowWidth < 1279 && (
              <div
                className={`transform ${
                  biggerScreen
                    ? " -translate-x-9 translate-y-16"
                    : " -translate-x-3 translate-y-10"
                } `}
              >
                <div
                  className={`speechBubble5 text-white md:w-[227.239px] font-playfair rounded-4xl  text-base font-normal not-italic tracking-[-1.2px]`}
                >
                  “My retail client needs to choose between FIFO and weighted
                  average cost methods. How will each affect their taxes with
                  current inflation?”
                </div>
              </div>
            )}
            <div
              className={`speechBubble1 text-white  ${
                biggerScreen
                  ? " w-[480px] text-[30px] h-[230.27px]"
                  : "lg:w-[252.754px] xl:w-[309.325px] 2xl:w-[380px] 2xl:h-[230.27px]  xl:text-xl 2xl:text-[24px] xl:h-[148.252px]"
              } font-playfair rounded-4xl font-normal not-italic tracking-[-1.2px]`}
            >
              “I'm 45 earning $85,000 and confused about salary sacrificing vs
              after-tax super contributions. Which strategy is better for my
              situation?”
            </div>
          </div>
        </div>
      </div>
      {!biggerScreen && windowWidth >= 1280 && (
        <div className=" flex justify-center w-full">
          <div className=" max-w-7xl flex justify-between gap-24">
            <div className=" transform translate-x-9 translate-y-5">
              <div
                className={`speechBubble1 text-white xl:h-[189.098px] 2xl:h-[227px] xl:w-[278.1px] 2xl:w-[375px] font-playfair rounded-4xl  xl:text-xl 2xl:text-[24px] font-normal not-italic tracking-[-1.2px]`}
              >
                “We're expanding our consulting firm and considering staying as
                a partnership or incorporating as a company. What are the tax
                implications of each structure?”
              </div>
            </div>

            <div className="transform  -translate-x-9 translate-y-5">
              <div className="speechBubble3 text-white xl:h-[210.345px] xl:w-[213.426px] 2xl:h-[237px] 2xl:w-[307px] font-playfair rounded-4xl xl:text-xl 2xl:text-[24px] font-normal not-italic tracking-[-1.2px]">
                “My retail client needs to choose between FIFO and weighted
                average cost methods. How will each affect their taxes with
                current inflation?”
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpfulQuestionSection;
