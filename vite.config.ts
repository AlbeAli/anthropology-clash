/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
              return "vendor";
            }
            if (id.includes("i18next") || id.includes("react-i18next")) {
              return "i18n";
            }
            if (id.includes("zod")) {
              return "schema";
            }
          }
        },
      },
    },
  },
  test: {
    include: ["src/engine/**/*.test.ts", "src/schema/**/*.test.ts", "scripts/**/*.test.ts"],
  },
});
