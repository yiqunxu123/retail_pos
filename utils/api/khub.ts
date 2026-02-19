import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'khub_access_token',
  REFRESH_TOKEN: 'khub_refresh_token',
  USER: 'khub_user',
};

// KHUB API base URL from environment
const KHUB_API_URL = process.env.EXPO_PUBLIC_KHUB_API_URL || 'http://localhost:5002';
console.log('[KHUB_API_URL]', KHUB_API_URL);

// Create axios instance
const khubApi: AxiosInstance = axios.create({
  baseURL: KHUB_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - attach access token
khubApi.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Skip token for login and refresh endpoints
    const skipAuthPaths = ['/tenant/api/v1/core/user/authenticate'];
    const shouldSkipAuth = skipAuthPaths.some(path => config.url?.includes(path));
    
    if (!shouldSkipAuth) {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 and token refresh
khubApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry for login or refresh endpoints
      if (originalRequest.url?.includes('/authenticate')) {
        return Promise.reject(error);
      }
      
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return khubApi(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        // Call refresh endpoint
        const response = await axios.post(
          `${KHUB_API_URL}/tenant/api/v1/core/user/authenticate/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );
        
        const { access_token, refresh_token } = response.data.entity || response.data;
        
        // Store new tokens
        await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
        if (refresh_token) {
          await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
        }
        
        processQueue(null, access_token);
        
        // Retry original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        return khubApi(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        
        // Clear stored tokens on refresh failure
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.ACCESS_TOKEN,
          STORAGE_KEYS.REFRESH_TOKEN,
          STORAGE_KEYS.USER,
        ]);
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export default khubApi;
