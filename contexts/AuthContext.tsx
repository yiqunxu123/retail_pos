import { createContext, useContext, useState, ReactNode, useCallback } from "react";

// User role types
export type UserRole = "admin" | "cashier" | "manager" | "supervisor";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: () => boolean;
  isCashier: () => boolean;
  isManager: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Mock users for demonstration
const MOCK_USERS: { email: string; password: string; user: User }[] = [
  {
    email: "admin@ititans.com",
    password: "admin123",
    user: {
      id: "1",
      email: "admin@ititans.com",
      name: "Admin User",
      role: "admin",
    },
  },
  {
    email: "cashier@ititans.com",
    password: "cashier123",
    user: {
      id: "2",
      email: "cashier@ititans.com",
      name: "Cashier User",
      role: "cashier",
    },
  },
  {
    email: "manager@ititans.com",
    password: "manager123",
    user: {
      id: "3",
      email: "manager@ititans.com",
      name: "Manager User",
      role: "manager",
    },
  },
  {
    email: "supervisor@ititans.com",
    password: "super123",
    user: {
      id: "4",
      email: "supervisor@ititans.com",
      name: "Supervisor User",
      role: "supervisor",
    },
  },
];

/**
 * AuthProvider - Global state for user authentication
 * Manages user session, roles, and permissions
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
  });

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Find matching user
    const matchedUser = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (matchedUser) {
      setState({
        isAuthenticated: true,
        user: matchedUser.user,
      });
      return true;
    }

    return false;
  }, []);

  const logout = useCallback(() => {
    setState({
      isAuthenticated: false,
      user: null,
    });
  }, []);

  const isAdmin = useCallback(() => {
    return state.user?.role === "admin";
  }, [state.user]);

  const isCashier = useCallback(() => {
    return state.user?.role === "cashier";
  }, [state.user]);

  const isManager = useCallback(() => {
    return state.user?.role === "manager" || state.user?.role === "admin";
  }, [state.user]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        isAdmin,
        isCashier,
        isManager,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
