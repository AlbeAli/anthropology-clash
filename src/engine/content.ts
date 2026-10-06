import catalog from "virtual:catalog";
import type { Concept, GlossaryEntry, Lang, Scenario } from "../schema/scenario.schema";

export type CatalogEntry = Pick<
  Scenario,
  "id" | "lang" | "title" | "concept" | "concept_label" | "also" | "glossary"
> & {
  hook?: string;
};

const scenarioFiles = import.meta.glob<Scenario>("../content/*/scenarios/*.json", {
  import: "default",
});
const conceptFiles = import.meta.glob<Concept[]>("../content/*/concepts.json", {
  eager: true,
  import: "default",
});

const glossaryFiles = import.meta.glob<GlossaryEntry[]>("../content/*/glossary.json", {
  import: "default",
});

export function loadGlossary(lang: Lang): Promise<GlossaryEntry[]> {
  const load = glossaryFiles[`../content/${lang}/glossary.json`];
  return load ? load() : Promise.resolve([]);
}

const catalogByLang = new Map<string, CatalogEntry[]>();
for (const entry of catalog) {
  const list = catalogByLang.get(entry.lang) ?? [];
  list.push(entry);
  catalogByLang.set(entry.lang, list);
}
for (const list of catalogByLang.values()) {
  list.sort((a, b) => a.id.localeCompare(b.id));
}

export function getCatalog(lang: Lang): CatalogEntry[] {
  return catalogByLang.get(lang) ?? [];
}

export function getEntry(lang: Lang, id: string): CatalogEntry | undefined {
  return getCatalog(lang).find((s) => s.id === id);
}

export function getConcepts(lang: Lang): Concept[] {
  return conceptFiles[`../content/${lang}/concepts.json`] ?? [];
}

const loading = new Map<string, Promise<Scenario | undefined>>();

export function loadScenario(lang: Lang, id: string): Promise<Scenario | undefined> {
  const key = `../content/${lang}/scenarios/${id}.json`;
  let promise = loading.get(key);
  if (!promise) {
    const load = scenarioFiles[key];
    promise = load
      ? load().catch((error: unknown) => {
          loading.delete(key);
          throw error;
        })
      : Promise.resolve(undefined);
    loading.set(key, promise);
  }
  return promise;
}

export function prefetchScenario(lang: Lang, id: string): void {
  loadScenario(lang, id).catch(() => {});
}

const loadingAll = new Map<Lang, Promise<Scenario[]>>();

export function loadScenarios(lang: Lang): Promise<Scenario[]> {
  let promise = loadingAll.get(lang);
  if (!promise) {
    promise = Promise.all(getCatalog(lang).map((e) => loadScenario(lang, e.id))).then(
      (list) => list.filter((s): s is Scenario => s !== undefined),
      (error: unknown) => {
        loadingAll.delete(lang);
        throw error;
      },
    );
    loadingAll.set(lang, promise);
  }
  return promise;
}
