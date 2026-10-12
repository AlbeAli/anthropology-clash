import type { ConceptId, Lang, Level } from "../schema/scenario.schema";

export const STORAGE_KEY = "anthropology-clash.v1";
const STORAGE_VERSION = 1;

export type Theme = "light" | "dark";

export type Completion = { level: Level; choice: string; at: string };
export type Streak = { count: number; lastDay: string | null };
export type Note = { text: string; at: string };

export const NOTE_MAX = 2000;

export type StoredState = {
  version: typeof STORAGE_VERSION;
  lang: Lang;
  level: Level | null;
  completed: Record<string, Completion>;
  streak: Streak;
  seenConcepts: ConceptId[];
  theme?: Theme;
  notes?: Record<string, Note>;
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
    completed: sanitizeCompleted(raw.completed),
    streak: sanitizeStreak(raw.streak) ?? base.streak,
    seenConcepts: Array.isArray(raw.seenConcepts) ? (raw.seenConcepts as ConceptId[]) : [],
    theme: raw.theme === "light" || raw.theme === "dark" ? raw.theme : undefined,
    notes: sanitizeNotes(raw.notes),
  };
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

function sanitizeCompleted(raw: unknown): Record<string, Completion> {
  const completed: Record<string, Completion> = {};
  if (!isRecord(raw)) return completed;
  for (const [id, c] of Object.entries(raw)) {
    if (!/^scenario_\d{3}$/.test(id) || !isRecord(c)) continue;
    const { level, choice, at } = c;
    if (level !== "neofita" && level !== "studente") continue;
    if (typeof choice !== "string" || !/^[a-d]$/.test(choice)) continue;
    if (typeof at !== "string" || !DAY.test(at)) continue;
    completed[id] = { level, choice, at };
  }
  return completed;
}

function sanitizeStreak(raw: unknown): Streak | undefined {
  if (!isRecord(raw) || !Number.isInteger(raw.count) || (raw.count as number) < 0) return undefined;
  const { lastDay } = raw;
  if (
    lastDay !== null &&
    lastDay !== undefined &&
    (typeof lastDay !== "string" || !DAY.test(lastDay))
  ) {
    return undefined;
  }
  return { count: raw.count as number, lastDay: lastDay ?? null };
}

function sanitizeNotes(raw: unknown): Record<string, Note> | undefined {
  if (!isRecord(raw)) return undefined;
  const notes: Record<string, Note> = {};
  for (const [id, note] of Object.entries(raw)) {
    if (!/^scenario_\d{3}$/.test(id) || !isRecord(note)) continue;
    if (typeof note.text !== "string" || typeof note.at !== "string" || !note.text.trim()) continue;
    notes[id] = { text: note.text.slice(0, NOTE_MAX), at: note.at };
  }
  return Object.keys(notes).length ? notes : undefined;
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
): boolean {
  try {
    if (!storage) return false;
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    /* persistenza non disponibile: l'app continua senza */
    return false;
  }
}

export function canPersist(storage: Storage | undefined = globalStorage()): boolean {
  try {
    if (!storage) return false;
    const key = `${STORAGE_KEY}.prova`;
    storage.setItem(key, "1");
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function globalStorage(): Storage | undefined {
  try {
    return typeof localStorage === "undefined" ? undefined : localStorage;
  } catch {
    return undefined;
  }
}
