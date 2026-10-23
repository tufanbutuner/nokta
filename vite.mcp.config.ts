import { defineConfig } from "vite";

/**
 * Builds the MCP endpoint (src/server/mcpEndpoint.ts) into server-dist/mcp.js for
 * api/mcp.ts. Vercel compiles api/ files one by one and cannot resolve the "@/"
 * alias, so the endpoint is bundled here first. As in the site build, Supabase
 * settings come from VITE_ variables at build time, so each deployment reads its
 * own project. Packages stay external and are traced from node_modules.
 */
export default defineConfig({
  // Only the bundle; the site build copies public/.
  publicDir: false,
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
  build: {
    ssr: "src/server/mcpEndpoint.ts",
    outDir: "server-dist",
    emptyOutDir: true,
    target: "node24",
    rollupOptions: {
      output: { entryFileNames: "mcp.js" },
    },
  },
});
