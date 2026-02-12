/**
 * Timezone Configuration Utility
 *
 * Provides a user-configurable timezone for all date/time operations.
 * When set to 'device' (default), uses the device's local timezone.
 * Otherwise uses the selected IANA timezone name.
 *
 * Stored in AsyncStorage so the preference persists across app restarts.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const TIMEZONE_STORAGE_KEY = 'app_timezone';

/** Special value meaning "use device local time" */
export const DEVICE_TIMEZONE = 'device';

// ---------------------------------------------------------------------------
// Module-level cache
// ---------------------------------------------------------------------------

let _timezone: string = DEVICE_TIMEZONE;

// ---------------------------------------------------------------------------
// Timezone List
// ---------------------------------------------------------------------------

export interface TimezoneOption {
  value: string;   // IANA name or 'device'
  label: string;   // Display label
}

export const TIMEZONE_LIST: TimezoneOption[] = [
  { value: 'device',              label: 'Local Time (Device)' },
  { value: 'Pacific/Honolulu',    label: 'Hawaii Time (UTC-10)' },
  { value: 'America/Denver',      label: 'Mountain Time (UTC-7)' },
  { value: 'America/Chicago',     label: 'Central Time (UTC-6)' },
  { value: 'America/New_York',    label: 'Eastern Time (UTC-5)' },
  { value: 'America/Halifax',     label: 'Atlantic Time (UTC-4)' },
  { value: 'UTC',                 label: 'UTC (UTC+0)' },
];

// ---------------------------------------------------------------------------
// Get / Set
// ---------------------------------------------------------------------------

/** Get the currently configured timezone (IANA name or 'device'). */
export function getConfiguredTimezone(): string {
  return _timezone;
}

/** Set the timezone in memory (does NOT persist — call saveTimezone for that). */
export function setConfiguredTimezone(tz: string): void {
  _timezone = tz;
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

/** Load the timezone preference from AsyncStorage into the module cache. */
export async function loadTimezone(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(TIMEZONE_STORAGE_KEY);
    if (saved) {
      _timezone = saved;
      console.log('[Timezone] Loaded:', _timezone);
    } else {
      console.log('[Timezone] No saved timezone, using device default');
    }
  } catch (e) {
    console.log('[Timezone] Failed to load:', e);
  }
  return _timezone;
}

/** Save the timezone preference to AsyncStorage and update the module cache. */
export async function saveTimezone(tz: string): Promise<void> {
  _timezone = tz;
  try {
    await AsyncStorage.setItem(TIMEZONE_STORAGE_KEY, tz);
    console.log('[Timezone] Saved:', tz);
  } catch (e) {
    console.log('[Timezone] Failed to save:', e);
  }
}

// ---------------------------------------------------------------------------
// Offset Calculation
// ---------------------------------------------------------------------------

/**
 * Get the UTC offset in minutes for the configured timezone.
 *
 * Positive = east of UTC (e.g. +480 for UTC+8)
 * Negative = west of UTC (e.g. -300 for UTC-5)
 */
export function getTimezoneOffsetMinutes(): number {
  if (_timezone === DEVICE_TIMEZONE) {
    // JS getTimezoneOffset() returns the opposite sign (minutes behind UTC)
    return -new Date().getTimezoneOffset();
  }

  // Use Intl to compare UTC vs. target timezone
  const now = new Date();
  const utcStr = now.toLocaleString('en-US', { timeZone: 'UTC' });
  const tzStr  = now.toLocaleString('en-US', { timeZone: _timezone });
  const utcDate = new Date(utcStr);
  const tzDate  = new Date(tzStr);
  return Math.round((tzDate.getTime() - utcDate.getTime()) / (1000 * 60));
}

/**
 * Get the UTC offset as a SQLite-compatible modifier string.
 *
 * Examples: '+08:00', '-05:00', '+05:30'
 *
 * This replaces SQLite's `'localtime'` modifier so queries honour
 * the user-configured timezone rather than the device timezone.
 */
export function getSqliteTimezoneOffset(): string {
  if (_timezone === DEVICE_TIMEZONE) {
    return 'localtime';          // fall back to SQLite built-in
  }

  const minutes = getTimezoneOffsetMinutes();
  const sign = minutes >= 0 ? '+' : '-';
  const abs  = Math.abs(minutes);
  const h = String(Math.floor(abs / 60)).padStart(2, '0');
  const m = String(abs % 60).padStart(2, '0');
  return `${sign}${h}:${m}`;
}

/**
 * Get today's date (YYYY-MM-DD) in the configured timezone.
 */
export function getTodayInTimezone(): string {
  if (_timezone === DEVICE_TIMEZONE) {
    const d = new Date();
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${day}`;
  }

  // en-CA locale formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: _timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Get the display label for the currently configured timezone.
 */
export function getTimezoneDisplayLabel(): string {
  const entry = TIMEZONE_LIST.find(t => t.value === _timezone);
  if (entry) return entry.label;
  return _timezone;  // fallback to raw IANA name
}
