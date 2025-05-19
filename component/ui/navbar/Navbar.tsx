"use client";

import React, { use, useEffect, useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Button } from "@/components/ui/button";

import {
  Bars3Icon,
  ChevronDownIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import {
  getIsPDFFetching,
  getUsers,
  setIsPDFFetching,
  setPDFLists,
  setUserNameLists,
} from "@/redux/storageSlice";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/context/authContext";
import { NavigationContext } from "@/lib/NavigationProvider";

const navigation = [
  { name: "Product", href: "#" },
  { name: "About Us", href: "#" },
  // { name: "Marketplace", href: "#" },
  // { name: "Company", href: "#" },
];

const Navbar = () => {
  const { setIsMobileNavOpen, isMobileNavOpen } = use(NavigationContext);

  console.log("isMobileNavOpen", isMobileNavOpen);
  const dispatch = useDispatch();
  const { userRole } = useUser();
  const router = useRouter(); // 👈 For navigation
  const userDatas = useSelector(getUsers); // 👈 Reads from Redux
  const isLoggedIn = userDatas?.photoUrl && userDatas?.name;

  console.log("userRole", userRole);
  // const pdfList = useSelector(getPDFList);
  const isPDFFetching = useSelector(getIsPDFFetching);

  console.log("isPDFFetching", isPDFFetching);
  useEffect(() => {
    if (isPDFFetching) {
      const fetchPdfs = async () => {
        const res = await fetch("/api/fetch-pdfs");
        const response = await res.json();
        dispatch(setPDFLists(response.validFiles)); // Set list
        dispatch(setIsPDFFetching(false));
        console.log("data", response);
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
    if (typeof window !== "undefined") {
      const storedUserData = localStorage.getItem("userData");

      if (storedUserData) {
        try {
          const parsedUserData = JSON.parse(storedUserData);
          console.log("parsedUserData", parsedUserData);

          dispatch(setUserNameLists(parsedUserData));
        } catch (error) {
          console.error("Error parsing userData from localStorage:", error);
        }
      }
    }
  }, [dispatch]);

  const logoutHandler = () => {
    localStorage.removeItem("userData"); // Clear from localStorage
    dispatch(
      setUserNameLists({
        email: "",
        name: "",
        photoUrl: "",
        accessToken: "",
        id: "",
      })
    ); // Clear from Redux
    router.push("/login"); // Redirect to login
  };

  console.log("userData", userDatas);

  return (
    <div>
      <header className="inset-x-0 top-0 z-50">
        <nav
          aria-label="Global"
          className="flex items-center justify-between p-6 lg:px-8"
        >
          <div className="flex lg:flex-1">
            <Link href="/" className="-m-1.5 p-1.5">
              <span className="sr-only">Your Company</span>
              <Image
                alt=""
                src="https://res.cloudinary.com/dmz8tsndt/image/upload/v1744783942/ChatGPT_Image_Apr_11_2025_12_40_55_PM_copy_b5f0do.jpg"
                width={80}
                height={80}
                className="h-20 w-20"
              />
            </Link>
          </div>
          <div className="flex lg:hidden">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsMobileNavOpen(true)}
              className="-m-2.5 inline-flex bg-blue-500 items-center justify-center rounded-md p-2.5 text-gray-700 cursor-pointer"
            >
              <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="size-6" />
            </Button>
          </div>
          <div className="hidden lg:flex lg:gap-x-12">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm/6 font-semibold text-gray-900"
              >
                {item.name}
              </Link>
            ))}
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end">
            {isLoggedIn ? (
              <div className="flex items-center">
                <Image
                  src={userDatas.photoUrl || ""}
                  alt="profile"
                  width={6}
                  height={6}
                  className="h-6 w-6 mr-2 rounded-full object-cover"
                />
                <span className="text-xs max-w-[100px] truncate block">
                  {userDatas.name}
                </span>
                <button className="cursor-pointer" onClick={logoutHandler}>
                  <ChevronDownIcon className="w-4 h-6 ml-2 text-black" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm/6 font-semibold text-gray-900"
              >
                Log in <span aria-hidden="true">&rarr;</span>
              </Link>
            )}
          </div>
        </nav>
        <Dialog
          open={isMobileNavOpen}
          onClose={setIsMobileNavOpen}
          className="lg:hidden"
        >
          <div className="fixed inset-0 z-50" />
          <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
            <div className="flex items-center justify-between">
              <Link href="/" className="-m-1.5 p-1.5">
                <span className="sr-only">Your Company</span>
                <Image
                  alt=""
                  src="https://res.cloudinary.com/dmz8tsndt/image/upload/v1744783942/ChatGPT_Image_Apr_11_2025_12_40_55_PM_copy_b5f0do.jpg"
                  width={80}
                  height={80}
                  className="h-20 w-20"
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
                <div className="space-y-2 py-6">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
                <div className="py-6">
                  {userDatas?.photoUrl ? (
                    <div className="">
                      <Image
                        src={userDatas.photoUrl}
                        alt="profile"
                        height={10}
                        width={10}
                        className="h-10 w-10 rounded-full object-cover"
                      />

                      <span>{userDatas.name}</span>
                    </div>
                  ) : (
                    <Link
                      href="/login"
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                    >
                      Log in
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </DialogPanel>
        </Dialog>
      </header>
    </div>
  );
};

export default Navbar;
