// src/lib/api.ts
import env from "@/utils/env";
import axios from "axios";

const apiClient = axios.create({
  baseURL: env.VITE_SERVER_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to add the auth token to every request if it exists
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
