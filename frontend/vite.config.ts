import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import tailwindcss from '@tailwindcss/vite';
import path from "path";

const allowedHostsEnv = process.env.VITE_ALLOWED_HOSTS ?? "transcen.dence.fr,localhost,127.0.0.1";
const allowedHosts = allowedHostsEnv
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 6767,
    hmr: {
      clientPort: 443,
      protocol: "wss",
      overlay: false
    },
    allowedHosts: allowedHosts.includes("*") ? true : allowedHosts,
  },
  plugins: [preact(), tailwindcss(),],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    }
  }
}));
