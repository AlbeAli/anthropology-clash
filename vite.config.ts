/// <reference types="vitest/config" />
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const CATALOG = "virtual:catalog";
const contentDir = fileURLToPath(new URL("./src/content", import.meta.url));

function scenarioCatalog(): Plugin {
  const resolved = "\0" + CATALOG;
  return {
    name: "scenario-catalog",
    resolveId: (id) => (id === CATALOG ? resolved : undefined),
    load(id) {
      if (id !== resolved) return;
      const entries = [];
      for (const lang of readdirSync(contentDir)) {
        const dir = join(contentDir, lang, "scenarios");
        let files: string[];
        try {
          files = readdirSync(dir).filter((f) => f.endsWith(".json"));
        } catch {
          continue;
        }
        for (const file of files) {
          const path = join(dir, file);
          this.addWatchFile(path);
          const s = JSON.parse(readFileSync(path, "utf8"));
          entries.push({
            id: s.id,
            lang: s.lang,
            title: s.title,
            concept: s.concept,
            concept_label: s.concept_label,
            also: s.also,
            glossary: s.glossary,
            hook: s.levels.neofita.hook,
          });
        }
      }
      return `export default ${JSON.stringify(entries)};`;
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), scenarioCatalog()],
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
