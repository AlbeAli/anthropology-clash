import { Scenario, Concept, type Lang } from "../schema/scenario.schema";

const scenarioFiles = import.meta.glob("../content/*/scenarios/*.json", {
  eager: true,
  import: "default",
});
const conceptFiles = import.meta.glob("../content/*/concepts.json", {
  eager: true,
  import: "default",
});

function langOf(path: string): string {
  return path.split("/content/")[1].split("/")[0];
}

const scenariosByLang = new Map<string, Scenario[]>();
for (const [path, raw] of Object.entries(scenarioFiles)) {
  const lang = langOf(path);
  const list = scenariosByLang.get(lang) ?? [];
  list.push(Scenario.parse(raw));
  scenariosByLang.set(lang, list);
}
for (const list of scenariosByLang.values()) {
  list.sort((a, b) => a.id.localeCompare(b.id));
}

const conceptsByLang = new Map<string, Concept[]>();
for (const [path, raw] of Object.entries(conceptFiles)) {
  conceptsByLang.set(langOf(path), Concept.array().parse(raw));
}

export function getScenarios(lang: Lang): Scenario[] {
  return scenariosByLang.get(lang) ?? [];
}

export function getScenario(lang: Lang, id: string): Scenario | undefined {
  return getScenarios(lang).find((s) => s.id === id);
}

export function getConcepts(lang: Lang): Concept[] {
  return conceptsByLang.get(lang) ?? [];
}
