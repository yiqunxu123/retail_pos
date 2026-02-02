import AsyncStorage from '@react-native-async-storage/async-storage';
import khubApi, { STORAGE_KEYS } from './khub';
import { AxiosError } from 'axios';

// User role type - aligned with KHUB backend
export type UserRole = {
  id: number;
  name: string;
  permissions?: string[];
};

// User interface matching KHUB backend response
export interface KhubUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone_no?: string;
  image?: string;
  status: number;
  master_admin: boolean;
  assign_customer: boolean;
  permissions: string[];
  roles: UserRole[];
  customers?: unknown[];
}

// Auth response from KHUB
export interface AuthResponse {
  message: string;
  entity: {
    access_token: string;
    refresh_token: string;
    user: KhubUser;
    is_pilot?: boolean;
    pilot_redirect_url?: string;
  };
  warnings?: string[];
}

// Login credentials
export interface LoginCredentials {
  username: string;
  password?: string;
  login_pin?: string;
}

// API Error response
export interface ApiError {
  message: string;
  errors?: string[];
}

/**
 * Parse error response from KHUB API
 */
function parseErrorResponse(error: AxiosError): string {
  if (error.response?.data) {
    const data = error.response.data as { message?: string; errors?: string[]; error?: string };
    if (data.errors && data.errors.length > 0) {
      return data.errors.join(', ');
    }
    if (data.message) {
      return data.message;
    }
    if (data.error) {
      return data.error;
    }
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

/**
 * Login to KHUB backend
 * Supports both password and PIN-based authentication
 */
export async function login(credentials: LoginCredentials): Promise<{ user: KhubUser; error?: string }> {
  try {
    const response = await khubApi.post<AuthResponse>(
      '/tenant/api/v1/core/user/authenticate',
      credentials
    );

    const { access_token, refresh_token, user } = response.data.entity;

    // Store tokens and user data
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

    return { user };
  } catch (error) {
    const errorMessage = parseErrorResponse(error as AxiosError);
    console.error('Login failed:', errorMessage);
    return { user: null as unknown as KhubUser, error: errorMessage };
  }
}

/**
 * Logout - clear all stored tokens and user data
 */
export async function logout(): Promise<void> {
  try {
    // Optionally call backend logout endpoint
    // await khubApi.post('/tenant/api/v1/user/logout-all-devices');
  } catch (error) {
    console.warn('Backend logout failed:', error);
  } finally {
    // Always clear local storage
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER,
    ]);
  }
}

/**
 * Get currently stored user from AsyncStorage
 */
export async function getStoredUser(): Promise<KhubUser | null> {
  try {
    const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    if (userJson) {
      return JSON.parse(userJson) as KhubUser;
    }
    return null;
  } catch (error) {
    console.error('Failed to get stored user:', error);
    return null;
  }
}

/**
 * Get stored access token
 */
export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

/**
 * Check if user is authenticated (has valid tokens)
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  const user = await getStoredUser();
  return !!token && !!user;
}

/**
 * Get current user from API (validates token)
 */
export async function getCurrentUser(): Promise<KhubUser | null> {
  try {
    const response = await khubApi.get<{ entity: KhubUser }>('/tenant/api/v1/core/user/me');
    const user = response.data.entity;
    
    // Update stored user data
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    
    return user;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

/**
 * Refresh authentication token
 */
export async function refreshAuthToken(): Promise<boolean> {
  try {
    const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    
    if (!refreshToken) {
      return false;
    }
    
    const response = await khubApi.post<AuthResponse>(
      '/tenant/api/v1/core/user/authenticate/refresh',
      {},
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      }
    );
    
    const { access_token, refresh_token: newRefreshToken } = response.data.entity;
    
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
    if (newRefreshToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
    }
    
    return true;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
}
