"use client";

import React from "react";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="relative py-8 px-4 sm:py-10 sm:px-6 lg:py-12 lg:px-20 border-t border-gray-200 bg-black ">
      <div className="w-full max-w-8xl flex flex-col justify-center items-center">
        {/* Brand Section */}
        <div className="mb-4 lg:mb-8">
          <div className="flex items-center mb-2 justify-center">
            <Image
              alt="logo"
              src="https://res.cloudinary.com/dmz8tsndt/image/upload/v1755063276/BAKR_New_Logo-02_xe76ht.svg"
              width={20}
              height={20}
              className="w-60 h-40"
            />
          </div>
        </div>
      </div>

      {/* Copyright Section */}
      <div className="mt-8 lg:mt-12 pt-6 lg:pt-8 border-t border-gray-200 w-full mx-auto items-center">
        <p className="text-gray-300 text-xs sm:text-sm text-center">
          © Business & Accountants Knowledge Resource Pty Ltd
        </p>
      </div>
    </footer>
  );
};

export default Footer;
