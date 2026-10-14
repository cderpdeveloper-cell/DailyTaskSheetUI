import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";
import { API_URL } from "./apiConfig";
import { useAuthStore } from "@/store/useAuthStore";

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach bearer access token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get("accessToken") || useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Concurrency queue for refresh token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Automatically refresh token on 401
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Skip refreshing if the failed request was login or refresh itself
    const isAuthRoute =
      originalRequest.url?.includes("/Auth/login") ||
      originalRequest.url?.includes("/Auth/Refresh") ||
      originalRequest.url?.includes("/Auth/RefreshToken");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const currentAccessToken = Cookies.get("accessToken") || useAuthStore.getState().accessToken || "";
        const currentRefreshToken = Cookies.get("refreshToken") || useAuthStore.getState().refreshToken || "";

        if (!currentRefreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await axios.post(`${API_URL}/Auth/Refresh`, {
          accessToken: currentAccessToken,
          refreshToken: currentRefreshToken,
        });

        if (response.data?.success && response.data?.data) {
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;

          // Update cookie and store state
          useAuthStore.getState().setTokens(accessToken, newRefreshToken);
          axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          processQueue(null, accessToken);
          return axiosInstance(originalRequest);
        } else {
          throw new Error(response.data?.message || "Refresh token failed");
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
