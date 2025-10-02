"use client";

import { UserNameListType } from "@/component/model/types/UserNameListType";
import { getUsers } from "@/redux/storageSlice";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";

export function useAdminAuth() {
  const userData: UserNameListType = useSelector(getUsers);
  const [isClient, setIsClient] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);

    // If no role in Redux, fallback to localStorage
    if (!userData?.userRole) {
      const localRole = localStorage.getItem("userRole");
      setRole(localRole);
    } else {
      setRole(userData.userRole);
    }
  }, [userData?.userRole]);

  const isAdmin = role === "admin";
  const isLoading = !isClient;
  return {
    userData,
    isAdmin,
    isLoading,
    isClient,
  };
}
