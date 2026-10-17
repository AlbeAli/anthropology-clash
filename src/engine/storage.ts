import type { ConceptId, Lang, Level } from "../schema/scenario.schema";

export const STORAGE_KEY = "anthropology-clash.v1";
export const BACKUP_KEY = `${STORAGE_KEY}.backup`;
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

const CONCEPTS: Record<ConceptId, true> = {
  reciprocita: true,
  parentela: true,
  rituale: true,
  relativismo: true,
  consumo: true,
};
const CONCEPT_SET = new Set<unknown>(Object.keys(CONCEPTS));

type Migration = (raw: Record<string, unknown>) => Record<string, unknown>;
const MIGRATIONS: Record<number, Migration> = {};

export function migrateState(
  raw: Record<string, unknown>,
  target: number = STORAGE_VERSION,
  table: Record<number, Migration> = MIGRATIONS,
): Record<string, unknown> | null {
  let current = raw;
  while (Number.isInteger(current.version) && (current.version as number) < target) {
    const from = current.version as number;
    const next = table[from]?.(current);
    if (!next || !Number.isInteger(next.version) || (next.version as number) <= from) return null;
    current = next;
  }
  return current.version === target ? current : null;
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
    seenConcepts: Array.isArray(raw.seenConcepts)
      ? (raw.seenConcepts.filter((c) => CONCEPT_SET.has(c)) as ConceptId[])
      : [],
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

export function readState(
  storage:
    (Pick<Storage, "getItem"> & Partial<Pick<Storage, "setItem">>) | undefined = globalStorage(),
) {
  let raw: string | null | undefined;
  try {
    raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed: unknown = JSON.parse(raw);
    const migrated = isRecord(parsed) ? migrateState(parsed) : null;
    if (migrated) return sanitize(migrated);
  } catch {
    /* JSON non valido o storage non leggibile: stato vuoto */
  }
  keepBackup(storage, raw);
  return emptyState();
}

function keepBackup(
  storage: Partial<Pick<Storage, "setItem">> | undefined,
  raw: string | null | undefined,
) {
  if (!storage?.setItem || !raw) return;
  try {
    storage.setItem(BACKUP_KEY, raw);
  } catch {
    /* quota piena o storage bloccato: nessuna copia */
  }
}

export function clearBackup(storage: Pick<Storage, "removeItem"> | undefined = globalStorage()) {
  try {
    storage?.removeItem(BACKUP_KEY);
  } catch {
    /* storage bloccato: niente da togliere */
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
