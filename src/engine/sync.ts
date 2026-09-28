import type { ConceptId, Level } from "../schema/scenario.schema";
import { currentStreak } from "./progress";
import type { Completion, StoredState, Streak } from "./storage";

export type RemoteProgress = { completed: Record<string, Completion>; streak: Streak };

export type ProgressRow = {
  user_id: string;
  scenario_id: string;
  level: Level;
  choice: string;
  completed_on: string;
};

export type StreakRow = { user_id: string; streak_count: number; last_day: string | null };

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function mergeCompleted(
  local: Record<string, Completion>,
  remote: Record<string, Completion>,
): Record<string, Completion> {
  const merged = { ...remote };
  for (const [id, c] of Object.entries(local)) {
    const other = merged[id];
    if (!other || c.at <= other.at) merged[id] = c;
  }
  return merged;
}

export function mergeStreak(local: Streak, remote: Streak): Streak {
  const days = [local.lastDay, remote.lastDay].filter((d): d is string => d !== null).sort();
  const ref = days.at(-1);
  if (!ref) return local.count >= remote.count ? local : remote;
  const l = currentStreak(local, ref);
  const r = currentStreak(remote, ref);
  if (l !== r) return l > r ? local : remote;
  return (local.lastDay ?? "") >= (remote.lastDay ?? "") ? local : remote;
}

export function mergeState(
  local: StoredState,
  remote: RemoteProgress,
  conceptOf: (scenarioId: string) => ConceptId | undefined,
): StoredState {
  const completed = mergeCompleted(local.completed, remote.completed);
  const seen = new Set(local.seenConcepts);
  for (const id of Object.keys(completed)) {
    const concept = conceptOf(id);
    if (concept) seen.add(concept);
  }
  return {
    ...local,
    completed,
    streak: mergeStreak(local.streak, remote.streak),
    seenConcepts: [...seen],
  };
}

export function fromRows(rows: ProgressRow[], streak: StreakRow | null): RemoteProgress {
  const completed: Record<string, Completion> = {};
  for (const row of rows) {
    if (row.level !== "neofita" && row.level !== "studente") continue;
    if (!DAY.test(row.completed_on)) continue;
    completed[row.scenario_id] = { level: row.level, choice: row.choice, at: row.completed_on };
  }
  return {
    completed,
    streak: streak
      ? { count: Math.max(0, streak.streak_count), lastDay: streak.last_day }
      : { count: 0, lastDay: null },
  };
}

export function toRows(
  userId: string,
  state: StoredState,
): { progress: ProgressRow[]; streak: StreakRow } {
  return {
    progress: Object.entries(state.completed).map(([scenarioId, c]) => ({
      user_id: userId,
      scenario_id: scenarioId,
      level: c.level,
      choice: c.choice,
      completed_on: c.at,
    })),
    streak: { user_id: userId, streak_count: state.streak.count, last_day: state.streak.lastDay },
  };
}
