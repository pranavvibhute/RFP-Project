import axios from "axios";
import { getCookie, setCookie, deleteCookie } from "./cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper to retrieve active token from cookie or localStorage
export function getActiveToken(): string | null {
  return getCookie("auth_token") || (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null);
}

// Request interceptor for custom `api` instance: attach auth token
api.interceptors.request.use((config) => {
  const token = getActiveToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Also attach token to default global `axios` instance so direct axios.get/post across components also works!
axios.interceptors.request.use((config) => {
  const token = getActiveToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || "";
    const isAuthEndpoint = requestUrl.includes("/auth/login") || requestUrl.includes("/auth/register");
    if (error.response?.status === 401 && !isAuthEndpoint) {
      deleteCookie("auth_token");
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export { API_BASE_URL };
export default api;
