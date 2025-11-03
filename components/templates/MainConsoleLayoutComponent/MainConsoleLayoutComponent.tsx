"use client";

import { MainConsoleLayoutModel } from "@/component/model/interface/MainConsoleLayout";
import React, { useState } from "react";
import PageContentComponent from "../PageContentComponent/PageContentComponent";
import TopNavigationComponent from "@/app/navigation/TopNavigationComponent";
import SideBarComponentDesktop from "@/app/navigation/sidebar/SideBarComponentDesktop";
import { ChartBarIcon } from "lucide-react";

const MainConsoleLayoutComponent = (props: MainConsoleLayoutModel) => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const [userRole] = useState<string>("admin");

  // side Navigations based on user roles (start)

  const admin_side_navigation = [
    {
      name: "Analytics",
      href: "/a/analytics",
      icon: ChartBarIcon,
      current: true,
    },
  ];

  const prevTransactions = [
    { id: 1, name: "Heroicons", href: "/", initial: "H", current: false },
    { id: 2, name: "Tailwind Labs", href: "/", initial: "T", current: false },
    { id: 3, name: "Workcation", href: "/", initial: "W", current: false },
  ];

  const userNavigation = [
    {
      name: "Sign out",
      href: "/",
      callback: () => {
        // destoryTokenFromLocalStorage();
        // removeLocalStorageData();
      },
    },
  ];

  const identifyMenu = (userRole: string) => {
    switch (userRole) {
      case "administrator":
        return admin_side_navigation;
      default:
        return [];
    }
  };

  return (
    <>
      <PageContentComponent
        content={{
          content: (
            <>
              {/* embed sidebar for desktop */}
              <SideBarComponentDesktop
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                mainMenu={identifyMenu(userRole)}
                subMenu={prevTransactions}
              />

              <div className="lg:pl-72">
                {/* embed top navigation for all devices */}
                <TopNavigationComponent
                  userNavigation={userNavigation}
                  setSidebarOpen={setSidebarOpen}
                  sidebarOpen={sidebarOpen}
                />

                <main className="py-4">
                  <div>{props.head_banner}</div>
                  <div className="px-4 sm:px-6 lg:px-8">
                    {/* import the content here... */}
                    {props.content}
                  </div>
                </main>
              </div>
            </>
          ),
        }}
      />
    </>
  );
};

export default MainConsoleLayoutComponent;
