/// <reference types="vitest/config" />
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { buildAuthors, type AuthorsData } from "./src/engine/authors";
import type { AuthorsFile } from "./src/schema/scenario.schema";

const CATALOG = "virtual:catalog";
const AUTHORS = "virtual:authors";
const AUTHOR_IDS = "virtual:author-ids";
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

function authorProfiles(): Plugin {
  const resolved = "\0" + AUTHORS;
  const resolvedIds = "\0" + AUTHOR_IDS;
  return {
    name: "author-profiles",
    resolveId: (id) => (id === AUTHORS ? resolved : id === AUTHOR_IDS ? resolvedIds : undefined),
    load(id) {
      if (id === resolvedIds) {
        const idsByLang: Record<string, Record<string, string>> = {};
        for (const lang of readdirSync(contentDir)) {
          const path = join(contentDir, lang, "authors.json");
          if (!existsSync(path)) continue;
          this.addWatchFile(path);
          const file: AuthorsFile = JSON.parse(readFileSync(path, "utf8"));
          idsByLang[lang] = Object.fromEntries(file.authors.map((a) => [a.surname, a.id]));
        }
        return `export default ${JSON.stringify(idsByLang)};`;
      }
      if (id !== resolved) return;
      const byLang: Record<string, AuthorsData> = {};
      for (const lang of readdirSync(contentDir)) {
        const path = join(contentDir, lang, "authors.json");
        if (!existsSync(path)) continue;
        this.addWatchFile(path);
        const dir = join(contentDir, lang, "scenarios");
        const scenarios = readdirSync(dir)
          .filter((f) => f.endsWith(".json"))
          .map((f) => {
            this.addWatchFile(join(dir, f));
            const s = JSON.parse(readFileSync(join(dir, f), "utf8"));
            return { id: s.id, source: s.levels.studente.source };
          });
        byLang[lang] = buildAuthors(JSON.parse(readFileSync(path, "utf8")), scenarios);
      }
      return `export default ${JSON.stringify(byLang)};`;
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), scenarioCatalog(), authorProfiles()],
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
