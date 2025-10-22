import env from "@/utils/env";
import axios from "axios";

// ... (apiClient setup and request interceptor remain the same) ...
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
      const token = localStorage.getItem("token");
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

// New Response Interceptor for Error Handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        // Run function: Log out user on Unauthorized
        console.log("Token expired or unauthorized. Redirecting to login...");
        window.location.href = "/login";
        localStorage.clear();
      } else if (status >= 500) {
        // Run function: Show a generic server error message
        console.log("Server error. Please try again later.");
      }
    }
    // You must return a rejected promise so the error propagates
    return Promise.reject(error);
  }
);

export default apiClient;
