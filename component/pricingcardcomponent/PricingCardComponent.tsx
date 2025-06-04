"use client";

import React, { useState } from "react";
import { PricingPlan } from "../model/interface/PricingPlan";

interface PricingCardProps {
  plan: PricingPlan;
  billingCycle: "monthly" | "annual";
  onSelect?: (selectedPlan: PricingPlan) => void; // <- new
}

const CheckIcon = () => (
  <svg
    className="w-5 h-5 text-green-500"
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

const PricingCardComponent: React.FC<PricingCardProps> = ({
  plan,
  billingCycle,
  onSelect,
}) => {
  const {
    name,
    monthlyPrice,
    annualPrice,
    description,
    features,
    buttonText,
    isPopular,
    isCurrentPlan,
  } = plan;

  const price = billingCycle === "annual" ? annualPrice : monthlyPrice;
  const period = billingCycle === "annual" ? "year" : "month";

  const cardClasses = `
    relative rounded-2xl p-8 border-2 transition-all duration-300 hover:scale-105 hover:shadow-xl
    ${
      name === "Free"
        ? "bg-orange-50 border-orange-200"
        : "bg-gray-900 text-white border-gray-700"
    }
  `;

  const buttonClasses = `
    w-full py-3 px-6 rounded-full font-medium transition-all duration-200 text-sm cursor-pointer
    ${
      name === "Free"
        ? "bg-gray-900 text-white hover:bg-gray-800"
        : "bg-white text-gray-900 hover:bg-gray-100"
    }
  `;

  const handleSubscribe = async (selectedPlan: PricingPlan) => {
    try {
      const selectedPrice = selectedPlan.monthlyPrice;
      console.log("Selected monthly price:", selectedPrice);
    } catch (error) {
      console.log("error:", error);
    }
  };
  return (
    <div className={cardClasses}>
      {/* Current Plan Badge */}
      {isCurrentPlan && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-gray-800 text-white px-4 py-1 rounded-full text-xs font-medium">
            Current Plan
          </span>
        </div>
      )}

      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-medium">
            Most Popular
          </span>
        </div>
      )}

      {/* Price Section */}
      <div className="mb-6">
        <div className="flex items-baseline mb-2">
          <span className="text-4xl font-bold">${price}</span>
          <span
            className={`ml-1 text-sm ${
              name === "Free" ? "text-gray-600" : "text-gray-300"
            }`}
          >
            /{period}
          </span>
        </div>
        <h3 className="text-xl font-semibold mb-2">{name}</h3>
        <p
          className={`text-sm ${
            name === "Free" ? "text-gray-600" : "text-gray-300"
          }`}
        >
          {description}
        </p>
      </div>

      {/* Features List */}
      <div className="mb-8">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <CheckIcon />
              <span
                className={`text-sm ${
                  name === "Free" ? "text-gray-700" : "text-gray-200"
                }`}
              >
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA Button */}
      <button
        className={buttonClasses}
        onClick={() => handleSubscribe(plan)} // <- call the onSelect function
      >
        {buttonText}
      </button>
    </div>
  );
};

export default PricingCardComponent;
