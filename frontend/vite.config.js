import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite dev server on :5173, FastAPI on :8000.
// We proxy /api/* -> http://localhost:8000/* so the frontend never hits CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
  },
});
