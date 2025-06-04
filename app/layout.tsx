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
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-screen bg-[#FFF3E5]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
