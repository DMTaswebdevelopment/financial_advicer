import PublicRoute from "@/components/routes/PublicRoutes/PublicRoute";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Financial Advice",
  description:
    "Get accurate answers to your complex financial questions with our AI-powered advisory tool.",
};

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PublicRoute>{children}</PublicRoute>;
}
