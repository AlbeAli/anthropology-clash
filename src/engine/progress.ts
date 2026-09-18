import type { ConceptId, Level } from "../schema/scenario.schema";
import type { StoredState, Streak } from "./storage";

export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function previousDay(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return dayKey(new Date(y, m - 1, d - 1));
}

export function bumpStreak(streak: Streak, today: string): Streak {
  if (streak.lastDay === today) return streak;
  if (streak.lastDay === previousDay(today)) return { count: streak.count + 1, lastDay: today };
  return { count: 1, lastDay: today };
}

export function currentStreak(streak: Streak, today: string): number {
  if (streak.lastDay === today || streak.lastDay === previousDay(today)) return streak.count;
  return 0;
}

export type CompletionInput = {
  scenarioId: string;
  concept: ConceptId;
  level: Level;
  choice: string;
  today: string;
};

export function markCompleted(state: StoredState, input: CompletionInput): StoredState {
  return {
    ...state,
    completed: {
      ...state.completed,
      [input.scenarioId]: { level: input.level, choice: input.choice, at: input.today },
    },
    streak: bumpStreak(state.streak, input.today),
    seenConcepts: state.seenConcepts.includes(input.concept)
      ? state.seenConcepts
      : [...state.seenConcepts, input.concept],
  };
}

export function nextInSequence(state: StoredState, orderedIds: string[]): string | undefined {
  return orderedIds.find((id) => !(id in state.completed));
}
