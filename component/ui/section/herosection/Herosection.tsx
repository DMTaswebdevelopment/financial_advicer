"use client";

import SearchInputComponent from "@/components/templates/SearchInputComponent/SearchInputComponent";
// import DropdownMenu from "@/components/templates/DropDownMenuComponent/DropDownMenuComponent";
import { setIsMessageSend, setTrimMessages } from "@/redux/storageSlice";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { FormEvent, useEffect, useState } from "react";
import { useDispatch } from "react-redux";

const Herosection = () => {
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const dispatch = useDispatch();
  const route = useRouter();

  const [input, setInput] = useState<string | number>("");

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const trimmedInput = typeof input === "string" ? input : input.toString();
    // Set flag to indicate we're coming from hero section
    localStorage.setItem("cameFromHero", "true");
    dispatch(setIsMessageSend(true));
    dispatch(setTrimMessages(trimmedInput));
    route.push("/searchresult");
  };

  return (
    <>
      <div className="relative overflow-hidden flex flex-col items-center md:items-start  md:flex-row w-full max-h-screen px-7 lg:px-0">
        {/* Left Side - Diamond Images (21.7% of screen) */}
        <div className="w-[21.7%] relative pointer-events-none flex-shrink-0 hidden lg:block">
          <div className="transform top-20 absolute">
            <Image
              src="https://res.cloudinary.com/dmz8tsndt/image/upload/e_sharpen:100/leftImage_ywd3lt"
              alt="Image Right"
              className="w-full h-full"
              width={2000}
              height={2000}
            />
          </div>
        </div>

        {/* Center Content (56.6% of screen) */}
        <div className=" w-full 2xl:px-0 lg:px-10 2xl:w-[57%] relative lg:h-[35rem] xl:h-[40rem] 2xl:h-[55rem] z-10 flex flex-col mt-10 lg:mt-0 lg:justify-center gap-10 ">
          {/* <hr className="bg-[#1C1B1A] w-full 2xl:w-[60rem] h-[3px] absolute top-20 lg:top-5 xl:top-16 2xl:top-32 2xl:mx-32" /> */}
          <hr className="bg-[#1C1B1A] w-full h-[3px] transform 2xl:-translate-y-28 max-w-4xl mx-auto" />
          <div
            className="text-center w-full transform 2xl:-translate-y-20"
            suppressHydrationWarning={true}
            key={isHydrated ? "hydrated" : "server"}
          >
            {/* Main Heading */}
            <h1 className="text-4xl xl:text-5xl 2xl:text-6xl font-playfair text-black mb-8  xl:mb-10 tracking-tight">
              Financial Information at your fingertips.
            </h1>

            {/* Subheading */}
            <h2 className="text-2xl 2xl:text-4xl text-black  font-normal font-playfair mb-6 2xl:mb-12 tracking-tight">
              Wherever you are in life, we're here to help!
            </h2>

            {/* Search Input */}
            <div className="relative max-w-4xl mx-auto mb-8">
              <SearchInputComponent
                className="flex items-center rounded-full border gap-3 border-gray-300 bg-white shadow-sm hover:shadow transition-shadow px-2"
                input={input}
                setInput={setInput}
                searchHandler={(e) => handleSearch(e)}
              />
            </div>

            {/* Helper Text */}
            <p className="text-[#1C1B1A] lg:text-[15px]  max-w-md mx-auto leading-relaxed">
              Describe your situation in the field above and we'll search
              <br />
              for some information to help you right away!
            </p>

            <hr className="bg-[#1C1B1A] w-full h-[3px] max-w-4xl mx-auto my-10 2xl:mt-20" />
          </div>
        </div>

        {/* Right Side - Diamond Images (21.7% of screen) */}
        <div className="w-[21.7%] relative pointer-events-none flex-shrink-0 hidden lg:block">
          <div className="transform top-20 absolute">
            <Image
              src="https://res.cloudinary.com/dmz8tsndt/image/upload/v1756248916/rightImage_dwu1jt.png"
              alt="Image Left"
              width={2000}
              height={2000}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Herosection;
