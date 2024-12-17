import axios from "axios";

// Base Axios instance
const api = axios.create({
  baseURL: "http://localhost:5000", // Backend server URL
});

// Interceptor to add token to headers if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
