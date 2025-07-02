"use client";

import { UserNameListType } from "@/component/model/types/UserNameListType";
import { getUserLocalStorage } from "@/functions/function";
import { db } from "@/lib/firebase";
import { setIsUserSubscribed, setUserNameLists } from "@/redux/storageSlice";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import New from "/public/clarity_new-solid.svg";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Image from "next/image";

export default function PaymentSuccess() {
  const route = useRouter();
  const dispatch = useDispatch();
  const [isClient, setIsClient] = useState(false);
  const [userData, setUserData] = useState<UserNameListType | null>(null);
  const [particles, setParticles] = useState<
    Array<{ left: string; top: string; delay: string; duration: string }>
  >([]);

  const [isUserSubscribe, setIsUserSubscribe] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number>(3);

  // Set client-side flag after component mounts
  useEffect(() => {
    setIsClient(true);
    // Get user data on client side only
    const clientUserData = getUserLocalStorage();
    setUserData(clientUserData);

    // Generate particles only on client-side
    const newParticles = [...Array(20)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`,
      duration: `${2 + Math.random() * 2}s`,
    }));
    setParticles(newParticles);
  }, []);

  // Auto-close tab after hydration is complete
  useEffect(() => {
    if (isClient) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            window.close();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isClient]);

  useEffect(() => {
    if (isUserSubscribe && userData?.id) {
      setIsUserSubscribed(true);
      const fetchPdfs = async () => {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("id", "==", userData?.id));
        const querySnapshot = await getDocs(q);

        const subscriptionsRef = collection(db, "subscriptions");
        const subQuery = query(
          subscriptionsRef,
          where("uid", "==", userData?.id),
          where("status", "==", "active")
        );
        const subSnapshot = await getDocs(subQuery);

        let productId: string | null = null;
        let interval: string = "";

        if (!subSnapshot.empty) {
          const subDoc = subSnapshot.docs[0].data();
          productId = subDoc.productId || null;
          interval = subDoc.interval || "";
        }

        if (!querySnapshot.empty && userData?.id) {
          const userDoc = querySnapshot.docs[0];
          const firestoreUserData = userDoc.data();
          const userPayload: UserNameListType = {
            email: userData?.email || "",
            productId: firestoreUserData.productId || productId,
            interval: interval,
            name: userData?.name || "",
            photoUrl: userData?.photoUrl || "",
            userRole: firestoreUserData.userRole,
            id: userData.id,
          };

          dispatch(setUserNameLists(userPayload));
          localStorage.setItem("userDatas", JSON.stringify(userPayload));
          setIsUserSubscribe(false);
        }
      };
      fetchPdfs();
    }
  }, [isUserSubscribe, userData?.id, dispatch]);

  const features = [
    { icon: New, text: "Everything in Free Account", showIcon: false },
    {
      icon: New,
      text: "Practical Guides & Checklist",
      showIcon: true,
    },
    {
      icon: New,
      text: "Detailed Knowledge Documents",
      showIcon: true,
    },
  ];

  // Show loading state until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="relative mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-16 border border-black shadow-2xl max-w-7xl">
            <div className="text-center mb-20">
              <h1 className="self-stretch text-center justify-start text-stone-900 text-7xl font-normal font-playfair mb-2">
                Welcome to Premium!
              </h1>
              <h2 className="text-center justify-start text-stone-900 text-3xl font-normal font-sans mb-2">
                Subscription Activated Successfully
              </h2>
              <p className="self-stretch text-center justify-start">
                Thank you for upgrading,{" "}
                <span className="text-stone-900 text-base font-bold font-sans">
                  valued user
                </span>
                !
              </p>
            </div>
            {/* Rest of the loading content */}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="relative mx-auto">
        {/* Main success card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-16 border border-black shadow-2xl max-w-7xl">
          {/* Main heading */}
          <div className="text-center mb-20">
            <h1 className="self-stretch text-center justify-start text-stone-900 text-7xl font-normal font-playfair mb-2">
              Welcome to Premium!
            </h1>
            <h2 className="text-center justify-start text-stone-900 text-3xl font-normal font-sans mb-2">
              Subscription Activated Successfully
            </h2>
            <p className="self-stretch text-center justify-start">
              Thank you for upgrading,{" "}
              <span className="text-stone-900 text-base font-bold font-sans">
                {userData?.name || "valued user"}
              </span>
              !
            </p>
            <div className="mt-4 text-center">
              <p className="text-stone-700 text-sm">
                Redirecting to homepage in {countdown} seconds...
              </p>
            </div>
          </div>

          {/* Subscription details */}
          <div className="w-full flex justify-center">
            <div className="bg-stone-900 rounded-2xl p-6 mb-8 w-[743px]">
              <div className="text-center">
                <h3 className="self-stretch text-center justify-start text-3xl font-bold text-white mb-2 font-sans">
                  Your Plan
                </h3>
                <div className="self-stretch text-center justify-start text-white text-4xl font-bold font-sans mb-2">
                  Monthly Premium
                </div>
                <p className="self-stretch text-center justify-start text-white text-base font-normal font-sans">
                  Billed Monthly as configured
                </p>
              </div>
            </div>
          </div>

          {/* Premium features grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10 items-center">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 transform hover:scale-105"
              >
                <div className="text-center flex flex-col h-full">
                  {/* Icon container with fixed height */}
                  <div className="h-16 flex items-center justify-center mb-2">
                    {feature.showIcon && (
                      <Image
                        src={feature.icon}
                        height={3}
                        width={3}
                        className="w-12 h-12"
                        alt="new feature"
                      />
                    )}
                  </div>

                  {/* Text at bottom */}
                  <p className="text-base text-black font-bold mt-auto">
                    {feature.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => route.push("/")}
              className="bg-black text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Start Exploring Premium Features
            </button>
          </div>
        </div>

        {/* Floating particles effect - only render on client */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((particle, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-ping"
              style={{
                left: particle.left,
                top: particle.top,
                animationDelay: particle.delay,
                animationDuration: particle.duration,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
