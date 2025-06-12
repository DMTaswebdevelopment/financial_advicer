import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";

// Define types for props and context value
interface AuthContextProps {
  children: ReactNode;
}

interface AuthContextValue {
  userRole: string | null;
  setUserRoleContext: Dispatch<SetStateAction<string | null>>;
}

// Create the AuthContext
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// AuthProvider component to wrap around the application
export const AuthProvider: React.FC<AuthContextProps> = ({ children }) => {
  // Initialize with null to avoid SSR issues
  const [userRole, setUserRole] = useState<string | null>(null);

  const setUserRoleContext: AuthContextValue["setUserRoleContext"] = (role) => {
    setUserRole(role);
  };

  // Load from localStorage on client-side mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserRole = localStorage.getItem("userRole");
      if (storedUserRole) {
        setUserRole(storedUserRole);
      }
    }
  }, []);

  // Update localStorage whenever userRole changes (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (userRole) {
        localStorage.setItem("userRole", userRole);
      } else {
        localStorage.removeItem("userRole");
      }
    }
  }, [userRole]);

  const contextValue: AuthContextValue = {
    userRole,
    setUserRoleContext,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// Custom hook to consume the AuthContext
export const useUser = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useUser must be used within an AuthProvider");
  }
  return context;
};
