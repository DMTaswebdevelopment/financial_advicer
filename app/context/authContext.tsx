import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";

// Define the user structure
interface User {
  userRole: string | null;
  imageUrl: string | null;
  firstName: string | null;
  lastName: string | null;
}

// Props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

// The shape of the context value
interface AuthContextType {
  userRole: User | null;
  setUserContext: Dispatch<SetStateAction<User>>;
  setUserRoleContext: Dispatch<SetStateAction<string | null>>;
}

// Default user state
const defaultUser: User = {
  userRole: null,
  imageUrl: null,
  firstName: null,
  lastName: null,
};

// Create the context with undefined default
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [userRole, setUserRole] = useState<User>(defaultUser);

  // Safe setter for the entire user object that updates localStorage
  const setUserContext: Dispatch<SetStateAction<User>> = (userUpdate) => {
    const updatedUser =
      typeof userUpdate === "function" ? userUpdate(userRole) : userUpdate;

    setUserRole(updatedUser);

    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  // Safe setter that updates only the userRole property
  const setUserRoleContext: Dispatch<SetStateAction<string | null>> = (
    role
  ) => {
    const newRole = typeof role === "function" ? role(userRole.userRole) : role;

    // Create a new user object with the updated role
    const updatedUser = {
      ...userRole,
      userRole: newRole,
    };

    // Update the state with the new user object
    setUserRole(updatedUser);

    // Update localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  // Load user from localStorage on client
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setUserRole(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse stored user:", e);
        }
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        userRole,
        setUserContext,
        setUserRoleContext,
      }}
    >
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
