"use client";

// import { useEffect, useState } from "react";
// import { useParams } from "next/navigation";
export default function PaymentSuccess() {
  // const [session, setSession] = useState(null);
  // const [amount, setAmount] = useState<string | null>(null);

  // useEffect(() => {
  //   const fetchSession = async () => {
  //     const params = useParams();
  //     const sessionId = params.get("session_id");
  //     const amountParam = params.get("amount");
  //     setAmount(amountParam);

  //     if (!sessionId) return;

  //     const response = await fetch(
  //       `/api/checkout-session?session_id=${sessionId}`
  //     );
  //     const data = await response.json();
  //     setSession(data);
  //   };

  //   fetchSession();
  // }, []);

  // if (!session || !amount) return <p>Loading...</p>;

  return (
    <main className="max-w-6xl mx-auto p-10 text-white text-center border m-10 rounded-md bg-gradient-to-tr from-blue-500 to-purple-500">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold mb-2">Thank you!</h1>
        <h2 className="text-2xl">You successfully sent</h2>

        <div className="bg-white p-2 rounded-md text-purple-500 mt-5 text-4xl font-bold">
          {/* ${amount} */}
        </div>
      </div>
    </main>
  );
}
