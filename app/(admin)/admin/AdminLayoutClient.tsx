"use client";

import FullPageLoader from "@/component/ui/fullPageLoader/FullPageLoader";
import RedirectComponent from "@/components/routes/RedirectComponent/RedirectComponent";
import { useAdminAuth } from "@/lib/useAdminAuth";

interface AdminLayoutClientProps {
  children: React.ReactNode;
  dashboard: React.ReactNode;
}

export default function AdminLayoutClient({
  children,
  dashboard,
}: AdminLayoutClientProps) {
  const { isAdmin, isLoading } = useAdminAuth();

  if (isLoading || !isAdmin) {
    return (
      <>
        <FullPageLoader />
        <RedirectComponent />
      </>
    );
  }

  return (
    <>
      {children}
      {dashboard}
    </>
  );
}
