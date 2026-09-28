import type { ConceptId, Scenario } from "../schema/scenario.schema";
import type { Completion } from "./storage";

export type Visit = { scenario: Scenario; completion: Completion };

export function visitsInOrder(
  completed: Record<string, Completion>,
  scenarios: Scenario[],
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
