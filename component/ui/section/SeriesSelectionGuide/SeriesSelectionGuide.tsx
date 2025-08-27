"use client";

import React from "react";

const SeriesSelectionGuide = () => {
  return (
    <div className="bg-white flex text-center flex-col items-center justify-between">
      <div className="py-20 px-5">
        <h2 className="font-playfair text-5xl lg:text-6xl font-normal ">
          Series Selection Guide
        </h2>

        <div className="mx-auto mt-10 font-sans text-stone-900 text-sm lg:text-[15px] text-start w-full font-normal  lg:max-w-4xl ">
          <div className="font-semibold">
            <span>
              We offer 5 distinct series, each designed for different learning
              needs and experience levels. To help determine which is best for
              you, please read the descriptions below.
            </span>
          </div>

          <div className="mt-5">
            <h4 className="font-bold leading-10">Missing Lessons</h4>
            <p className="">
              Perfect for beginners and anyone wanting to start fresh. These
              guides assume you're completely new to the topic and break
              everything down into easy-to-understand concepts. No matter your
              age, if you're just getting started with financial learning, this
              is your starting point. As part of our commitment to financial
              education, our Missing Lessons series is intended to remain free.
            </p>
          </div>

          <div className="mt-5">
            <h4 className="font-bold leading-10">Checklist</h4>
            <p className="">
              Want to take action now? These straightforward lists give you
              practical steps you can implement immediately. Keep in mind these
              are general recommendations that may need adjusting for your
              personal circumstances.
            </p>
          </div>

          <div className="mt-5">
            <h4 className="font-bold leading-10">Detailed Knowledge</h4>
            <p className="">
              Ready for the full picture? These comprehensive resources take you
              beyond the basics with thorough explanations and analysis. You'll
              get the most out of these if you already understand fundamental
              financial terms and concepts.
            </p>
          </div>

          <div className="mt-5">
            <h4 className="font-bold leading-10">Advisor Essentials</h4>
            <p className="">
              Designed specifically for financial and accounting professionals
              who need technical depth, tax implications, and legal
              considerations. While anyone can access these, they require solid
              financial expertise to fully grasp the content.
            </p>
          </div>

          <div className="mt-5">
            <h4 className="font-bold leading-10">Financial Fluency</h4>
            <p className="">
              Created for advisors to share with their clients. These materials
              translate complex concepts into client-friendly language, making
              them ideal reference materials after advisor consultations.
            </p>
          </div>

          <div className="mt-5">
            <h4 className="font-bold leading-10">
              Which series should you choose?
            </h4>
            <p className="">
              Start where you feel comfortable. If you're unsure about your
              knowledge level, begin with Missing Lessons and work your way up.
              You can always jump between series based on what you need to
              accomplish.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeriesSelectionGuide;
