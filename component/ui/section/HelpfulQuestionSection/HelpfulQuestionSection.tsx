"use client";

import React from "react";

const HelpfulQuestionSection: React.FC = () => {
  return (
    <div className="relative flex justify-center p-4 h-[642px] transform -translate-y-32">
      <div
        style={{ position: "absolute", display: "inline-block" }}
        className="left-72 top"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="455"
          height="231"
          viewBox="0 0 455 231"
          fill="none"
        >
          <path
            d="M33.9541 0H421.046C439.798 0 455 15.2215 455 33.9975V150.558C455 169.334 439.798 184.555 421.046 184.555H196.592L165.954 230.27V184.555H33.9541C15.2021 184.555 0 169.334 0 150.558V33.9975C0 15.2215 15.2021 0 33.9541 0Z"
            fill="#1C1B1A"
          />
        </svg>
        <div className="absolute items-center top-5 text-lg md:text-2xl font-playfair text-[#FFF3E5] left-5 right-5 justify-center">
          “My manufacturing client bought $500,000 in equipment. Should they use
          diminishing value or prime cost method for better tax benefits??”
        </div>
      </div>

      <div
        style={{ position: "absolute", display: "inline-block" }}
        className="right-52 top"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="542"
          height="231"
          viewBox="0 0 542 231"
          fill="none"
        >
          <path
            d="M507.546 0L33.9541 0C15.2021 0 0 15.2215 0 33.9975V150.558C0 169.334 15.2021 184.555 33.9541 184.555H451.676L482.315 230.27V184.555H507.546C526.298 184.555 541.5 169.334 541.5 150.558V33.9975C541.5 15.2215 526.298 0 507.546 0Z"
            fill="#1C1B1A"
          />
        </svg>
        <div className="absolute items-center top-10 text-lg md:text-2xl font-playfair text-[#FFF3E5] left-5 right-5 justify-center">
          “My manufacturing client bought $500,000 in equipment. Should they use
          diminishing value or prime cost method for better tax benefits?”
        </div>
      </div>
      <div className="max-w-4xl w-full ">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-xl md:text-4xl font-playfair font-light text-[#1C1B1A] mb-4">
            Not sure what to ask?
          </h1>
          <p className="text-black text-[15px]  max-w-2xl mx-auto leading-relaxed font-sans">
            Use these example questions as inspiration!
            <br />
            Wherever you are in life, we&apos;re here to help.
          </p>
        </div>

        {/* Speech Bubbles */}
        <div className="flex flex-col w-full lg:flex-row gap-5 md:gap-6 items-center justify-center font-playfair">
          <div
            style={{ position: "absolute", display: "inline-block" }}
            className="left-14 top-72"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="455"
              height="231"
              viewBox="0 0 455 231"
              fill="none"
            >
              <path
                d="M33.9541 0H421.046C439.798 0 455 15.2215 455 33.9975V150.558C455 169.334 439.798 184.555 421.046 184.555H196.592L165.954 230.27V184.555H33.9541C15.2021 184.555 0 169.334 0 150.558V33.9975C0 15.2215 15.2021 0 33.9541 0Z"
                fill="#1C1B1A"
              />
            </svg>
            <div className="absolute items-center top-5 text-lg md:text-2xl font-playfair text-[#FFF3E5] left-5 right-5 justify-center">
              “My landscaping business has great summer revenue but struggles in
              winter. What financial strategies can help manage seasonal cash
              flow?”
            </div>
          </div>

          <div
            style={{ position: "absolute", display: "inline-block" }}
            className="left-[33rem] top-96"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="455"
              height="231"
              viewBox="0 0 455 231"
              fill="none"
            >
              <path
                d="M33.9541 0H421.046C439.798 0 455 15.2215 455 33.9975V150.558C455 169.334 439.798 184.555 421.046 184.555H196.592L165.954 230.27V184.555H33.9541C15.2021 184.555 0 169.334 0 150.558V33.9975C0 15.2215 15.2021 0 33.9541 0Z"
                fill="#1C1B1A"
              />
            </svg>
            <div className="absolute items-center top-5 text-lg md:text-2xl font-playfair text-[#FFF3E5] left-5 right-5 justify-center">
              “We're expanding our consulting firm and considering staying as a
              partnership or incorporating as a company. What are the tax
              implications of each structure?”
            </div>
          </div>

          {/* right section */}
          <div
            style={{ position: "absolute", display: "inline-block" }}
            className="right-[35rem] top-96"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="332"
              height="327"
              viewBox="0 0 332 327"
              fill="none"
            >
              <path
                d="M33.9541 0H297.546C316.298 0 331.5 15.2215 331.5 33.9975V247.003C331.5 265.779 316.298 281 297.546 281H180.547L149.908 326.715V281H33.9541C15.2021 281 -3.05176e-05 265.779 -3.05176e-05 247.003V33.9975C-3.05176e-05 15.2215 15.2021 0 33.9541 0Z"
                fill="#1C1B1A"
              />
            </svg>
            <div className="absolute items-center top-5 text-lg md:text-2xl font-playfair text-[#FFF3E5] left-5 right-5 justify-center">
              “My retail client needs to choose between FIFO and weighted
              average cost methods. How will each affect their taxes with
              current inflation?”
            </div>
          </div>

          <div
            style={{ position: "absolute", display: "inline-block" }}
            className="right-16 top-72"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="481"
              height="231"
              viewBox="0 0 481 231"
              fill="none"
            >
              <path
                d="M446.5 0L33.9541 0C15.2021 0 -7.62939e-06 15.2215 -7.62939e-06 33.9975V150.558C-7.62939e-06 169.334 15.2021 184.555 33.9541 184.555H390.63L421.268 230.27V184.555H446.5C465.252 184.555 480.454 169.334 480.454 150.558V33.9975C480.454 15.2215 465.252 0 446.5 0Z"
                fill="#1C1B1A"
              />
            </svg>
            <div className="absolute items-center top-5 text-lg md:text-2xl font-playfair text-[#FFF3E5] left-5 right-5 justify-center">
              “I'm 45 earning $85,000 and confused about salary sacrificing vs
              after-tax super contributions. Which strategy is better for my
              situation?”
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpfulQuestionSection;
