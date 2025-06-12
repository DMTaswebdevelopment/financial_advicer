// app/providers.tsx
"use client";

import { Provider } from "react-redux";
import { store } from "@/redux/store";
import { AuthProvider } from "./context/authContext";
import { NavigationProvider } from "@/lib/NavigationProvider";
import Navbar from "@/component/ui/navbar/Navbar";
// import AuthRouter from "./authRouter.tsx/authRouter";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthProvider>
        <NavigationProvider>
          <Navbar />
          {children}
        </NavigationProvider>
      </AuthProvider>
    </Provider>
  );
}
