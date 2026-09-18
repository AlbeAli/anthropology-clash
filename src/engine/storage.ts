import type { ConceptId, Lang, Level } from "../schema/scenario.schema";

export const STORAGE_KEY = "anthropology-clash.v1";
export const STORAGE_VERSION = 1;

export type Theme = "light" | "dark";

export type Completion = { level: Level; choice: string; at: string };
export type Streak = { count: number; lastDay: string | null };

export type StoredState = {
  version: typeof STORAGE_VERSION;
  lang: Lang;
  level: Level | null;
  completed: Record<string, Completion>;
  streak: Streak;
  seenConcepts: ConceptId[];
  theme?: Theme;
};

export function emptyState(): StoredState {
  return {
    version: STORAGE_VERSION,
    lang: "it",
    level: null,
    completed: {},
    streak: { count: 0, lastDay: null },
    seenConcepts: [],
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function sanitize(raw: unknown): StoredState {
  const base = emptyState();
  if (!isRecord(raw) || raw.version !== STORAGE_VERSION) return base;
  return {
    ...base,
    lang: raw.lang === "en" ? "en" : "it",
    level: raw.level === "neofita" || raw.level === "studente" ? raw.level : null,
    completed: isRecord(raw.completed) ? (raw.completed as Record<string, Completion>) : {},
    streak:
      isRecord(raw.streak) && typeof raw.streak.count === "number"
        ? { count: raw.streak.count, lastDay: (raw.streak.lastDay as string | null) ?? null }
        : base.streak,
    seenConcepts: Array.isArray(raw.seenConcepts) ? (raw.seenConcepts as ConceptId[]) : [],
    theme: raw.theme === "light" || raw.theme === "dark" ? raw.theme : undefined,
  };
}

export function readState(storage: Pick<Storage, "getItem"> | undefined = globalStorage()) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    return raw ? sanitize(JSON.parse(raw)) : emptyState();
  } catch {
    return emptyState();
  }
}

export function writeState(
  state: StoredState,
  storage: Pick<Storage, "setItem"> | undefined = globalStorage(),
): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* persistenza non disponibile: l'app continua senza */
  }
}

function globalStorage(): Storage | undefined {
  try {
    return typeof localStorage === "undefined" ? undefined : localStorage;
  } catch {
    return undefined;
  }
}
