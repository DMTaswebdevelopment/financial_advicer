"use client";

import SideBarComponentDesktop from "@/app/navigation/sidebar/SideBarComponentDesktop";
import TopNavigationComponent from "@/app/navigation/TopNavigationComponent";
import { ChartBarIcon, Link } from "lucide-react";
import React, { useState } from "react";

const AdminNavbar = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const [userRole] = useState<string>("admin");

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

  const admin_side_navigation = [
    {
      name: "Upload MD Files",
      href: "/admin/mdfile",
      icon: ChartBarIcon,
      current: true,
    },
    {
      name: "Generate MD Link",
      href: "/admin/generatelink",
      icon: Link,
      current: false,
    },
  ];

  const identifyMenu = (userRole: string) => {
    switch (userRole) {
      case "admin":
        return admin_side_navigation;
      default:
        return [];
    }
  };

  const prevTransactions = [
    { id: 1, name: "Heroicons", href: "/", initial: "H", current: false },
    { id: 2, name: "Tailwind Labs", href: "/", initial: "T", current: false },
    { id: 3, name: "Workcation", href: "/", initial: "W", current: false },
  ];

  return (
    <>
      {/* embed sidebar for desktop */}
      <SideBarComponentDesktop
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        mainMenu={identifyMenu(userRole)}
        subMenu={prevTransactions}
      />

      <TopNavigationComponent
        sidebarOpen={sidebarOpen}
        userNavigation={userNavigation}
        setSidebarOpen={setSidebarOpen}
      />
    </>
  );
};

export default AdminNavbar;
