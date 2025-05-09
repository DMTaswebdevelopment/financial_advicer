// app/providers.tsx
"use client";

import { Provider } from "react-redux";
import { store } from "@/redux/store";
import { AuthProvider } from "./context/authContext";
import Navbar from "@/component/ui/navbar/Navbar";
import Footer from "@/component/ui/footer/Footer";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthProvider>
        <Navbar />
        {children}
        <Footer />
      </AuthProvider>
    </Provider>
  );
}
