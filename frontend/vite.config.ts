import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import tailwindcss from '@tailwindcss/vite';
import path from "path";

const allowedHostsEnv = process.env.VITE_ALLOWED_HOSTS ?? "transcen.dence.fr,localhost,127.0.0.1";
const allowedHosts = allowedHostsEnv
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);
const domain = process.env.DOMAIN;
const httpsPort = process.env.HTTPS_PORT;
const hmrClientPort = Number.parseInt(httpsPort as string, 10);

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 6767,
    hmr: {
      clientPort: hmrClientPort,
      protocol: "wss",
      overlay: false
    },
    allowedHosts: allowedHosts.includes("*") ? true : allowedHosts,
  },
  plugins: [preact({ devToolsEnabled: false }), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    }
  },
  define: {
    __APP_DOMAIN__: JSON.stringify(domain),
    __APP_HTTPS_PORT__: JSON.stringify(httpsPort),
  }
}));
