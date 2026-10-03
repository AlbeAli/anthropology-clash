import type { CatalogEntry } from "./content";

const DAY_MS = 86_400_000;

export function dayNumber(date: Date): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
}

export function dailyStop(scenarios: CatalogEntry[], date: Date = new Date()): CatalogEntry | null {
  if (scenarios.length === 0) return null;
  const sorted = [...scenarios].sort((a, b) => a.id.localeCompare(b.id));
  return sorted[dayNumber(date) % sorted.length];
}
