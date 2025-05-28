"use client";
import { useEffect, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { User } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";

const HOME_ROUTE = "/";
const ACCOUNT_ROUTE = "/account";

// List of public routes (accessible without auth)
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/pricepage"];

interface AuthRouterProps {
  children: ReactNode;
}

const AuthRouter = ({ children }: AuthRouterProps) => {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const pathName = usePathname();

  const isPublicRoute = (path: string) => {
    return PUBLIC_ROUTES.includes(path);
  };

  const redirect = (
    isLoading: boolean,
    firebaseUser: User | null | undefined
  ) => {
    if (isLoading) return;

    const isPublic = isPublicRoute(pathName);

    if (!firebaseUser && !isPublic) {
      // Unauthenticated trying to access protected route
      router.push(HOME_ROUTE); // or `/login`
    }

    if (firebaseUser && isPublic) {
      // Authenticated trying to access login/signup page
      router.push(ACCOUNT_ROUTE);
    }
  };

  useEffect(() => {
    redirect(loading, user);
  }, [loading, user, pathName, redirect]);

  if (loading) return null;

  return <>{children}</>;
};

export default AuthRouter;
