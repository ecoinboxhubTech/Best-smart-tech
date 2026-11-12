import axios from "axios";

// Dev: Vite proxies /api to the backend. Production: set VITE_API_URL.
export const http = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "").replace(/\/$/, ""),
  timeout: 15000,
});

export const errorMessage = (e) =>
  (typeof e?.response?.data?.detail === "string" && e.response.data.detail) || e?.message || "Something went wrong";

export const getProducts = (params) => http.get("/api/products", { params }).then((r) => r.data);
export const getZones = () => http.get("/api/zones").then((r) => r.data);
export const createOrder = (body) => http.post("/api/orders", body).then((r) => r.data);
export const verifyOrder = (ref) => http.get(`/api/orders/${encodeURIComponent(ref)}/verify`).then((r) => r.data);
export const getOrder = (ref) => http.get(`/api/orders/${encodeURIComponent(ref)}`).then((r) => r.data);
