"use client";

import React from "react";
import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { useRouter } from "next/navigation";
import { getUserLocalStorage } from "@/functions/function";
import { UserNameListType } from "@/component/model/types/UserNameListType";
import { CheckIcon } from "@heroicons/react/20/solid";
import ToasterComponent from "@/components/templates/ToastMessageComponent/ToastMessageComponent";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

const essentialPriceID = process.env.NEXT_PUBLIC_PRICE_ID || "";

const professionalPriceID = process.env.NEXT_PUBLIC_PROFESSIONAL_PRICE_ID || "";

type Tier = {
  name: string;
  id: string;

  priceMonthly: string;
  description: string;
  features: string[];
  featured: boolean;
  priceId: string;
};

const tiers: Tier[] = [
  {
    name: "Essentials",
    id: "tier-enterprise",
    priceId: essentialPriceID,
    priceMonthly: "$9",
    description: "Advanced features for serious financial planning.",
    features: [
      "Everything in Free Account",
      "Practical Guides & Checklist",
      "Detailed Knowledge Documents",
    ],
    featured: true,
  },
  {
    name: "Professional",
    id: "tier-hobby",
    priceMonthly: "$30",
    priceId: professionalPriceID,
    description: "Complete financial management",
    features: [
      "Everything in Essential",
      "Financial Fluency Documents",
      "Adviser Essentials Documents",
    ],
    featured: false,
  },
];

function classNames(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export default function PricePage() {
  const router = useRouter();
  const userData: UserNameListType | null = getUserLocalStorage();

  const [loading, setLoading] = useState<boolean>(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(false);
  // const searchParams = useSearchParams();

  // toast state message (start) ==========================================>
  const [showToast, setShowToast] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [toastType, setToastType] = useState<ToastType>("success");
  // toast state message (start) ==========================================>

  // handler for subscribe (start) =========================================>
  const handleSubscribe = async (priceId: string) => {
    setIsButtonDisabled(true);
    setLoading(true);

    try {
      const res = await fetch("/api/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userData?.email, // Replace or make dynamic
          priceId: priceId, // Your Stripe price ID
          uid: userData?.id,
        }),
      });

      // Check for error status codes
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
          setLoading(false);
          setIsButtonDisabled(false);
        }, 3000);
      } else {
        const { sessionId } = await res.json();

        const stripe = await stripePromise;

        if (stripe) {
          await stripe.redirectToCheckout({ sessionId });
          setLoading(false);
          setIsButtonDisabled(false);
        }
      }
    } catch (error) {
      console.log("error", error);
      alert(`or ni ari sa ko`);
      setLoading(false);
      setIsButtonDisabled(false);
    }
  };
  // handler for subscribe (end) ==========================================>

  return (
    <>
      <ToasterComponent
        isOpen={showToast}
        title={title}
        message={message}
        onClose={setShowToast}
        type={toastType}
        duration={3000} // 3 seconds
        autoClose={true}
      />
      <div className="px-6 h-screen relative py-20 overflow-y-auto">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mt-2 text-4xl font-semibold font-playfair tracking-tight text-balance text-gray-900 sm:text-6xl">
            Get unlimited financial advice
          </h1>
        </div>
        <p className="mx-auto mt-6 font-sans text-[#1C1B1A] text-[15px] max-w-2xl text-center text-lg font-normal leading-relaxed">
          Choose an affordable plan that&rsquo;s packed with the best features
          for engaging your audience, creating customer loyalty, and driving
          sales.
        </p>
        <div className="mx-auto mt-12 relative mb-12 grid max-w-lg grid-cols-1 items-center gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-2xl lg:grid-cols-2">
          {tiers.map((tier, tierIdx) => (
            <div
              key={tier.id}
              className={classNames(
                tier.featured
                  ? "bg-[#1C1B1A] shadow-2xl h-[538px] w-full"
                  : "bg-white/60 sm:mx-8 lg:mx-0 h-[480px]",
                tier.featured
                  ? ""
                  : tierIdx === 0
                  ? "rounded-t-3xl sm:rounded-b-none lg:rounded-tr-none lg:rounded-bl-3xl"
                  : "sm:rounded-t-none lg:rounded-tr-3xl lg:rounded-bl-none",
                "rounded-3xl p-8 ring-1 ring-gray-900/10 sm:p-10 w-full relative" // Added relative here
              )}
            >
              <div
                id={tier.id}
                className={classNames(
                  tier.featured ? "text-indigo-400 " : "text-indigo-600",
                  "text-base/7 font-semibold"
                )}
              >
                {tier.name}
              </div>
              <p className="mt-4 flex items-baseline gap-x-2">
                <span
                  className={classNames(
                    tier.featured ? "text-white" : "text-gray-900",
                    "text-4xl font-semibold tracking-tight"
                  )}
                >
                  {tier.priceMonthly}
                </span>
                <span
                  className={classNames(
                    tier.featured ? "text-gray-400" : "text-gray-500",
                    "text-base"
                  )}
                >
                  /month
                </span>
              </p>
              <p
                className={classNames(
                  tier.featured ? "text-gray-300" : "text-gray-600",
                  "mt-6 text-sm"
                )}
              >
                {tier.description}
              </p>
              <ul
                role="list"
                className={classNames(
                  tier.featured ? "text-gray-300" : "text-gray-600",
                  "mt-8 space-y-3 text-sm/6 sm:mt-10"
                )}
              >
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <div
                      className={`w-6 h-6 ${
                        tier.featured ? "bg-gray-400 " : "bg-black"
                      } items-center flex justify-center rounded-full`}
                    >
                      <CheckIcon className="w-4 h-4 text-white" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(tier.priceId)}
                disabled={isButtonDisabled}
                aria-describedby={tier.id}
                className={classNames(
                  tier.featured
                    ? `text-black text-base ${
                        isButtonDisabled
                          ? "cursor-not-allowed"
                          : "cursor-pointer"
                      } font-normal bg-white w-72 bottom-8 `
                    : `text-white bg-black text-base font-normal w-72 bottom-12 ${
                        isButtonDisabled
                          ? "cursor-not-allowed"
                          : "cursor-pointer"
                      }`,
                  `mt-8 font-sans w-56 h-11 rounded-3xl absolute  left-8 right-8` // Changed positioning
                )}
              >
                {loading ? "Redirecting..." : "Get Started"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
