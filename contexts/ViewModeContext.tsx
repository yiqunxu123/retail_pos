import { createContext, useContext, useState, ReactNode, useCallback } from "react";

type ViewMode = "admin" | "staff";

interface ViewModeContextType {
  viewMode: ViewMode;
  isStaffMode: boolean;
  isAdminMode: boolean;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
}

const ViewModeContext = createContext<ViewModeContextType | null>(null);

/**
 * ViewModeProvider - Global state for view mode (admin/staff)
 * Controls which navigation style is shown throughout the app
 */
export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>("admin");

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
  }, []);

  const toggleViewMode = useCallback(() => {
    setViewModeState((prev) => (prev === "admin" ? "staff" : "admin"));
  }, []);

  return (
    <ViewModeContext.Provider
      value={{
        viewMode,
        isStaffMode: viewMode === "staff",
        isAdminMode: viewMode === "admin",
        setViewMode,
        toggleViewMode,
      }}
    >
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error("useViewMode must be used within a ViewModeProvider");
  }
  return context;
}
