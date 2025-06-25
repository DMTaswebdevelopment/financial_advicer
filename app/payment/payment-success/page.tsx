"use client";

import { UserNameListType } from "@/component/model/types/UserNameListType";
import { getUserLocalStorage } from "@/functions/function";
import { db } from "@/lib/firebase";
import { setUserNameLists } from "@/redux/storageSlice";
import { collection, query, where, getDocs } from "firebase/firestore";
import { CheckCircle, Star, Crown, Zap, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

export default function PaymentSuccess() {
  const route = useRouter();
  const userData: UserNameListType | null = getUserLocalStorage();
  const dispatch = useDispatch();
  const [isUserSubscribe, setIsUserSubscribe] = useState<boolean>(true);

  useEffect(() => {
    if (isUserSubscribe) {
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
            productId: firestoreUserData.productId,
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
  }, [isUserSubscribe, userData?.id]);

  console.log("userData", userData);
  const features = [
    { icon: <Zap className="w-5 h-5" />, text: "Everything in Free Account" },
    {
      icon: <Shield className="w-5 h-5" />,
      text: "Practical Guides & Checklist",
    },
    {
      icon: <Star className="w-5 h-5" />,
      text: "Detailed Knowledge Documents",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Main success card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl">
          {/* Success icon with animation */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mb-6 animate-bounce">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>

            {/* Crown icon for premium feel */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-6 animate-pulse">
              <Crown className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Main heading */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-4">
              Welcome to Premium!
            </h1>
            <h2 className="text-xl md:text-2xl text-white/80 mb-2">
              🎉 Subscription Activated Successfully
            </h2>
            <p className="text-lg text-white/60">
              Thank you for upgrading, {userData?.name || "valued user"}!
            </p>
          </div>

          {/* Subscription details */}
          <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl p-6 mb-8 border border-white/10">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Your Plan</h3>
              <div className="text-3xl font-extrabold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Monthly Premium
              </div>
              <p className="text-white/60 mt-2">Billed Monthly as configured</p>
            </div>
          </div>

          {/* Premium features grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10 items-center ">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 transform hover:scale-105"
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mb-3">
                    {feature.icon}
                  </div>
                  <p className="text-sm text-white/80 font-medium">
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
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Start Exploring Premium Features
            </button>
          </div>

          {/* Footer note */}
          <div className="text-center mt-8 pt-6 border-t border-white/10">
            <p className="text-white/60 text-sm">
              Need help? Contact our premium support team anytime
            </p>
            <div className="flex justify-center space-x-4 mt-4">
              <span className="text-xs text-white/40">📧 Premium Support</span>
              <span className="text-xs text-white/40">🔒 Secure Payment</span>
              <span className="text-xs text-white/40">⚡ Instant Access</span>
            </div>
          </div>
        </div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
