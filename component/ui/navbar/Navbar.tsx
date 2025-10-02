"use client";

import React, { use, useEffect, Fragment, useState, useRef } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { Menu, Transition } from "@headlessui/react";
import {
  Bars3Icon,
  ChevronDownIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import Image from "next/image";
import {
  useDispatch,
  useSelector,
  //  useSelector
} from "react-redux";
import {
  getisLogin,
  getIsPDFFetching,
  // getPDFList,
  setIsPDFFetching,
  setPDFLists,
  setUserNameLists,
} from "@/redux/storageSlice";
import { useRouter } from "next/navigation";
import { NavigationContext } from "@/lib/NavigationProvider";

import { classNames, getUserLocalStorage } from "@/functions/function";
import ToasterComponent from "@/components/templates/ToastMessageComponent/ToastMessageComponent";
import { useUser } from "@/app/context/authContext";
import { UserNameListType } from "@/component/model/types/UserNameListType";

const Navbar = () => {
  const userLogin = useSelector(getisLogin);

  const [isHydrated, setIsHydrated] = useState(false);
  const [userData, setUserData] = useState<UserNameListType | null>(null);

  const { userRole } = useUser();
  const { setIsMobileNavOpen, isMobileNavOpen } = use(NavigationContext);

  // toast state message (start) ==========================================>
  const [showToast, setShowToast] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [toastType, setToastType] = useState<ToastType>("success");
  // toast state message (start) ==========================================>

  // Auto logout timer ref
  const autoLogoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  // declare navigation
  const router = useRouter(); // 👈 For navigation
  const dispatch = useDispatch();

  // const pdfList = useSelector(getPDFList);
  const isPDFFetching = useSelector(getIsPDFFetching);

  const userNavigation = [
    {
      name: "Profile",
      href: "/profile",
      callback: () => {},
    },
    {
      name: "Sign out",
      href: "/login",
      callback: () => {
        localStorage.removeItem("userDatas"); // clear localStorage
        dispatch(
          setUserNameLists({
            email: "",
            name: "",
            interval: "",
            photoUrl: "",
            accessToken: "",
            id: "",
            userRole: "",
          })
        );
      },
    },
  ];

  const performAutoLogout = () => {
    // Clear localStorage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userDatas");
    localStorage.removeItem("userRole");

    // Clear Redux state
    dispatch(
      setUserNameLists({
        email: "",
        name: "",
        interval: "",
        photoUrl: "",
        accessToken: "",
        id: "",
        userRole: "",
      })
    );

    // Update local state
    setUserData(null);

    // Show timeout message (optional)
    setMessage("Session timed out. Please log in again.");
    setToastType("warning");
    setTitle("Session Expired");
    setShowToast(true);

    // Redirect to login after a brief delay
    setTimeout(() => {
      setShowToast(false);
      router.push("/login");
    }, 2000);
  };

  // Start auto logout timer
  const startAutoLogoutTimer = () => {
    // Clear existing timer if any
    if (autoLogoutTimerRef.current) {
      clearTimeout(autoLogoutTimerRef.current);
    }

    // Set new timer for 1 day (24 hours)
    autoLogoutTimerRef.current = setTimeout(() => {
      performAutoLogout();
    }, 24 * 60 * 60 * 1000); // 24 hours (1 day)

    // Set new timer for 30 seconds
    // autoLogoutTimerRef.current = setTimeout(() => {
    //   performAutoLogout();
    // }, 30000); // 30 seconds
  };

  // Reset auto logout timer (call this on user activity)
  const resetAutoLogoutTimer = () => {
    if (userData) {
      startAutoLogoutTimer();
    }
  };

  // User activity events to reset timer
  useEffect(() => {
    if (!userData) return;

    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    const resetTimer = () => resetAutoLogoutTimer();

    // Add event listeners for user activity
    activityEvents.forEach((event) => {
      document.addEventListener(event, resetTimer, true);
    });

    // Start the initial timer
    startAutoLogoutTimer();

    // Cleanup function
    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, resetTimer, true);
      });
      if (autoLogoutTimerRef.current) {
        clearTimeout(autoLogoutTimerRef.current);
      }
    };
  }, [userData]);

  useEffect(() => {
    if (isPDFFetching) {
      const fetchPdfs = async () => {
        const res = await fetch("/api/fetch-pdfs");
        const response = await res.json();
        if (response.statusCode === 200) {
          dispatch(setPDFLists(response.validFiles)); // Set list
          dispatch(setIsPDFFetching(false));
        }
        dispatch(setIsPDFFetching(false));
      };
      fetchPdfs();
    }
  }, [isPDFFetching, dispatch]);

  useEffect(() => {
    if (!userRole || userRole === "") {
      return;
    }
  }, [userRole]);

  // Handle hydration and localStorage access
  useEffect(() => {
    // Set hydrated to true once component mounts (client-side)
    setIsHydrated(true);

    const storedUserData = getUserLocalStorage();
    setUserData(storedUserData);

    if (storedUserData) {
      dispatch(setUserNameLists(storedUserData));
    }
  }, [dispatch, userLogin]);

  const logoutHandler = () => {
    setMessage("Successfully Sign out");
    setToastType("success");
    setTitle("Well Done");
    setShowToast(true);
    setTimeout(() => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userDatas"); // Clear from localStorage
      localStorage.removeItem("userRole"); // Clear from localStorage
      // Clear any other session data or perform additional cleanup if needed

      dispatch(
        setUserNameLists({
          email: "",
          name: "",
          photoUrl: "",
          interval: "",
          accessToken: "",
          id: "",
          userRole: "",
        })
      ); // Clear from Redux
      setShowToast(false);
      // Update local state
      setUserData(null);
      // Redirect to sign-in page or any other page as needed
      router.push("/login");
    }, 3000);
  };

  return (
    <header className="inset-x-0 top-0 z-50 md:px-16">
      <nav
        aria-label="Global"
        className="flex items-center justify-between p-6 lg:px-8"
      >
        <ToasterComponent
          isOpen={showToast}
          title={title}
          message={message}
          onClose={setShowToast}
          type={toastType}
          duration={3000} // 3 seconds
          autoClose={true}
        />
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">Your Company</span>
            <Image
              alt="logo"
              src="https://res.cloudinary.com/dmz8tsndt/image/upload/v1755063722/BAKR_New_Logo-01_fldmxk.svg"
              className="w-40 h-full"
              width={200}
              height={200}
            />
          </Link>
        </div>
        <div className="flex lg:hidden">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsMobileNavOpen(true)}
            className="-m-2.5 inline-flex bg-black items-center justify-center rounded-md p-2.5 text-white cursor-pointer"
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon aria-hidden="true" className="size-6" />
          </Button>
        </div>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          {/* Profile dropdown */}
          <div className="flex items-center space-x-5 font-semibold text-gray-900 font-sans">
            <Link
              href="/privacypage"
              className="text-base cursor-pointer hover:text-blue-500"
            >
              <span>Privacy Policy</span>
            </Link>
            <div className="text-base">
              <span>Account</span>
            </div>
            {/* Only render user-specific content after hydration */}
            {!isHydrated ? (
              // Placeholder during hydration to prevent layout shift
              <Link href="/login" className="text-base ">
                Log in <span aria-hidden="true">&rarr;</span>
              </Link>
            ) : userData ? (
              <div className="flex items-center">
                <Menu as="div" className="relative">
                  <Menu.Button className="-m-1.5 flex items-center p-1.5">
                    <span className="sr-only">Open user menu</span>

                    <Image
                      className="h-8 w-8 rounded-full bg-gray-50"
                      src={userData.photoUrl || "/profile/avatar1.png"}
                      height={8}
                      width={8}
                      alt="temporary_logo"
                    />
                    <span className="hidden lg:flex lg:items-center">
                      <span
                        className="ml-4 text-sm font-semibold leading-6 text-gray-900"
                        aria-hidden="true"
                      >
                        {userData?.email}
                      </span>
                      <ChevronDownIcon
                        className="ml-2 h-5 w-5 text-gray-400"
                        aria-hidden="true"
                      />
                    </span>
                  </Menu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                      {userNavigation.map((item) => (
                        <Menu.Item key={item.name}>
                          {({ active }) => (
                            <button
                              onClick={() => {
                                // if signout is being clicked, lets clear the sessionData slice
                                if (item.name === "Sign out") {
                                  logoutHandler();
                                  return; // Don't navigate immediately, logoutHandler handles it
                                }

                                // do the callback
                                item.callback();
                                // then redirect
                                router.push(item.href);
                              }}
                              className={classNames(
                                active ? "bg-gray-50" : "",
                                "block px-3 py-1 text-sm leading-6 text-gray-900 cursor-pointer"
                              )}
                            >
                              {item.name}
                            </button>
                          )}
                        </Menu.Item>
                      ))}
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            ) : (
              <Link href="/login" className="text-base ">
                Log in <span aria-hidden="true">&rarr;</span>
              </Link>
            )}
          </div>
        </div>
      </nav>
      <Dialog
        open={isMobileNavOpen}
        onClose={setIsMobileNavOpen}
        className="lg:hidden"
      >
        <div className="fixed inset-0 z-50" />
        <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-[#FFF3E5] px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="flex items-center justify-between">
            <Link href="/" className="-m-1.5 p-1.5">
              <span className="sr-only">Your Company</span>
              <Image
                alt="logo"
                src="https://res.cloudinary.com/dmz8tsndt/image/upload/v1754529768/BAKR_New_Logo_nvcv0m.svg"
                width={80}
                height={80}
                className="h-16 w-20"
              />
            </Link>
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(false)}
              className="-m-2.5 rounded-md p-2.5 text-gray-700"
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon aria-hidden="true" className="size-6" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10">
              <div className="py-6">
                {isHydrated && userData?.photoUrl ? (
                  <div className="">
                    <Image
                      src={userData.photoUrl}
                      alt="profile"
                      height={10}
                      width={10}
                      className="h-10 w-10 rounded-full object-cover"
                    />

                    <span>{userData.name}</span>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                  >
                    Log in
                  </Link>
                )}

                <Link
                  href="/#"
                  className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                >
                  Account
                </Link>
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  );
};

export default Navbar;
