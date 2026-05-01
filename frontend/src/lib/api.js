import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api`
    : "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Attach token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("Opdify_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("Opdify_token");
      localStorage.removeItem("Opdify_user");
      window.dispatchEvent(new Event("auth:logout"));
    }
    return Promise.reject(err);
  }
);


export default api;