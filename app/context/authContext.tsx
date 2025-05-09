import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";

// Props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

// The shape of the context value
interface AuthContextType {
  userRole: string | null;
  setUserRoleContext: Dispatch<SetStateAction<string | null>>;
}

// Create the context with undefined default
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [userRole, setUserRole] = useState<string | null>("");

  // Safe setter that also updates localStorage
  const setUserRoleContext: Dispatch<SetStateAction<string | null>> = (
    role
  ) => {
    const value = typeof role === "function" ? role(userRole) : role;
    setUserRole(value);
    if (typeof window !== "undefined") {
      if (value) {
        localStorage.setItem("userRole", value);
      } else {
        localStorage.removeItem("userRole");
      }
    }
  };

  // Load role from localStorage only on client
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserRole = localStorage.getItem("userRole");
      if (storedUserRole) {
        setUserRole(storedUserRole);
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ userRole, setUserRoleContext }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use context
export const useUser = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useUser must be used within an AuthProvider");
  }
  return context;
};
