"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RedirectComponent() {
  const router = useRouter();

  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      router.push("/");
    }, 1000);

    // Cleanup function to clear timeout if component unmounts
    return () => clearTimeout(redirectTimer);
  }, [router]);

  return null; // This component doesn't render anything visible
}
