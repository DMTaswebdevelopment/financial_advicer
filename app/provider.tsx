// app/providers.tsx
"use client";

import { Provider } from "react-redux";
import { store } from "@/redux/store";
import { AuthProvider } from "./context/authContext";
import Navbar from "@/component/ui/navbar/Navbar";
import Footer from "@/component/ui/footer/Footer";
import { NavigationProvider } from "@/lib/NavigationProvider";
import { usePathname } from "next/navigation";
// import AuthRouter from "./authRouter.tsx/authRouter";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hideFooter = pathname === "/searchresult";

  return (
    <Provider store={store}>
      <AuthProvider>
        <NavigationProvider>
          {/* <AuthRouter> */}

          <Navbar />
          {children}
          {!hideFooter && <Footer />}
          {/* </AuthRouter> */}
        </NavigationProvider>
      </AuthProvider>
    </Provider>
  );
}
