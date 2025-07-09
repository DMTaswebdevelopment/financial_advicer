"use client";

import { PricingPlan } from "@/component/model/interface/PricingPlan";
import PricingCardComponent from "@/component/pricingcardcomponent/PricingCardComponent";
import ToasterComponent from "@/components/templates/ToastMessageComponent/ToastMessageComponent";
import React, { useState } from "react";

const PricingSection = () => {
  // toast state message (start) ==========================================>
  const [showToast, setShowToast] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [toastType, setToastType] = useState<ToastType>("success");
  // toast state message (start) ==========================================>

  const essentialPriceID = process.env.NEXT_PUBLIC_PRICE_ID || "";

  const professionalPriceID =
    process.env.NEXT_PUBLIC_PROFESSIONAL_PRICE_ID || "";

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
      priceId: essentialPriceID,
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
      priceId: professionalPriceID,
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
    <div className="flex items-center justify-center flex-col text-center">
      <ToasterComponent
        isOpen={showToast}
        title={title}
        message={message}
        onClose={setShowToast}
        type={toastType}
        duration={3000} // 3 seconds
        autoClose={true}
      />
      <div className="py-16 px-5">
        <h1 className="font-playfair text-5xl lg:text-6xl font-normal ">
          Get unlimited financial advice
        </h1>

        <h3 className="font-sans text-[#1C1B1A] text-[15px] mt-6">
          Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam
          <br />
          nonummy nibh euismod tincidunt ut laoreet
        </h3>

        {/* Pricing Cards Section */}
        <div className="py-16">
          <div className=" w-full lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-7 relative">
            {/* Pricing Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto relative">
              {plans.map((plan, index) => (
                <PricingCardComponent
                  key={index}
                  plan={plan}
                  setMessage={setMessage}
                  setTitle={setTitle}
                  setToastType={setToastType}
                  setShowToast={setShowToast}
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
