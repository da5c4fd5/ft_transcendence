import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import tailwindcss from '@tailwindcss/vite';
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false
    },
    allowedHosts: ["transcen.dence.fr"],
  },
  plugins: [preact(), tailwindcss(),],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    }
  }
}));
