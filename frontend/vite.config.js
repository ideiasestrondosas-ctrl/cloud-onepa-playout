import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3010,
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:8182",
        changeOrigin: true,
      },
      "/hls": {
        target: "http://localhost:8993",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/hls/, ""),
      },
      "/assets": {
        target: "http://localhost:8181",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "static",
    sourcemap: false,
    chunkSizeWarningLimit: 700,
  },
});
