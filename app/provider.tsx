// app/providers.tsx
"use client";

import { Provider } from "react-redux";
import { store } from "@/redux/store";
import { AuthProvider } from "./context/authContext";
import { NavigationProvider } from "@/lib/NavigationProvider";
import FooterChecker from "@/component/ui/footer/FooterChecker";
import NavbarChecker from "@/component/ui/navbar/NavbarChecker";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthProvider>
        <NavigationProvider>
          <NavbarChecker />
          {children}
          <FooterChecker />
        </NavigationProvider>
      </AuthProvider>
    </Provider>
  );
}
