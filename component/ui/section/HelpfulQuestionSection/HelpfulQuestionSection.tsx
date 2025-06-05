"use client";

import React from "react";

const HelpfulQuestionSection: React.FC = () => {
  return (
    <div className="relative flex items-center justify-center p-4 lg:p-10">
      <div className="max-w-4xl w-full mb-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-playfair font-light text-[#1C1B1A] mb-4">
            What can we help you with today?
          </h1>
          <p className="text-gray-600 text-sm md:text-lg max-w-2xl mx-auto leading-relaxed font-sans">
            Describe your situation in the field above and we'll search
            <br />
            for some information to help you right away!
          </p>
        </div>

        {/* Speech Bubbles */}
        <div className="flex flex-col md:flex-row flex-wrap gap-5 md:gap-6 items-start justify-center font-playfair">
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

export default HelpfulQuestionSection;
