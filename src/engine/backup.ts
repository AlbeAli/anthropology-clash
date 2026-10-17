import { isRecord, sanitizeCompleted, sanitizeStreak, type StoredState } from "./storage";
import type { RemoteProgress } from "./sync";

export const BACKUP_MAX_CHARS = 50_000;

const KIND = "anthropology-clash.progress";
const VERSION = 1;

export function exportProgress(state: StoredState, at: Date): string {
  return JSON.stringify(
    {
      kind: KIND,
      version: VERSION,
      exported_at: at.toISOString(),
      completed: state.completed,
      streak: state.streak,
    },
    null,
    2,
  );
}

export function parseProgress(
  text: string,
  known: (scenarioId: string) => boolean,
): RemoteProgress | null {
  if (text.length > BACKUP_MAX_CHARS) return null;
  try {
    const raw: unknown = JSON.parse(text);
    if (!isRecord(raw) || raw.kind !== KIND || raw.version !== VERSION) return null;
    const completed = Object.fromEntries(
      Object.entries(sanitizeCompleted(raw.completed)).filter(([id]) => known(id)),
    );
    return { completed, streak: sanitizeStreak(raw.streak) ?? { count: 0, lastDay: null } };
  } catch {
    return null;
  }
}
