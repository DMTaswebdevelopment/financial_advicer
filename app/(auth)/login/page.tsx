// export default Login;
"use client";
import React, { useEffect, useState } from "react";

import Head from "next/head";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { auth, provider } from "@/lib/firebase";
import {
  getIdToken,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { useUser } from "@/app/context/authContext";
import { useDispatch } from "react-redux";
import { isLogin, setUserNameLists } from "@/redux/storageSlice";
import loginImage from "@/public/images/login1.jpeg";

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase"; // ensure you export Firestore from your firebase config
import { useRouter } from "next/navigation";
import {
  saveTokenToLocalStorage,
  saveUserToLocalStorage,
} from "@/functions/function";
import ToasterComponent from "@/components/templates/ToastMessageComponent/ToastMessageComponent";
import Image from "next/image";
import LoadingSpinnerComponent from "@/components/templates/LoadingSpinnerComponent/LoadingSpinnerComponent";
import { FirebaseError } from "firebase/app";

import Cookies from "js-cookie";
import { TokenPayload } from "@/component/model/interface/TokenPayload";
import { TokenHeader } from "@/component/model/interface/TokenHeader";

const SignInPage: React.FC = () => {
  const { setUserRoleContext } = useUser();
  const dispatch = useDispatch();
  const router = useRouter();

  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLogginIn, setIsLogginIn] = useState<boolean>(false);
  // const [rememberMe, setRememberMe] = useState(false);

  // toast state message (start) ==========================================>
  const [showToast, setShowToast] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [toastType, setToastType] = useState<ToastType>("success");
  // toast state message (start) ==========================================>

  const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(false);
  const [isEmailButtonDisabled, setIsEmailButtonDisabled] =
    useState<boolean>(false);

  useEffect(() => {
    if (email === "" && password === "") {
      setIsButtonDisabled(true);
    } else {
      setIsButtonDisabled(false);
    }
  }, [email, password]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsButtonDisabled(true);
    setIsLogginIn(true);

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;

      // IMPORTANT: Wait for the auth state to be fully set
      await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (authUser) => {
          if (authUser && authUser.uid === user.uid) {
            console.log("✅ Auth state confirmed:", authUser.uid);
            unsubscribe();
            resolve(true);
          }
        });
      });

      const accessToken = await getIdToken(user);

      // Method 1: Try to get document by document ID (UID)
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      // Method 2: Query by 'id' field
      const usersRef = collection(db, "users");
      const qById = query(usersRef, where("id", "==", user.uid));
      const querySnapshotById = await getDocs(qById);

      // Method 3: Query by email
      const qByEmail = query(usersRef, where("email", "==", user.email));
      const querySnapshotByEmail = await getDocs(qByEmail);

      // Now determine which method worked and use it
      let firestoreUserData = null;

      if (userDocSnap.exists()) {
        // Method 1 worked
        firestoreUserData = userDocSnap.data();
      } else if (!querySnapshotById.empty) {
        // Method 2 worked
        firestoreUserData = querySnapshotById.docs[0].data();
      } else if (!querySnapshotByEmail.empty) {
        // Method 3 worked
        firestoreUserData = querySnapshotByEmail.docs[0].data();
      } else {
        throw new Error(
          `User document not found in database. UID: ${user.uid}, Email: ${user.email}`
        );
      }

      // Get subscription data
      const subscriptionsRef = collection(db, "subscriptions");
      const subQuery = query(
        subscriptionsRef,
        where("uid", "==", user.uid),
        where("status", "==", "active")
      );
      const subSnapshot = await getDocs(subQuery);

      let productId: string | null = null;
      let interval: string = "";

      if (!subSnapshot.empty) {
        const subData = subSnapshot.docs[0].data();
        productId = subData.productId || null;
        interval = subData.interval || "";
      }

      const userPayload = {
        email: user.email,
        name: user.displayName,
        photoUrl: user.photoURL,
        accessToken,
        userRole: firestoreUserData.userRole,
        productId: firestoreUserData.productId || productId,
        interval,
        id: user.uid,
      };

      dispatch(isLogin(true));
      dispatch(setUserNameLists(userPayload));
      setUserRoleContext(firestoreUserData.userRole);
      saveUserToLocalStorage(userPayload);
      saveTokenToLocalStorage(accessToken);
      localStorage.setItem("userDatas", JSON.stringify(userPayload));

      setTitle("Sign In");
      setMessage("You have successfully signed in.");
      setToastType("success");
      setShowToast(true);

      setTimeout(() => {
        setShowToast(false);
        setIsButtonDisabled(false);
        if (firestoreUserData.userRole === "admin") {
          router.push("/admin");
          setIsLogginIn(false);
        } else {
          router.push("/");
          setIsLogginIn(false);
          return;
        }
      }, 3000);
    } catch (error) {
      const firebaseError = error as FirebaseError;
      setTitle("Sign In Failed");
      setMessage(
        firebaseError.message || "Invalid credentials or user not found."
      );
      setToastType("error");
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        setIsButtonDisabled(false);
        setIsLogginIn(false);
      }, 3000);
    }
  };

  // Create a simple JWT-like token
  const createSimpleToken = (
    payload: Omit<TokenPayload, "iat" | "exp" | "iss" | "aud">,
    secret: string,
    expiresInSeconds: number = 20
  ): string => {
    const header: TokenHeader = {
      alg: "HS256",
      typ: "JWT",
    };

    const now: number = Math.floor(Date.now() / 1000);
    const tokenPayload: TokenPayload = {
      ...payload,
      iat: now,
      exp: now + expiresInSeconds,
      iss: "bakr-app",
      aud: "bakr-users",
    };

    try {
      // Base64 encode header and payload
      const encodedHeader: string = btoa(JSON.stringify(header));
      const encodedPayload: string = btoa(JSON.stringify(tokenPayload));

      // Create signature (simplified - in production use proper HMAC)
      const signatureData: string = `${encodedHeader}.${encodedPayload}.${secret}`;
      const signature: string = btoa(signatureData);

      return `${encodedHeader}.${encodedPayload}.${signature}`;
    } catch (error) {
      console.error("Error creating token:", error);
      throw new Error("Failed to create token");
    }
  };

  const handleGoogleSignIn = async () => {
    setIsEmailButtonDisabled(true);
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

        // Create simple token with TypeScript types
        try {
          const secret: string =
            process.env.NEXT_PUBLIC_JWT_SECRET || "your-secret-key";
          const tokenPayload = {
            uid: user.uid,
            email: user.email,
            userRole: firestoreUserData.userRole,
            name: user.displayName,
          };

          const simpleToken: string = createSimpleToken(
            tokenPayload,
            secret,
            20
          );

          const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

          // Store token in cookiel
          Cookies.set("auth_token", simpleToken, {
            expires: expirationDate, // 24 hours in milliseconds
            // expires: new Date(Date.now() + 30 * 1000), // 30 hours in milliseconds
            // secure: process.env.NODE_ENV === "production",
            // expires: 7,
            secure: true, // Set to false for testing
            sameSite: "strict",
            path: "/",
          });

          localStorage.setItem(
            "auth_token_expiration",
            expirationDate.toISOString()
          );
        } catch (tokenError) {
          console.error("Token creation error:", tokenError);
        }

        if (firestoreUserData.userRole === "customer") {
          setTitle("Sign In");
          setMessage("You have successfully signed in.");
          setToastType("success");
          setShowToast(true);
          setTimeout(() => {
            dispatch(setUserNameLists(userPayload));
            localStorage.setItem("userDatas", JSON.stringify(userPayload));
            // Clear any other session data or perform additional cleanup if needed
            setIsEmailButtonDisabled(false);
            setShowToast(false);
            // Redirect to sign-in page or any other page as needed
            router.push("/");
          }, 3000);
        } else if (firestoreUserData.userRole === "admin") {
          setTitle("Sign In");
          setMessage("You have successfully signed in.");
          setToastType("success");
          setShowToast(true);
          setTimeout(() => {
            dispatch(setUserNameLists(userPayload));
            localStorage.setItem("userDatas", JSON.stringify(userPayload));
            // Clear any other session data or perform additional cleanup if needed
            setIsEmailButtonDisabled(false);
            setShowToast(false);
            // Redirect to sign-in page or any other page as needed
            router.push("/admin/generatelink");
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
          setIsEmailButtonDisabled(false);
          // Redirect to sign-in page or any other page as needed
          return;
        }, 3000);
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      alert("An error occurred during sign in. Please try again.");
    }
    setIsEmailButtonDisabled(false);
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
        duration={3000} // 3 seconds
        autoClose={true}
      />

      {/* Left side - Sign in form */}
      <div className="w-full lg:w-2/3 flex items-center px-8 py-12 bg-white">
        <div className="w-full max-w-md ml-16">
          <h2 className="text-4xl  font-playfair font-bold text-gray-900">
            Sign in to your account
          </h2>

          <form
            suppressHydrationWarning={true}
            key={isHydrated ? "hydrated" : "server"}
            className="mt-8 space-y-6"
            action="#"
            method="POST"
          >
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
                    suppressHydrationWarning={true}
                    key={isHydrated ? "hydrated" : "server"}
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
                  disabled={isButtonDisabled || isLogginIn}
                  type="submit"
                  onClick={handleEmailSignIn}
                  className={`w-full px-4 py-2 ${
                    isButtonDisabled ? "cursor-not-allowed" : "cursor-pointer"
                  } text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                  {isLogginIn ? (
                    <div className="flex w-full justify-center font-bold font-serif">
                      <LoadingSpinnerComponent />
                      Signing In
                    </div>
                  ) : (
                    <span> Sign in</span>
                  )}
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
                disabled={isEmailButtonDisabled}
                onClick={handleGoogleSignIn}
                type="button"
                className={`${
                  isEmailButtonDisabled
                    ? "cursor-not-allowed"
                    : "cursor-pointer"
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
      <div className="hidden lg:block w-full relative">
        <Image
          src={loginImage}
          alt="Modern workspace with laptop, phone, and accessories on a clean desk"
          className="w-full h-full object-cover"
          fill
        />
      </div>
    </div>
  );
};

export default SignInPage;
