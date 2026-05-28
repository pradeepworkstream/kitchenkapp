import axios from "axios";

const API_URL = (import.meta.env.VITE_BACKEND_URL || "https://api.gogrocer.ca").replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-clear token on 401 so the UI redirects to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("admin_token");
      // Let the storage event in App.jsx pick this up and redirect
      window.dispatchEvent(new Event("storage"));
    }
    return Promise.reject(err);
  }
);

export default api;
