import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    tailwindcss(),
  ],
  build: {
    // Enable chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor bundles from app code
          "vendor-react": ["react", "react-dom", "react-router-dom"],
        },
      },
    },
    // Raise limit since firebase bundle is inherently large
    chunkSizeWarningLimit: 1000,
  },
  server: {
    allowedHosts: ["zoop.loca.lt"],
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/mapapi": {
        target: "https://nominatim.openstreetmap.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mapapi/, ""),
        headers: {
          "User-Agent": "ZoopMarketplace/1.0 (contact@zoop.com)",
          "Accept-Language": "en",
        },
      },
    },
  },
});
