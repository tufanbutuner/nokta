import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const devPort = Number(process.env.PORT ?? 5173);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
  build: {
    // The map library stays in its lazy route chunk; warn if it grows past 1.1 MB.
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        // Match on the package directory, not a bare substring of the whole path:
        // "leaflet" also appears inside "react-leaflet", and a home directory or
        // dependency path containing "react" would otherwise land in vendor-react.
        // Leaflet is deliberately left unnamed so it stays inside the lazy route
        // chunks that use it, instead of being hoisted into the entry's preload
        // graph and making its stylesheet render-blocking on every page.
        manualChunks(id) {
          const match = id.match(/node_modules\/(?:\.pnpm\/)?((?:@[^/]+\/)?[^/]+)/);
          if (!match) return;
          const pkg = match[1];

          if (pkg === "react" || pkg === "react-dom" || pkg === "scheduler") return "vendor-react";
          if (pkg.startsWith("@supabase/")) return "vendor-supabase";
          if (pkg === "posthog-js" || pkg.startsWith("@vercel/")) return "vendor-analytics";
          if (pkg.startsWith("@radix-ui/") || pkg === "lucide-react") return "vendor-ui";
          return;
        },
      },
    },
  },
  server: {
    host: "127.0.0.1",
    port: devPort,
    strictPort: true,
    hmr: {
      host: "127.0.0.1",
      clientPort: devPort,
    },
    watch: {
      usePolling: true,
      interval: 250,
    },
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});
