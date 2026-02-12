import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import {
  DEVICE_TIMEZONE,
  getTimezoneDisplayLabel,
  loadTimezone,
  saveTimezone as persistTimezone,
} from "../utils/timezone";

interface TimezoneContextType {
  /** Current IANA timezone name or 'device' */
  timezone: string;
  /** Human-readable label for the current timezone */
  timezoneLabel: string;
  /** Change the timezone (persists to AsyncStorage and updates module cache) */
  setTimezone: (tz: string) => Promise<void>;
}

const TimezoneContext = createContext<TimezoneContextType | null>(null);

/**
 * TimezoneProvider — wraps the app so any component can subscribe
 * to timezone changes via `useTimezone()`.
 *
 * On mount it loads the saved preference from AsyncStorage.
 * When the user picks a new timezone in Settings, calling `setTimezone`
 * updates the module-level cache, persists to storage, AND triggers a
 * React re-render for every subscriber — so Dashboard queries etc.
 * automatically re-execute with the new timezone.
 */
export function TimezoneProvider({ children }: { children: ReactNode }) {
  const [timezone, setTimezoneState] = useState(DEVICE_TIMEZONE);
  const [label, setLabel] = useState("Local Time (Device)");

  // Load saved timezone on mount
  useEffect(() => {
    loadTimezone().then((tz) => {
      setTimezoneState(tz);
      setLabel(getTimezoneDisplayLabel());
    });
  }, []);

  const setTimezone = useCallback(async (tz: string) => {
    await persistTimezone(tz);          // updates module cache + AsyncStorage
    setTimezoneState(tz);               // triggers React re-render
    setLabel(getTimezoneDisplayLabel()); // refresh label
  }, []);

  return (
    <TimezoneContext.Provider value={{ timezone, timezoneLabel: label, setTimezone }}>
      {children}
    </TimezoneContext.Provider>
  );
}

/**
 * Hook to access / change the configured timezone.
 * Must be used inside a `<TimezoneProvider>`.
 */
export function useTimezone() {
  const context = useContext(TimezoneContext);
  if (!context) {
    throw new Error("useTimezone must be used within a TimezoneProvider");
  }
  return context;
}
