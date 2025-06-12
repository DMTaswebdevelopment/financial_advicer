// import LandingPage from "./landingpage/page";
"use client";

import LandingPage from "./landingpage/page";
import Footer from "@/component/ui/footer/Footer";
import { usePathname } from "next/navigation";

export default function UserHome() {
  const pathname = usePathname();

  const hideFooter = pathname === "/searchresult";

  return (
    <>
      <LandingPage />

      {!hideFooter && <Footer />}
    </>

    // <LandingPage />
  );
}
