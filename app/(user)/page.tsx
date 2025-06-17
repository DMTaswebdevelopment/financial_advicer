// import LandingPage from "./landingpage/page";
"use client";

import LandingPage from "./landingpage/page";
import Footer from "@/component/ui/footer/Footer";
import PublicRoute from "@/components/routes/PublicRoutes/PublicRoute";
import { usePathname } from "next/navigation";

export default function UserHome() {
  const pathname = usePathname();

  const hideFooter = pathname === "/searchresult";

  return (
    <PublicRoute>
      <LandingPage />

      {!hideFooter && <Footer />}
    </PublicRoute>

    // <LandingPage />
  );
}
