import type { Lang, Scenario } from "../schema/scenario.schema";

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

const LOCATOR =
  /^(?:(?:parte|libro|cap\.|sez\.|sezion[ei]|caso|appendice)\s|(?:introduzione|prefazione|preface)(?:$|\s\(|\se\s))/i;
const PAGES = /^pp?\.\s/;

function topLevelSegments(ref: string): string[] {
  const segments: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < ref.length; i++) {
    const c = ref[i];
    if (c === "(" || c === "«") depth++;
    else if ((c === ")" || c === "»") && depth > 0) depth--;
    else if (c === "," && depth === 0 && ref[i + 1] === " ") {
      segments.push(ref.slice(start, i));
      start = i + 2;
    }
  }
  segments.push(ref.slice(start));
  return segments;
}

export function workOf(ref: string): string {
  const segments = topLevelSegments(ref);
  const kept: string[] = [];
  let located = false;
  let inPages = false;
  segments.forEach((segment, i) => {
    const pages =
      /^p\.\s/.test(segment) ||
      (PAGES.test(segment) && (located || /^\d/.test(segments[i + 1] ?? "")));
    const morePages = inPages && /^\d/.test(segment);
    inPages = pages || morePages;
    const moreTitles = located && segment.startsWith("«");
    if (i > 0 && (LOCATOR.test(segment) || inPages || moreTitles)) located = true;
    else kept.push(segment);
  });
  return kept.join(", ");
}

export function refKey(ref: string): string {
  const lower = ref.toLowerCase();
  const author = lower.split(",")[0].trim();
  const year = lower.match(/\b(?:1[5-9]|20)\d{2}\b/g)?.at(-1) ?? "";
  const title = lower
    .slice(author.length + 1)
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join(" ");
  return `${author}|${year}|${title}`;
}

export function buildBibliography(scenarios: Scenario[], lang: Lang): BibliographyEntry[] {
  const byKey = new Map<string, BibliographyEntry>();
  const add = (cited: string, scenarioId: string, extra: Partial<BibliographyEntry> = {}) => {
    const ref = workOf(cited);
    const key = refKey(ref);
    const entry = byKey.get(key) ?? { ref, scenarios: [] };
    if (ref.length > entry.ref.length) entry.ref = ref;
    if (!entry.scenarios.includes(scenarioId)) entry.scenarios.push(scenarioId);
    if (extra.access && !entry.access) entry.access = extra.access;
    if (extra.url && !entry.url) entry.url = extra.url;
    byKey.set(key, entry);
  };
  for (const s of scenarios) {
    for (const ref of splitSource(s.levels.studente.source)) add(ref, s.id);
    for (const d of s.levels.studente.deepen ?? []) {
      add(d.ref, s.id, { access: d.access, url: d.url });
    }
  }
  return [...byKey.values()].sort((a, b) => a.ref.localeCompare(b.ref, lang));
}
