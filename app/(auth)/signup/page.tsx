"use client";

import React, { useState } from "react";
// import { useCreateUserWithEmailAndPassword } from "react-firebase-hooks/auth";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";
import Head from "next/head";
import {
  getIdToken,
  updateProfile,
  signInWithPopup,
  // sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db, auth, provider } from "@/lib/firebase"; // ensure you export db from firebase config
import { useUser } from "@/app/context/authContext";
import ToasterComponent from "@/components/templates/ToastMessageComponent/ToastMessageComponent";
import { useRouter } from "next/navigation";

const SignUp = () => {
  const { setUserRoleContext } = useUser();
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  // Loading states
  const [isEmailSignupLoading, setIsEmailSignupLoading] =
    useState<boolean>(false);
  const [isGoogleSignupLoading, setIsGoogleSignupLoading] =
    useState<boolean>(false);

  // toast state message (start) ==========================================>
  const [showToast, setShowToast] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [toastType, setToastType] = useState<ToastType>("success");
  // toast state message (start) ==========================================>

  // const [createUserWithEmailAndPassword] =
  //   useCreateUserWithEmailAndPassword(auth);

  const handleSignup = async (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsEmailSignupLoading(true);

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters long.");
      setTitle("Warning");
      setToastType("warning");
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
      setIsEmailSignupLoading(false);
      return;
    }

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const user = res?.user;

      if (!user) throw new Error("User creation failed.");
      if (user) {
        // Optional: Update display name if you want to prompt for it
        await updateProfile(user, {
          displayName: email.split("@")[0], // Use email prefix as display name
        });

        // // Send email verification
        // await sendEmailVerification(user);

        // // Sign out the user until they verify their email
        // await auth.signOut();

        const accessToken = await getIdToken(user);
        setUserRoleContext("customer");

        // Format display name safely for Firestore doc ID (e.g., replace spaces with underscores)
        const safeDisplayName = (res.user.displayName || "user").replace(
          /\s+/g,
          "_"
        );

        const userRef = doc(db, "users", safeDisplayName);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          const userData = {
            email: user.email,
            name: user.displayName || "No Name",
            photoUrl: user.photoURL || "", // blank if none
            accessToken,
            id: user.uid,
            subscription: null, // Default tier, can be updated later
            userRole: "customer", // default role
          };

          // Add to Firestore
          await setDoc(userRef, userData);

          setEmail("");
          setPassword("");

          setMessage("Successfully created an account!");
          setTitle("Created an account");
          setToastType("success");
          setShowToast(true);
          setTimeout(() => {
            // Clear any other session data or perform additional cleanup if needed

            setShowToast(false);
            // Redirect to sign-in page or any other page as needed
            router.push("/login");
          }, 3000);
        } else {
          setMessage(
            "Failed to create an account: this account already exist!"
          );
          setTitle("Error Sign in");
          setToastType("error");
          setShowToast(true);
          setTimeout(() => {
            setShowToast(false);
            // Redirect to sign-in page or any other page as needed
            router.push("/login");
          }, 3000);
        }
      }
    } finally {
      setIsEmailSignupLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleSignupLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const accessToken = await getIdToken(user);
      setUserRoleContext("customer");

      // Format display name safely for Firestore doc ID (e.g., replace spaces with underscores)
      const safeDisplayName = (user.displayName || "user").replace(/\s+/g, "_");

      const userRef = doc(db, "users", safeDisplayName);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Add new user to Firestore
        const newUser = {
          email: user.email,
          name: user.displayName || "No Name",
          photoUrl: user.photoURL || "",
          accessToken,
          id: user.uid,
          subscription: null, // default
          userRole: "customer", // default
        };

        await setDoc(userRef, newUser);

        setMessage("Successfully created an account!");
        setTitle("Created an account");
        setToastType("success");
        setShowToast(true);
        setTimeout(() => {
          setIsGoogleSignupLoading(false);
          // Clear any other session data or perform additional cleanup if needed

          setShowToast(false);
          // Redirect to sign-in page or any other page as needed
          router.push("/login");
        }, 3000);
      } else {
        setMessage("Failed to create an account: this account already exist!");
        setTitle("Error Sign in");
        setToastType("error");
        setShowToast(true);
        setTimeout(() => {
          setIsGoogleSignupLoading(false);
          setShowToast(false);
          // Redirect to sign-in page or any other page as needed
          router.push("/login");
        }, 3000);
      }

      // Optional: redirect or update UI here
    } catch (error) {
      setIsGoogleSignupLoading(false);
      setMessage(`Failed to create an account: ${error}`);
      setTitle("Error Account");
      setToastType("error");
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        // Redirect to sign-in page or any other page as needed
        router.push("/login");
      }, 3000);
    } finally {
      setIsGoogleSignupLoading(false);
    }
  };

  // Loading spinner component
  const LoadingSpinner = () => (
    <svg
      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <Head>
        <title>Sign Up</title>
      </Head>

      <ToasterComponent
        isOpen={showToast}
        title={title}
        message={message}
        onClose={setShowToast}
        type={toastType}
        duration={3000} // 3 seconds
        autoClose={true}
      />
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Sign up to your account
          </h2>
        </div>

        <form className="mt-8 space-y-6" action="#" method="POST">
          <div className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  disabled={isEmailSignupLoading || isGoogleSignupLoading}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label
                  htmlFor="remember-me"
                  className="block ml-2 text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>
            </div>

            <div>
              <button
                onClick={handleSignup}
                type="submit"
                disabled={isEmailSignupLoading || isGoogleSignupLoading}
                className={`w-full px-4 py-2 ${
                  isEmailSignupLoading || isGoogleSignupLoading
                    ? "cursor-not-allowed"
                    : "cursor-pointer"
                } text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                {isEmailSignupLoading ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner />
                    Creating account...
                  </div>
                ) : (
                  "Sign up"
                )}
              </button>
              <span className="text-sm ">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className=" hover:text-blue-600 hover:underline-offset-2 hover:underline"
                >
                  click here
                </Link>
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
              onClick={handleGoogleSignIn}
              type="button"
              disabled={isEmailSignupLoading || isGoogleSignupLoading}
              className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            >
              {isGoogleSignupLoading ? (
                <div
                  className="flex
                "
                >
                  <div className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                  Signing up with Google...
                </div>
              ) : (
                <>
                  <FcGoogle className="w-5 h-5 mr-2" />
                  Google
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
