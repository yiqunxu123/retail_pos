import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from "react";
import {
  login as apiLogin,
  logout as apiLogout,
  getStoredUser,
  KhubUser,
  UserRole as KhubUserRole,
} from "../utils/api/auth";
import { usePowerSync } from "../utils/powersync/PowerSyncProvider";
import { TenantUser } from "../utils/powersync/schema";

// Simplified role type for app usage
export type UserRole = "admin" | "cashier" | "manager" | "supervisor" | "sale_rep";

// App User interface (mapped from KHUB user)
export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  role: UserRole;
  permissions: string[];
  masterAdmin: boolean;
  rawUser: KhubUser; // Keep original user for advanced use cases
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithPin: (username: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
  isCashier: () => boolean;
  isManager: () => boolean;
  hasPermission: (permission: string) => boolean;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Map KHUB user roles to simplified app roles
 */
function mapUserRole(khubUser: KhubUser): UserRole {
  // Check if user is master admin
  if (khubUser.master_admin) {
    return "admin";
  }
  
  // Check roles from KHUB
  const roleNames = khubUser.roles.map((r) => r.name.toLowerCase());
  
  if (roleNames.includes("admin") || roleNames.includes("administrator")) {
    return "admin";
  }
  if (roleNames.includes("manager")) {
    return "manager";
  }
  if (roleNames.includes("supervisor")) {
    return "supervisor";
  }
  if (roleNames.includes("sale_rep") || roleNames.includes("sales_rep") || roleNames.includes("sales representative")) {
    return "sale_rep";
  }
  if (roleNames.includes("cashier")) {
    return "cashier";
  }
  
  // Default to cashier if no specific role found
  return "cashier";
}

/**
 * Convert KHUB user to app User format
 */
function mapKhubUserToAppUser(khubUser: KhubUser): User {
  return {
    id: String(khubUser.id),
    email: khubUser.email || `${khubUser.username}@khub.local`,
    name: `${khubUser.first_name || ""} ${khubUser.last_name || ""}`.trim() || khubUser.username,
    username: khubUser.username,
    role: mapUserRole(khubUser),
    permissions: khubUser.permissions || [],
    masterAdmin: khubUser.master_admin,
    rawUser: khubUser,
  };
}

/**
 * AuthProvider - Global state for user authentication
 * Manages user session, roles, and permissions using KHUB backend
 * Listens to PowerSync for real-time user updates
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { db, isConnected } = usePowerSync();
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true, // Start with loading to check stored auth
    user: null,
    error: null,
  });
  const currentUserIdRef = useRef<string | null>(null);

  // Check for stored authentication on mount
  useEffect(() => {
    const checkStoredAuth = async () => {
      try {
        const storedUser = await getStoredUser();
        if (storedUser) {
          currentUserIdRef.current = String(storedUser.id);
          setState({
            isAuthenticated: true,
            isLoading: false,
            user: mapKhubUserToAppUser(storedUser),
            error: null,
          });
        } else {
          setState((prev) => ({
            ...prev,
            isLoading: false,
          }));
        }
      } catch (error) {
        console.error("Failed to check stored auth:", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
        }));
      }
    };

    checkStoredAuth();
  }, []);

  // Watch for user changes in PowerSync
  useEffect(() => {
    if (!db || !isConnected || !currentUserIdRef.current) {
      return;
    }

    const userId = currentUserIdRef.current;
    console.log("[Auth] Setting up PowerSync watch for user:", userId);

    const abortController = new AbortController();

    // Watch the tenant_users table for changes to the current user
    const watchUser = async () => {
      try {
        for await (const result of db.watch(
          `SELECT * FROM tenant_users WHERE id = ?`,
          [userId],
          { signal: abortController.signal }
        )) {
          const rows = result.rows?._array || [];
          if (rows.length > 0) {
            const syncedUser = rows[0] as TenantUser & { id: string };
            console.log("[Auth] PowerSync user update received:", syncedUser.first_name, syncedUser.last_name);
            
            // Update the user state with synced data
            setState((prev) => {
              if (!prev.user) return prev;
              
              return {
                ...prev,
                user: {
                  ...prev.user,
                  name: `${syncedUser.first_name || ""} ${syncedUser.last_name || ""}`.trim() || prev.user.username,
                  email: syncedUser.email || prev.user.email,
                  masterAdmin: syncedUser.master_admin === 1,
                },
              };
            });
          }
        }
      } catch (err: unknown) {
        const error = err as Error;
        if (error.name !== 'AbortError') {
          console.error("[Auth] PowerSync watch error:", error);
        }
      }
    };

    watchUser();

    return () => {
      console.log("[Auth] Cleaning up PowerSync watch");
      abortController.abort();
    };
  }, [db, isConnected]);

  const login = useCallback(
    async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const result = await apiLogin({ username, password });

      if (result.error || !result.user) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error || "Login failed",
        }));
        return { success: false, error: result.error };
      }

      // Store user ID for PowerSync watch
      currentUserIdRef.current = String(result.user.id);

      setState({
        isAuthenticated: true,
        isLoading: false,
        user: mapKhubUserToAppUser(result.user),
        error: null,
      });

      return { success: true };
    },
    []
  );

  const loginWithPin = useCallback(
    async (username: string, pin: string): Promise<{ success: boolean; error?: string }> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const result = await apiLogin({ username, login_pin: pin });

      if (result.error || !result.user) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error || "Login failed",
        }));
        return { success: false, error: result.error };
      }

      // Store user ID for PowerSync watch
      currentUserIdRef.current = String(result.user.id);

      setState({
        isAuthenticated: true,
        isLoading: false,
        user: mapKhubUserToAppUser(result.user),
        error: null,
      });

      return { success: true };
    },
    []
  );

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    
    // Clear user ID ref
    currentUserIdRef.current = null;
    
    await apiLogout();
    
    setState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const isAdmin = useCallback(() => {
    return state.user?.role === "admin" || state.user?.masterAdmin === true;
  }, [state.user]);

  const isCashier = useCallback(() => {
    return state.user?.role === "cashier";
  }, [state.user]);

  const isManager = useCallback(() => {
    return (
      state.user?.role === "manager" ||
      state.user?.role === "admin" ||
      state.user?.masterAdmin === true
    );
  }, [state.user]);

  const hasPermission = useCallback(
    (permission: string) => {
      if (!state.user) return false;
      // Master admin has all permissions
      if (state.user.masterAdmin) return true;
      return state.user.permissions.includes(permission);
    },
    [state.user]
  );

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        loginWithPin,
        logout,
        isAdmin,
        isCashier,
        isManager,
        hasPermission,
        clearError,
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
