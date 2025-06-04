"use client";

import { setTrimMessages } from "@/redux/storageSlice";
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

    dispatch(setTrimMessages(input));
    route.push("/searchresult");
  };

  return (
    <div className="relative overflow-hidden flex w-full h-screen">
      {/* Left Side - Diamond Images (21.7% of screen) */}
      <div className="w-[21.7%] relative pointer-events-none flex-shrink-0">
        <div className="transform top-20 absolute">
          <Image
            src="https://res.cloudinary.com/dmz8tsndt/image/upload/v1748935775/Group_24_yynujk.png"
            alt="Image Right"
            width={700}
            height={700}
          />
        </div>
      </div>

      {/* Center Content (56.6% of screen) */}
      <div className="w-[56.6%] relative h-[55rem] z-10 flex flex-col items-center justify-center space-y-10">
        <hr className="bg-[#1C1B1A] w-[60rem] h-[3px] absolute top-32" />

        <div className="text-center w-full mx-auto">
          {/* Main Heading */}
          <h1 className="text-6xl md:text-7xl font-playfair text-gray-800 mb-10 tracking-tight">
            Financial advice at your fingertips.
          </h1>

          {/* Subheading */}
          <h2 className="text-xl md:text-4xl text-gray-700 font-normal font-playfair mb-12 tracking-wide">
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
          <p className="text-[#1C1B1A] text-sm max-w-md mx-auto leading-relaxed">
            Describe your situation in the field above and we'll search
            <br />
            for some information to help you right away!
          </p>
        </div>

        {/* Decorative Line */}
        <hr className="bg-[#1C1B1A] w-[60rem] h-[3px] mt-10" />
      </div>

      {/* Right Side - Diamond Images (21.7% of screen) */}
      <div className="w-[21.7%] relative pointer-events-none flex-shrink-0">
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
  );
};

export default Herosection;
