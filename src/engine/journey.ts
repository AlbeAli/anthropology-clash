import type { ConceptId } from "../schema/scenario.schema";
import type { CatalogEntry } from "./content";
import type { Completion } from "./storage";

export type Visit = { scenario: CatalogEntry; completion: Completion };

export function visitsInOrder(
  completed: Record<string, Completion>,
  scenarios: CatalogEntry[],
): Visit[] {
  return scenarios
    .filter((s) => s.id in completed)
    .map((s) => ({ scenario: s, completion: completed[s.id] }))
    .sort(
      (a, b) =>
        a.completion.at.localeCompare(b.completion.at) ||
        a.scenario.id.localeCompare(b.scenario.id),
    );
}

export function linesTouched(visits: Visit[]): ConceptId[] {
  return [...new Set(visits.map((v) => v.scenario.concept))];
}

export type LineStamp = {
  concept: ConceptId;
  seen: number;
  total: number;
  first: string | null;
  last: string | null;
  terminus: boolean;
};

export function lineStamps(
  visits: Visit[],
  scenarios: CatalogEntry[],
  order: ConceptId[],
): LineStamp[] {
  return order.map((concept) => {
    const total = scenarios.filter((s) => s.concept === concept).length;
    const days = visits
      .filter((v) => v.scenario.concept === concept)
      .map((v) => v.completion.at)
      .sort();
    return {
      concept,
      seen: days.length,
      total,
      first: days[0] ?? null,
      last: days[days.length - 1] ?? null,
      terminus: total > 0 && days.length === total,
    };
  });
}
