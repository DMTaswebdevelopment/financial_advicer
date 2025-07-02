"use client";

import { UserNameListType } from "@/component/model/types/UserNameListType";
import { getUsers } from "@/redux/storageSlice";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";

export function useAdminAuth() {
  const userData: UserNameListType = useSelector(getUsers);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isAdmin = userData?.userRole === "admin";
  const isLoading = !isClient;

  return {
    userData,
    isAdmin,
    isLoading,
    isClient,
  };
}
