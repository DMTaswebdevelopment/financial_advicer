"use client";

import React, { useState } from "react";
import { PricingPlan } from "../model/interface/PricingPlan";
import { getUserLocalStorage } from "@/functions/function";
import { UserNameListType } from "../model/types/UserNameListType";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

interface PricingCardProps {
  plan: PricingPlan;
  setMessage: (message: string) => void;
  setTitle: (title: string) => void;
  setToastType: (type: ToastType) => void;
  setShowToast: (isOpen: boolean) => void;
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
  setMessage,
  setTitle,
  setToastType,
  setShowToast,
}) => {
  const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(false);
  const {
    name,
    name2,
    monthlyPrice,
    description,
    features,
    buttonText,
    isPopular,
    isCurrentPlan,
  } = plan;
  const userData: UserNameListType | null = getUserLocalStorage();
  const router = useRouter();

  const cardClasses = `
    relative rounded-2xl p-4 border-2 transition-all duration-300 hover:scale-105 hover:shadow-xl h-96 items-center flex flex-col relative
    ${
      name === "Free"
        ? "bg-orange-50 border-orange-200"
        : "bg-gray-900 text-white border-gray-700"
    }
  `;

  const buttonClasses = `
    w-3/4 py-3 px-6 rounded-full font-medium transition-all duration-200 text-sm  absolute bottom-6
    ${isButtonDisabled ? "cursor-not-allowed" : "cursor-pointer"}
    
    ${
      name === "Free"
        ? "bg-gray-900 text-white hover:bg-gray-800"
        : "bg-white text-gray-900 hover:bg-gray-100"
    }
  `;

  const handleSubscribe = async (selectedPlan: PricingPlan) => {
    setIsButtonDisabled(true);
    try {
      if (userData?.email !== "") {
        const selectedPriceID = selectedPlan.priceId;

        const res = await fetch("/api/checkout-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userData?.email, // Replace or make dynamic
            priceId: selectedPriceID, // Your Stripe price ID
            uid: userData?.id,
          }),
        });

        if (res.status === 400) {
          // Handle 400 error - maybe show a toast or alert
          setMessage(
            "You need to log in first. Kindly sign in to your account and try again."
          );
          setTitle("Sorry!");
          setToastType("error");
          setShowToast(true);
          setTimeout(() => {
            setShowToast(false);
            router.push("/login");
            setIsButtonDisabled(false);
          }, 3000);
        }
        const { sessionId } = await res.json();

        const stripe = await stripePromise;

        if (stripe) {
          await stripe.redirectToCheckout({ sessionId });
        }
      } else {
        router.push("/login");
      }
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
          <span className="text-4xl font-bold">${monthlyPrice}</span>
          <span
            className={`ml-1 text-sm ${
              name === "Free" ? "text-gray-600" : "text-gray-300"
            }`}
          >
            /month
          </span>
        </div>
        <h3 className="text-xl font-semibold mb-2">
          {name} <br /> <span>{name2}</span>
        </h3>
        <p
          className={`text-sm ${
            name === "Free" ? "text-gray-600" : "text-gray-300"
          }`}
        >
          {description}
        </p>
      </div>

      {/* Features List */}
      <div className="">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start text-start gap-3">
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
        disabled={isButtonDisabled}
        className={buttonClasses}
        onClick={() => handleSubscribe(plan)} // <- call the onSelect function
      >
        {buttonText}
      </button>
    </div>
  );
};

export default PricingCardComponent;
