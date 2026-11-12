import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In development, /api calls go to the backend. In production set VITE_API_URL.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": "http://127.0.0.1:5069" } },
});
