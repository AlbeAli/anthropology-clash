import type { Lang, Scenario } from "../schema/scenario.schema";
import { getScenarios } from "./content";

type Deepen = NonNullable<Scenario["levels"]["studente"]["deepen"]>[number];

export type BibliographyEntry = {
  ref: string;
  scenarios: string[];
  access?: Deepen["access"];
  url?: string;
};

export function splitSource(source: string): string[] {
  return source
    .split(/;\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function refKey(ref: string): string {
  const lower = ref.toLowerCase();
  const author = lower.split(",")[0].trim();
  const year = lower.match(/\b(1[5-9]|20)\d{2}\b/)?.[0] ?? "";
  const title = lower
    .slice(author.length + 1)
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join(" ");
  return `${author}|${year}|${title}`;
}

export function buildBibliography(lang: Lang): BibliographyEntry[] {
  const byKey = new Map<string, BibliographyEntry>();
  const add = (ref: string, scenarioId: string, extra: Partial<BibliographyEntry> = {}) => {
    const key = refKey(ref);
    const entry = byKey.get(key) ?? { ref, scenarios: [] };
    if (ref.length > entry.ref.length) entry.ref = ref;
    if (!entry.scenarios.includes(scenarioId)) entry.scenarios.push(scenarioId);
    if (extra.access && !entry.access) entry.access = extra.access;
    if (extra.url && !entry.url) entry.url = extra.url;
    byKey.set(key, entry);
  };
  for (const s of getScenarios(lang)) {
    for (const ref of splitSource(s.levels.studente.source)) add(ref, s.id);
    for (const d of s.levels.studente.deepen ?? []) {
      add(d.ref, s.id, { access: d.access, url: d.url });
    }
  }
  return [...byKey.values()].sort((a, b) => a.ref.localeCompare(b.ref, lang));
}
