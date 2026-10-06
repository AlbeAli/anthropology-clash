import { refKey, splitSource, workOf } from "./bibliography";
import type { Author, AuthorsFile } from "../schema/scenario.schema";

export type CitedWork = { ref: string; year?: number; scenarios: string[] };
export type AuthorProfile = Author & { works: CitedWork[]; scenarios: string[] };
export type AuthorsData = { schools: AuthorsFile["schools"]; authors: AuthorProfile[] };
export type CitingScenario = { id: string; source: string };

export function refNames(ref: string): string[] {
  return ref
    .split(",")[0]
    .split(/\s+&\s+/)
    .map((n) => n.trim());
}

function yearOf(ref: string): number | undefined {
  const year = ref.match(/\b(?:1[5-9]|20)\d{2}\b/g)?.at(-1);
  return year ? Number(year) : undefined;
}

export function citedWorks(surname: string, scenarios: CitingScenario[]): CitedWork[] {
  const byKey = new Map<string, CitedWork>();
  for (const s of scenarios) {
    for (const ref of splitSource(s.source)) {
      if (!refNames(ref).includes(surname)) continue;
      const work = workOf(ref);
      const key = refKey(work);
      const cited = byKey.get(key) ?? { ref: work, year: yearOf(work), scenarios: [] };
      if (!cited.scenarios.includes(s.id)) cited.scenarios.push(s.id);
      byKey.set(key, cited);
    }
  }
  return [...byKey.values()].sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
}

export function buildAuthors(file: AuthorsFile, scenarios: CitingScenario[]): AuthorsData {
  const authors = file.authors.map((a) => {
    const works = citedWorks(a.surname, scenarios);
    const ids = new Set(works.flatMap((w) => w.scenarios));
    return { ...a, works, scenarios: [...ids].sort() };
  });
  return { schools: file.schools, authors };
}
