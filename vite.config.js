import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import { generatePages } from "./scripts/generate-pages.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname);

function blogPagesPlugin() {
  const postsDir = path.join(root, "src", "posts");
  const configPath = path.join(root, "src", "config.ts");

  return {
    name: "blog-pages",
    buildStart() {
      generatePages();
    },
    configureServer(server) {
      generatePages();
      const norm = (f) => (f || "").replace(/\\/g, "/");
      const maybeRegeneratePages = (file) => {
        const p = norm(file);
        const isPost = p.includes("src/posts") && p.endsWith(".md");
        const isConfig = p.endsWith("config.ts");
        if (isPost || isConfig) generatePages();
      };
      server.watcher.on("change", maybeRegeneratePages);
      server.watcher.on("add", maybeRegeneratePages);
      server.watcher.on("unlink", maybeRegeneratePages);
      server.watcher.add(postsDir);
      server.watcher.add(configPath);
    },
  };
}

export default defineConfig({
  plugins: [
    blogPagesPlugin(),
    react({
      jsxRuntime: "automatic",
    }),
  ],
  base: "/dreaming-saints/",
  server: {
    port: 3000,
  },
  preview: {
    port: 3000,
  },
  build: {
    outDir: "dist",
  },
  esbuild: {
    logOverride: { "this-is-undefined-in-esm": "silent" },
  },
});
