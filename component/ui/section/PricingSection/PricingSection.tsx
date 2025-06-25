"use client";

import { PricingPlan } from "@/component/model/interface/PricingPlan";
import PricingCardComponent from "@/component/pricingcardcomponent/PricingCardComponent";
import React, { useState } from "react";

interface PricingToggleProps {
  onToggle?: (isAnnual: boolean) => void;
  defaultValue?: "monthly" | "annual";
}

const PricingToggle: React.FC<PricingToggleProps> = ({
  onToggle,
  defaultValue = "monthly",
}) => {
  const [isAnnual, setIsAnnual] = useState(defaultValue === "annual");

  const handleToggle = (value: boolean) => {
    setIsAnnual(value);
    onToggle?.(value);
  };

  return (
    <div className="flex items-center justify-center text-center lg:p-8 w-full">
      <div className="relative w-full md:w-96 font-playfair h-12 px-5 bg-orange-50 rounded-lg outline-1 outline-offset-[-1px] outline-black inline-flex items-center">
        {/* Background sliding indicator */}
        {/* <div
          className={`absolute top-1 bottom-1 rounded-lg bg-gray-900 transition-all duration-300 ease-in-out ${
            isAnnual
              ? "left-[calc(50%-2px)] right-1"
              : "left-1 right-[calc(50%-2px)]"
          }`}
        /> */}
        <div className="rounded-lg bg-gray-900 w-full">
          {/* Monthly Button */}
          <button
            onClick={() => handleToggle(false)}
            className={`relative z-10 px-6 w-full py-2 rounded-full text-sm font-medium transition-colors duration-300 text-center cursor-pointer ${
              !isAnnual ? "text-white" : "text-gray-700 hover:text-gray-900"
            }`}
          >
            Monthly
          </button>
        </div>

        {/* Annual Button */}
        {/* <button
          onClick={() => handleToggle(true)}
          className={`relative z-10 px-7 w-full py-2 rounded-full text-sm font-medium transition-colors duration-300 flex items-center gap-2 cursor-pointer ${
            isAnnual ? "text-white" : "text-gray-700 hover:text-gray-900"
          }`}
        >
          Annual
          <span
            className={`text-[10px] px-6 py-0.5 rounded-full transition-colors duration-300 ${
              isAnnual ? "bg-white text-black" : "bg-gray-200 text-gray-600"
            }`}
          >
            Save 20%
          </span>
        </button> */}
      </div>
    </div>
  );
};

const PricingSection = () => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly"
  );

  const handleBillingChange = (isAnnual: boolean) => {
    setBillingCycle(isAnnual ? "annual" : "monthly");
  };

  const monthlyPrice = 9;
  const annualPrice = Math.round(monthlyPrice * 12 * 0.8); // 20% discount
  const displayPrice =
    billingCycle === "annual"
      ? `$${annualPrice}/year`
      : `$${monthlyPrice}/month`;

  const plans: PricingPlan[] = [
    {
      name: "Free Account",
      name2: "",
      monthlyPrice: 0,
      priceId: "",
      annualPrice: 0,
      description: "Perfect for getting started with basic financial advice.",
      features: [
        "Ask unlimited questions to our database",
        "Missing Lessons Documents (beginner level)",
      ],
      buttonText: "Get started for free",
      isCurrentPlan: true,
    },
    {
      name: "Essential",
      name2: "",
      monthlyPrice: 9,
      priceId: "price_1ROCTqECb27v8AiKnM1NsAvW",
      annualPrice: Math.round(9 * 12 * 0.8), // 20% discount
      description: "Advanced features for serious financial planning.",
      features: [
        "Everything in Free Account",
        "Practical Guides & Checklist",
        "Detailed Knowledge Documents",
      ],
      buttonText: "Get started with Essential",
      isPopular: true,
    },
    {
      name: "Professional",
      name2: "(and the Curiosity Minded)",
      monthlyPrice: 30,
      priceId: "",
      annualPrice: Math.round(30 * 12 * 0.8), // 20% discount
      description: "Complete financial management",
      features: [
        "Everything in Essential",
        "Financial Fluency Documents",
        "Adviser Essentials Documents",
      ],
      buttonText: "Get started with Pro",
    },
  ];

  return (
    <div className="bg-white flex items-center justify-center flex-col text-center">
      <div className="py-16 px-5">
        <h1 className="font-playfair text-5xl lg:text-6xl font-normal ">
          Get unlimited financial advice
        </h1>

        <h3 className="font-sans text-[#1C1B1A] text-sm lg:text-lg mt-6">
          Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam
          <br />
          nonummy nibh euismod tincidunt ut laoreet
        </h3>

        <div className="mt-16">
          <div className="flex justify-center">
            <PricingToggle
              onToggle={handleBillingChange}
              defaultValue="monthly"
            />
          </div>
        </div>

        {/* Pricing Cards Section */}
        <div className="py-16">
          <div className=" w-full lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-7 relative">
            {/* Pricing Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto relative">
              {plans.map((plan, index) => (
                <PricingCardComponent
                  key={index}
                  plan={plan}
                  billingCycle={billingCycle}
                  // onSelect={(selectedPlan) => {
                  //   console.log("User selected:", selectedPlan.name);
                  // }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingSection;
