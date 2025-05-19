"use client";

import React from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutPage from "@/component/checkout/CheckOutPage";
import convertToSubcurrency from "@/lib/convertToSubcurrency";
const PaymentProcess = () => {
  if (process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY === undefined) {
    throw new Error("NEXT_PUBLIC_STRIPE_PUBLIC_KEY IS NOT DEFINED ");
  }

  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

  console.log("stripePromise", stripePromise);

  const amount = 9;
  return (
    <div className="max-w-6xl mx-auto p-10 text-white text-center border m-10 rounded-md bg-gradient-to-tr from-blue-500 to-purple-500">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold mb-2">Financial</h1>
        <h2 className="text-2xl">has requested</h2>
        <span>${amount}</span>
      </div>

      <Elements
        stripe={stripePromise}
        options={{
          mode: "payment",
          amount: convertToSubcurrency(amount),
          currency: "usd",
          appearance: {
            theme: "flat",
            variables: {
              colorPrimaryText: "#262626",
            },
          },
        }}
      >
        <CheckoutPage amount={amount} />
      </Elements>
    </div>
  );
};

export default PaymentProcess;
