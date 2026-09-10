import { copyFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteApiPlugin } from "./scripts/viteApiPlugin.js";

function createStaticRoutePages() {
  let outputDirectory;

  return {
    name: "create-static-route-pages",
    apply: "build",
    configResolved(config) {
      outputDirectory = config.build.outDir;
    },
    writeBundle() {
      const indexFile = resolve(outputDirectory, "index.html");

      for (const route of ["servizi", "portfolio", "chisiamo", "admin"]) {
        const routeDirectory = resolve(outputDirectory, route);
        mkdirSync(routeDirectory, { recursive: true });
        copyFileSync(indexFile, resolve(routeDirectory, "index.html"));
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  build: {
    outDir: "dist",
  },
  plugins: [react(), viteApiPlugin(), createStaticRoutePages()],
});
