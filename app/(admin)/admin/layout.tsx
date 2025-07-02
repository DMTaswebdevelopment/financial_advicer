import type { Metadata } from "next";
import AdminLayoutClient from "./AdminLayoutClient";

export const metadata: Metadata = {
  title: "Financial Advice",
  description:
    "Get accurate answers to your complex financial questions with our AI-powered advisory tool.",
};

export default function AdminLayout({
  children,
  dashboard,
}: Readonly<{
  children: React.ReactNode;
  dashboard: React.ReactNode;
}>) {
  return (
    <AdminLayoutClient dashboard={dashboard}>{children}</AdminLayoutClient>
  );
}
