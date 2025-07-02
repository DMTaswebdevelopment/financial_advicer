// app/providers.tsx
"use client";

import { Provider } from "react-redux";
import { store } from "@/redux/store";
import { AuthProvider } from "./context/authContext";
import { NavigationProvider } from "@/lib/NavigationProvider";
import Navbar from "@/component/ui/navbar/Navbar";
import Footer from "@/component/ui/footer/Footer";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [isSearchResult, setIsSearchResult] = useState(false);

  useEffect(() => {
    if (path === "/searchresult") {
      setIsSearchResult(true);
    }
  }, [path]);

  return (
    <Provider store={store}>
      <AuthProvider>
        <NavigationProvider>
          <Navbar />
          {children}
          {isSearchResult ? "" : <Footer />}
        </NavigationProvider>
      </AuthProvider>
    </Provider>
  );
}
