// components/PublicRoute.tsx
"use client";

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  return <>{children}</>;
};

export default PublicRoute;
