"use client";

import { usePathname } from "next/navigation";
import React from "react";
import AdminNavbar from "./AdminNavbar";
import Navbar from "./Navbar";

const NavbarChecker = () => {
  const pathname = usePathname();

  // Check if the path starts with "/admin"
  const isAdmin = pathname.startsWith("/admin");

  return isAdmin ? <AdminNavbar /> : <Navbar />;
};

export default NavbarChecker;
