import { existsSync } from "node:fs";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

if (existsSync(".env.development.local")) {
  process.loadEnvFile(".env.development.local");
}

// Keep `nitro` gated to `build` (the Vercel deploy target): enabled in dev it
// opens a second dev-server port.
export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    tanstackStart(),
    ...(command === "build" ? [nitro({ preset: "vercel" })] : []),
    viteReact(),
  ],
  resolve: { tsconfigPaths: true },
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
  },
}));
