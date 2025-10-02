"use client";

import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { TopNavigationModel } from "@/component/model/interface/TopNavigationModel";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { Fragment } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const TopNavigationComponent = (props: TopNavigationModel) => {
  const route = useRouter();
  // declare states here...

  const handleSignOut = () => {
    // Remove the token from localStorage
  };

  return (
    <>
      <div className="sticky top-0 z-10 flex h-auto p-6  shrink-0 items-center gap-x-4 border-b border-gray-200px-4 shadow-sm bg-white sm:gap-x-6 sm:px-6 lg:px-8">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">Your Company</span>
            <Image
              alt="logo"
              src="https://res.cloudinary.com/dmz8tsndt/image/upload/v1755063722/BAKR_New_Logo-01_fldmxk.svg"
              className="w-40 h-16"
              width={200}
              height={200}
            />
          </Link>
        </div>
        <button
          type="button"
          className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
          onClick={() => props.setSidebarOpen?.(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
        {/* Separator */}
        <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <form className="relative flex flex-1" action="#" method="GET"></form>
          <div className="flex items-center gap-x-4 lg:gap-x-6">
            {/* Separator */}
            <div
              className="hidden lg:block md:h-6 md:w-px md:bg-gray-200"
              aria-hidden="true"
            />
            <span className={` font-extrabold text-sm text-red-500`}>test</span>

            {/* Separator */}
            <div
              className="hidden lg:block md:h-6 md:w-px md:bg-gray-200"
              aria-hidden="true"
            />

            {/* Profile dropdown */}
            <Menu as="div" className="relative">
              <Menu.Button className="-m-1.5 flex items-center p-1.5">
                <span className="sr-only">Open user menu</span>
                <img
                  className="h-8 w-8 rounded-full bg-gray-50"
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt="temporary_logo"
                />
                <span className="hidden lg:flex lg:items-center">
                  <span
                    className="ml-4 text-sm font-semibold leading-6 text-gray-900"
                    aria-hidden="true"
                  >
                    {/* {fullname} */} test
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
                  {props.userNavigation.map((item) => (
                    <Menu.Item key={item.name}>
                      {({ active }) => (
                        <span
                          onClick={() => {
                            // if signout is being clicked, lets clear the sessionData slice
                            if (item.name === "Sign out") {
                              handleSignOut();
                            }

                            // do the callback
                            item.callback();
                            // then redirect
                            route.push(item.href);
                          }}
                          className={`block px-3 py-1 text-sm leading-6 ${
                            active
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-700"
                          }  cursor-pointer`}
                        >
                          {item.name}
                        </span>
                      )}
                    </Menu.Item>
                  ))}
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </>
  );
};

export default TopNavigationComponent;
