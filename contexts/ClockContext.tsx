import { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface ClockState {
  isClockedIn: boolean;
  clockInTime: Date | null;
  employeeId: string | null;
  selectedPosLine: number | null;
}

interface ClockContextType extends ClockState {
  clockIn: (employeeId: string, posLine: number) => void;
  clockOut: () => void;
  selectPosLine: (posLine: number | null) => void;
  getElapsedTime: () => string;
  getClockInTimeString: () => string;
}

const ClockContext = createContext<ClockContextType | null>(null);

/**
 * ClockProvider - Global state for clock in/out functionality
 * Manages employee session, timing, and POS line assignment
 */
export function ClockProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ClockState>({
    isClockedIn: false,
    clockInTime: null,
    employeeId: null,
    selectedPosLine: null,
  });

  const clockIn = useCallback((employeeId: string, posLine: number) => {
    setState({
      isClockedIn: true,
      clockInTime: new Date(),
      employeeId,
      selectedPosLine: posLine,
    });
  }, []);

  const clockOut = useCallback(() => {
    setState({
      isClockedIn: false,
      clockInTime: null,
      employeeId: null,
      selectedPosLine: null,
    });
  }, []);

  const selectPosLine = useCallback((posLine: number | null) => {
    setState((prev) => ({ ...prev, selectedPosLine: posLine }));
  }, []);

  // Format elapsed time as HH:MM:SS
  const getElapsedTime = useCallback(() => {
    if (!state.clockInTime) return "00:00:00";
    
    const now = new Date();
    const diff = Math.floor((now.getTime() - state.clockInTime.getTime()) / 1000);
    
    const hours = Math.floor(diff / 3600).toString().padStart(2, "0");
    const minutes = Math.floor((diff % 3600) / 60).toString().padStart(2, "0");
    const seconds = (diff % 60).toString().padStart(2, "0");
    
    return `${hours}:${minutes}:${seconds}`;
  }, [state.clockInTime]);

  // Format clock in time as HH:MM AM/PM
  const getClockInTimeString = useCallback(() => {
    if (!state.clockInTime) return "--:-- --";
    
    return state.clockInTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }, [state.clockInTime]);

  return (
    <ClockContext.Provider
      value={{
        ...state,
        clockIn,
        clockOut,
        selectPosLine,
        getElapsedTime,
        getClockInTimeString,
      }}
    >
      {children}
    </ClockContext.Provider>
  );
}

export function useClock() {
  const context = useContext(ClockContext);
  if (!context) {
    throw new Error("useClock must be used within a ClockProvider");
  }
  return context;
}
