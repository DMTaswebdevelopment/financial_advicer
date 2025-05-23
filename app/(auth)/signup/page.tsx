"use client";

import React, { useState } from "react";
import { useCreateUserWithEmailAndPassword } from "react-firebase-hooks/auth";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";
import Head from "next/head";
import { getIdToken, updateProfile, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db, auth, provider } from "@/lib/firebase"; // ensure you export db from firebase config
import { useUser } from "@/app/context/authContext";

const SignUp = () => {
  const { setUserRoleContext } = useUser();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [createUserWithEmailAndPassword] =
    useCreateUserWithEmailAndPassword(auth);

  const handleSignup = async (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (password.length < 8) {
      alert("Password must be at least 8 characters long.");
      return;
    }

    try {
      const res = await createUserWithEmailAndPassword(email, password);

      if (!res?.user) throw new Error("User creation failed.");
      if (res.user) {
        // Optional: Update display name if you want to prompt for it
        await updateProfile(res.user, {
          displayName: "New User", // Replace with real input if available
        });

        console.log("res", res);
        const accessToken = await getIdToken(res.user);

        setUserRoleContext("customer");

        const userData = {
          email: res.user.email,
          name: res.user.displayName || "Anonymous",
          photoUrl: res.user.photoURL || "", // blank if none
          accessToken,
          id: res.user.uid,
          subscription: null, // Default tier, can be updated later
          userRole: "customer", // default role
        };

        // Add to Firestore
        await setDoc(doc(db, "users", res.user.displayName || "users"), {
          userData,
        });

        console.log("User stored:", userData);
        setEmail("");
        setPassword("");
      }
    } catch (error) {
      console.error("Signup error:", error);
    }
  };

  const handleGoogleSignIn = async () => {
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
        alert(`New user added to Firestore: ${newUser}`);
      } else {
        console.log("User already exists in Firestore.");
      }

      // Optional: redirect or update UI here
    } catch (error) {
      console.error("Google sign-in failed:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <Head>
        <title>Sign Up</title>
      </Head>

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
                className="w-full px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign up
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
              className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
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
  );
};

export default SignUp;
