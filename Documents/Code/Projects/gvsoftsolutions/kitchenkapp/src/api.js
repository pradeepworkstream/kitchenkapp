// src/api.js
import axios from "axios";

export const backendUrl =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

export const emailApi = axios.create({
  baseURL: backendUrl,
});