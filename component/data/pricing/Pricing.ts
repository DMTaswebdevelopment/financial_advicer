// import { useSession } from "next-auth/react";

export const plans = [
  {
    link:
      process.env.NODE_ENV === "development"
        ? "https://buy.stripe.com/test_fZu6oH1mq5AUaJfbyGfAc00"
        : "",
    priceId:
      process.env.NODE_ENV === "development"
        ? "price_1ROCTqECb27v8AiKnM1NsAvW"
        : "",
    price: 9,
    duration: "/month",
  },
];

// const Pricing = () => {
//   const { data: session } = useSession();
// };
