"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import FullPageLoader from "@/component/ui/fullPageLoader/FullPageLoader";
import { getUserLocalStorage } from "@/functions/function";
import { UserNameListType } from "@/component/model/types/UserNameListType";

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  useEffect(() => {
    const userData: UserNameListType | null = getUserLocalStorage();

    if (userData) {
      try {
        if (userData.userRole === "admin") {
          setIsAuthorized(true);
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
        router.push("/login");
      }
    } else {
      router.push("/login");
    }

    // Stop the loader in all cases
    setIsLoading(false);
  }, [router, pathname]);

  if (isLoading) {
    return <FullPageLoader />;
  }

  // Show nothing if not authorized
  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
};

export default PrivateRoute;
