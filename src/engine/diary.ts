import type { CatalogEntry } from "./content";
import { visitsInOrder } from "./journey";
import { NOTE_MAX, type Completion, type Note, type StoredState } from "./storage";

export type DiaryEntry = { scenario: CatalogEntry; completion?: Completion; note?: Note };

export function withNote(state: StoredState, id: string, text: string, now: Date): StoredState {
  const notes = { ...state.notes };
  if (text.trim()) notes[id] = { text: text.slice(0, NOTE_MAX), at: now.toISOString() };
  else delete notes[id];
  return { ...state, notes: Object.keys(notes).length ? notes : undefined };
}

export function diaryEntries(state: StoredState, scenarios: CatalogEntry[]): DiaryEntry[] {
  const notes = state.notes ?? {};
  const visited: DiaryEntry[] = visitsInOrder(state.completed, scenarios).map((v) => ({
    scenario: v.scenario,
    completion: v.completion,
    note: notes[v.scenario.id],
  }));
  const orphans: DiaryEntry[] = scenarios
    .filter((s) => s.id in notes && !(s.id in state.completed))
    .map((s) => ({ scenario: s, note: notes[s.id] }));
  return [...visited, ...orphans];
}

export type DiaryBlock = { title: string; meta: string; choice?: string; text: string };

export function diaryText(head: string, blocks: DiaryBlock[]): string {
  const parts = blocks.map((b) =>
    [b.title, b.meta, ...(b.choice ? [b.choice] : []), "", b.text.trim()].join("\n"),
  );
  return [head, "", ...parts.flatMap((p) => [p, "", "—", ""])].join("\n").trimEnd() + "\n";
}
