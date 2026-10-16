import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Four pages: the landing page (index.html), the app (bite.html), the legal page (legal.html) and the fair-stand survey (stand.html).
// base "./" makes the build work on GitHub Pages under /Bite/.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        bite: resolve(__dirname, "bite.html"),
        legal: resolve(__dirname, "legal.html"),
        stand: resolve(__dirname, "stand.html"),
      },
    },
  },
});
