"use client";

import { usePathname } from "next/navigation";
import React from "react";
import Footer from "./Footer";

const FooterChecker = () => {
  const pathname = usePathname();

  const current = pathname.split("/").pop();
  return current == "searchresult" || "admin" ? "" : <Footer />;
};

export default FooterChecker;
