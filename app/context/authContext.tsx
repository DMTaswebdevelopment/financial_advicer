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
  photoUrl: string | null;
  firstName: string | null;
  lastName: string | null;
  accessToken: string | null;
  email: string | null;
  id: string | null;
  subscription: boolean;
  name: string | null;
  productId: string | null;
}

// Props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

// The shape of the context value
interface AuthContextType {
  user: User | null;
  setUserContext: Dispatch<SetStateAction<User>>;
  setUserRoleContext: Dispatch<SetStateAction<string | null>>;
  logout: () => void;
}

// Default user state
const defaultUser: User = {
  userRole: "",
  photoUrl: "",
  firstName: "",
  lastName: "",
  accessToken: null,
  email: "",
  id: null,
  name: null,
  subscription: false,
  productId: null,
};

// Create the context with undefined default
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User>(defaultUser);

  // Safe setter for the entire user object that updates localStorage
  const setUserContext: Dispatch<SetStateAction<User>> = (userUpdate) => {
    const updatedUser =
      typeof userUpdate === "function" ? userUpdate(user) : userUpdate;
    setUser(updatedUser);
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  const logout = () => {
    setUser(defaultUser);
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
    }
  };

  // Safe setter that updates only the userRole property
  const setUserRoleContext: Dispatch<SetStateAction<string | null>> = (
    role
  ) => {
    const newRole = typeof role === "function" ? role(user.userRole) : role;
    const updatedUser = { ...user, userRole: newRole };
    setUser(updatedUser);
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse stored user:", e);
        }
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUserContext,
        setUserRoleContext,
        logout,
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
