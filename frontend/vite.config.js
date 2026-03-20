import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/essay":     "http://localhost:8000",
      "/interview": "http://localhost:8000",
      "/profile":   "http://localhost:8000",
    },
  },
});
