import type { Metadata } from "next";

// app/layout.js
import "./globals.css";

import { Providers } from "./provider";

export const metadata: Metadata = {
  title: "Financial Advice",
  description:
    "Get accurate answers to your complex financial questions with our AI-powered advisory tool.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
