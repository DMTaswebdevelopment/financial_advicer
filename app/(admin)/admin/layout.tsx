import PrivateRoute from "@/components/routes/PrivateRoutes/PrivateRoute";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Financial Advice",
  description:
    "Get accurate answers to your complex financial questions with our AI-powered advisory tool.",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PrivateRoute>{children}</PrivateRoute>;
}
