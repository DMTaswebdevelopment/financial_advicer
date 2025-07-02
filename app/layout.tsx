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

        <meta
          name="format-detection"
          content="telephone=no, date=no, email=no, address=no"
        />
      </head>
      {/**/}
      <body className=" bg-[#FFF3E5]  flex flex-col justify-between ">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
