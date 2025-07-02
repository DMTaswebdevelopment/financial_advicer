// export default Login;
"use client";
import React, { useEffect, useState } from "react";

import Head from "next/head";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { auth, provider } from "@/lib/firebase";
import { getIdToken, signInWithPopup } from "firebase/auth";
import { useUser } from "@/app/context/authContext";
import { useDispatch } from "react-redux";
import { isLogin, setUserNameLists } from "@/redux/storageSlice";
import { collection, query, where, getDocs } from "firebase/firestore";

import { db } from "@/lib/firebase"; // ensure you export Firestore from your firebase config
import { useRouter } from "next/navigation";
import {
  saveTokenToLocalStorage,
  saveUserToLocalStorage,
} from "@/functions/function";
import ToasterComponent from "@/components/templates/ToastMessageComponent/ToastMessageComponent";
import Image from "next/image";

const SignInPage: React.FC = () => {
  const { setUserRoleContext } = useUser();
  const dispatch = useDispatch();
  const router = useRouter();

  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // const [email, setEmail] = useState("");
  // const [password, setPassword] = useState("");
  // const [rememberMe, setRememberMe] = useState(false);

  // toast state message (start) ==========================================>
  const [showToast, setShowToast] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [toastType, setToastType] = useState<ToastType>("success");
  // toast state message (start) ==========================================>

  const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(false);

  const handleGoogleSignIn = async () => {
    setIsButtonDisabled(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Get the Firebase ID token
      const accessToken = await getIdToken(user);

      // Reference to the Firestore user document
      // Query Firestore for a user with matching `id` field (not document ID)
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("id", "==", user.uid));
      const querySnapshot = await getDocs(q);

      const subscriptionsRef = collection(db, "subscriptions");
      const subQuery = query(
        subscriptionsRef,
        where("uid", "==", user.uid),
        where("status", "==", "active") // optional
      );
      const subSnapshot = await getDocs(subQuery);

      // Safely extract subscription data
      let productId: string | null = null;
      let interval: string = "";

      if (!subSnapshot.empty) {
        const subDoc = subSnapshot.docs[0].data();
        productId = subDoc.productId || null;
        interval = subDoc.interval || "";
      }

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const firestoreUserData = userDoc.data();

        const userPayload = {
          email: user.email,
          productId: firestoreUserData.productId || productId,
          interval: interval || null,
          name: user.displayName,
          photoUrl: user.photoURL,
          accessToken,
          userRole: firestoreUserData.userRole,
          id: user.uid,
        };

        dispatch(isLogin(true));
        // then save it for both redux and local storage
        saveTokenToLocalStorage(accessToken);
        setUserRoleContext(firestoreUserData.userRole);
        saveUserToLocalStorage(userPayload);

        if (firestoreUserData.userRole === "customer") {
          setMessage("Successfully Sign In");
          setTitle("Sign In");
          setToastType("success");
          setShowToast(true);
          setTimeout(() => {
            dispatch(setUserNameLists(userPayload));
            localStorage.setItem("userDatas", JSON.stringify(userPayload));
            // Clear any other session data or perform additional cleanup if needed
            setIsButtonDisabled(false);
            setShowToast(false);
            // Redirect to sign-in page or any other page as needed
            router.push("/");
          }, 3000);
        } else if (firestoreUserData.userRole === "admin") {
          setMessage("Successfully Sign In");
          setTitle("Sign In");
          setToastType("success");
          setShowToast(true);
          setTimeout(() => {
            dispatch(setUserNameLists(userPayload));
            localStorage.setItem("userDatas", JSON.stringify(userPayload));
            // Clear any other session data or perform additional cleanup if needed
            setIsButtonDisabled(false);
            setShowToast(false);
            // Redirect to sign-in page or any other page as needed
            router.push("/");
          }, 3000);
        }
        // router.push("/");
      } else {
        setMessage("Failed to login: this account doesn't exist!");
        setTitle("Error Sign in");
        setToastType("error");
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
          setIsButtonDisabled(false);
          // Redirect to sign-in page or any other page as needed
          router.push("/login");
        }, 3000);
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      alert("An error occurred during sign in. Please try again.");
    }
    setIsButtonDisabled(false);
  };

  return (
    <div className="min-h-screen flex">
      <Head>
        <title>Sign In</title>
      </Head>

      <ToasterComponent
        isOpen={showToast}
        title={title}
        message={message}
        onClose={setShowToast}
        type={toastType}
      />

      {/* Left side - Sign in form */}
      <div className="w-full lg:w-1/2 flex items-center px-8 py-12 bg-white">
        <div className="w-full max-w-md ml-16">
          <h2 className="text-2xl font-bold text-gray-900">
            Sign in to your account
          </h2>

          <form className="mt-8 space-y-6" action="#" method="POST">
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <div
                  className="mt-1"
                  suppressHydrationWarning={true}
                  key={isHydrated ? "hydrated" : "server"}
                >
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    autoComplete="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="remember-me"
                    className="block ml-2 text-sm text-gray-700"
                  >
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link
                    href="/forgot-password"
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Sign in
                </button>
                <span className="text-sm ">
                  <span>Don&apos;t have an account?</span>
                  <a
                    href="/signup"
                    className=" hover:text-blue-600 hover:underline-offset-2 hover:underline"
                  >
                    click here
                  </a>
                </span>
              </div>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 text-gray-500 bg-white">
                  Or continue with
                </span>
              </div>
            </div>

            <div
              className="mt-6"
              // className="grid grid-cols-2 gap-3 mt-6"
            >
              <button
                disabled={isButtonDisabled}
                onClick={handleGoogleSignIn}
                type="button"
                className={`${
                  isButtonDisabled ? "cursor-not-allowed" : "cursor-pointer"
                } flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50`}
              >
                <FcGoogle className="w-5 h-5 mr-2" />
                Google
              </button>
              {/* <button
              type="button"
              className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            >
              <FaFacebook className="w-5 h-5 mr-2 text-blue-600" />
              Facebook
            </button> */}
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <Image
          src="https://res.cloudinary.com/dmz8tsndt/image/upload/v1748927406/AdobeStock_629709390_sxrh0w.jpg"
          alt="Modern workspace with laptop, phone, and accessories on a clean desk"
          className="w-full h-full object-cover"
          height={600}
          width={600}
        />
      </div>
    </div>
  );
};

export default SignInPage;
