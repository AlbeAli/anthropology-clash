import { describe, expect, it } from "vitest";
import type { ConceptId } from "../schema/scenario.schema";
import { emptyState } from "./storage";
import { fromRows, mergeCompleted, mergeState, mergeStreak, toRows } from "./sync";

const concepts: Record<string, ConceptId> = {
  scenario_001: "reciprocita",
  scenario_006: "parentela",
  scenario_010: "rituale",
};
const conceptOf = (id: string) => concepts[id];

describe("unione dei progressi", () => {
  it("unisce le fermate e tiene la data più vecchia, a parità quella locale", () => {
    const merged = mergeCompleted(
      {
        scenario_001: { level: "neofita", choice: "a", at: "2026-09-20" },
        scenario_006: { level: "studente", choice: "c", at: "2026-09-10" },
      },
      {
        scenario_001: { level: "studente", choice: "b", at: "2026-09-12" },
        scenario_006: { level: "neofita", choice: "a", at: "2026-09-10" },
        scenario_010: { level: "neofita", choice: "b", at: "2026-09-15" },
      },
    );
    expect(merged).toEqual({
      scenario_001: { level: "studente", choice: "b", at: "2026-09-12" },
      scenario_006: { level: "studente", choice: "c", at: "2026-09-10" },
      scenario_010: { level: "neofita", choice: "b", at: "2026-09-15" },
    });
  });

  it("tiene la serie più lunga valutata all'ultimo giorno noto", () => {
    const today = { count: 2, lastDay: "2026-09-28" };
    expect(mergeStreak(today, { count: 10, lastDay: "2026-08-01" })).toBe(today);
    const yesterday = { count: 10, lastDay: "2026-09-27" };
    expect(mergeStreak(today, yesterday)).toBe(yesterday);
    const sameLonger = { count: 2, lastDay: "2026-09-27" };
    expect(mergeStreak(today, sameLonger)).toBe(today);
    expect(mergeStreak({ count: 0, lastDay: null }, { count: 0, lastDay: null })).toEqual({
      count: 0,
      lastDay: null,
    });
  });

  it("non sovrascrive mai lo stato locale: livello, tema e concetti restano", () => {
    const local = {
      ...emptyState(),
      level: "studente" as const,
      theme: "dark" as const,
      completed: { scenario_001: { level: "neofita" as const, choice: "a", at: "2026-09-20" } },
      streak: { count: 1, lastDay: "2026-09-20" },
      seenConcepts: ["reciprocita" as const],
    };
    const merged = mergeState(
      local,
      {
        completed: { scenario_010: { level: "neofita", choice: "b", at: "2026-09-15" } },
        streak: { count: 0, lastDay: null },
      },
      conceptOf,
    );
    expect(merged.level).toBe("studente");
    expect(merged.theme).toBe("dark");
    expect(Object.keys(merged.completed).sort()).toEqual(["scenario_001", "scenario_010"]);
    expect(merged.seenConcepts).toEqual(["reciprocita", "rituale"]);
    expect(merged.streak).toEqual(local.streak);
  });
});

describe("righe remote", () => {
  it("andata e ritorno senza perdite", () => {
    const state = {
      ...emptyState(),
      completed: { scenario_006: { level: "studente" as const, choice: "d", at: "2026-09-10" } },
      streak: { count: 3, lastDay: "2026-09-10" },
    };
    const rows = toRows("u1", state);
    expect(rows.progress).toEqual([
      {
        user_id: "u1",
        scenario_id: "scenario_006",
        level: "studente",
        choice: "d",
        completed_on: "2026-09-10",
      },
    ]);
    expect(fromRows(rows.progress, rows.streak)).toEqual({
      completed: state.completed,
      streak: state.streak,
    });
  });

  it("scarta righe con livello o data non validi e parte da zero senza serie", () => {
    const remote = fromRows(
      [
        {
          user_id: "u1",
          scenario_id: "scenario_001",
          level: "esperto" as never,
          choice: "a",
          completed_on: "2026-09-10",
        },
        {
          user_id: "u1",
          scenario_id: "scenario_006",
          level: "neofita",
          choice: "a",
          completed_on: "10/09/2026",
        },
      ],
      null,
    );
    expect(remote).toEqual({ completed: {}, streak: { count: 0, lastDay: null } });
  });
});
