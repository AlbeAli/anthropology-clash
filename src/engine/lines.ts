import type { ConceptId } from "../schema/scenario.schema";

export function lineColor(id: ConceptId): string {
  return `var(--l-${id})`;
}

export function lineInk(id: ConceptId): string {
  return id === "relativismo" ? "#1a1a1a" : "#ffffff";
}

export function stopNumber(scenarioId: string): number {
  return Number(scenarioId.slice(scenarioId.lastIndexOf("_") + 1));
}
