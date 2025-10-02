"use client";

import FullPageLoader from "@/component/ui/fullPageLoader/FullPageLoader";
import RedirectComponent from "@/components/routes/RedirectComponent/RedirectComponent";
import { useAdminAuth } from "@/lib/useAdminAuth";

interface AdminLayoutClientProps {
  children: React.ReactNode;
}

export default function AdminLayoutClient({
  children,
}: AdminLayoutClientProps) {
  const { isAdmin, isLoading } = useAdminAuth();

  // // 1) While loading, just show the loader (NO redirect yet)
  if (isLoading) {
    return <FullPageLoader />;
  }

  // 2) After loading, if not admin, then redirect
  if (!isAdmin) {
    return <RedirectComponent />; // or whatever your component expects
  }

  return <>{children}</>;
}
