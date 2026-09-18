import type { Lang } from "../schema/scenario.schema";
import { getScenarios } from "./content";

export function nextScenarioId(lang: Lang, currentId: string): string | undefined {
  const ids = getScenarios(lang).map((s) => s.id);
  const index = ids.indexOf(currentId);
  if (index === -1) return undefined;
  return ids[index + 1];
}
