"use client";

import { setIsMessageSend, setTrimMessages } from "@/redux/storageSlice";
import { Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { FormEvent, useState } from "react";
import { useDispatch } from "react-redux";

const Herosection = () => {
  const dispatch = useDispatch();
  const route = useRouter();

  const [input, setInput] = useState<string>("");

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();

    // Set flag to indicate we're coming from hero section
    localStorage.setItem("cameFromHero", "true");
    dispatch(setIsMessageSend(true));
    dispatch(setTrimMessages(input));
    route.push("/searchresult");
  };

  return (
    <>
      <div className="relative overflow-hidden flex flex-col items-center md:items-start  md:flex-row w-full h-screen px-7 md:px-0">
        {/* Left Side - Diamond Images (21.7% of screen) */}
        <div className="w-[21.7%] relative pointer-events-none flex-shrink-0 hidden md:block">
          <div className="transform top-20 absolute">
            <Image
              src="https://res.cloudinary.com/dmz8tsndt/image/upload/v1748935775/Group_24_yynujk.png"
              alt="Image Right"
              className=""
              width={700}
              height={700}
            />
          </div>
        </div>

        {/* Center Content (56.6% of screen) */}
        <div className=" w-full md:w-[56.6%] relative h-[55rem] z-10 flex flex-col items-center justify-center space-y-10 ">
          <hr className="bg-[#1C1B1A] w-full 2xl:w-[60rem] h-[3px] absolute top-24 lg:top-32 mx-32" />

          <div className="text-center w-full mx-auto">
            {/* Main Heading */}
            <h1 className="text-6xl md:text-7xl font-playfair text-black mb-10 tracking-tight">
              Financial advice at your fingertips.
            </h1>

            {/* Subheading */}
            <h2 className="text-xl md:text-4xl text-black  font-normal font-playfair mb-12 tracking-tight">
              What can we help you with today?
            </h2>

            {/* Search Input */}
            <div className="relative max-w-4xl mx-auto mb-8">
              <div className="flex items-center bg-white rounded-full shadow-lg border border-gray-200 px-6 py-4">
                <Search className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="E.g., How can I build an emergency fund?"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch(e);
                  }}
                  className="flex-1 text-gray-600 placeholder-gray-400 outline-none text-sm"
                />
                <button
                  onClick={handleSearch}
                  className="ml-3 bg-gray-800 text-white rounded-full p-2 hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <Search className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Helper Text */}
            <p className="text-[#1C1B1A] lg:text-[15px]  max-w-md mx-auto leading-relaxed">
              Describe your situation in the field above and we'll search
              <br />
              for some information to help you right away!
            </p>
          </div>

          <hr className="bg-[#1C1B1A] w-full 2xl:w-[60rem] h-[3px] mt-10" />
        </div>

        {/* Right Side - Diamond Images (21.7% of screen) */}
        <div className="w-[21.7%] relative pointer-events-none flex-shrink-0 hidden md:block">
          <div className="transform top-20 absolute">
            <Image
              src="https://res.cloudinary.com/dmz8tsndt/image/upload/v1748936050/Group_aglsut.png"
              alt="Image Left"
              width={700}
              height={700}
            />
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-center p-4 transform -translate-y-40">
        <div className="max-w-4xl w-full ">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-xl md:text-4xl font-playfair font-light text-[#1C1B1A] mb-4">
              Not sure what to ask?
            </h1>
            <p className="text-black text-[15px]  max-w-2xl mx-auto leading-relaxed font-sans">
              Use these example questions as inspiration!
              <br />
              Wherever you are in life, we’re here to help.
            </p>
          </div>

          {/* Speech Bubbles */}
          <div className="flex flex-col lg:flex-row gap-5 md:gap-6 items-center justify-center font-playfair">
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
              className="transform lg:translate-y-14"
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
                "My friend and I are starting a new business venture. Any words
                of advice?"
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Herosection;
