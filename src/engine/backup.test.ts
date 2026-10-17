import { describe, expect, it } from "vitest";
import { BACKUP_MAX_CHARS, exportProgress, parseProgress } from "./backup";
import { emptyState } from "./storage";
import { mergeState } from "./sync";

const known = (id: string) => /^scenario_00[1-3]$/.test(id);

function withProgress() {
  return {
    ...emptyState(),
    level: "studente" as const,
    theme: "dark" as const,
    completed: {
      scenario_001: { level: "neofita" as const, choice: "a", at: "2026-10-01" },
      scenario_002: { level: "studente" as const, choice: "c", at: "2026-10-03" },
    },
    streak: { count: 2, lastDay: "2026-10-03" },
    notes: { scenario_001: { text: "appunto riservato", at: "2026-10-01" } },
  };
}

describe("backup dei progressi", () => {
  it("riporta fermate e serie dopo un giro di salvataggio e lettura", () => {
    const state = withProgress();
    const back = parseProgress(exportProgress(state, new Date("2026-10-17T10:00:00Z")), known);
    expect(back).toEqual({ completed: state.completed, streak: state.streak });
  });

  it("non contiene appunti del diario, livello né tema", () => {
    const text = exportProgress(withProgress(), new Date("2026-10-17T10:00:00Z"));
    expect(text).not.toContain("appunto riservato");
    expect(Object.keys(JSON.parse(text)).sort()).toEqual([
      "completed",
      "exported_at",
      "kind",
      "streak",
      "version",
    ]);
  });

  it("rifiuta ciò che non è un file di progressi", () => {
    const ok = JSON.parse(exportProgress(withProgress(), new Date()));
    const cases = [
      "{non json",
      "[1,2]",
      "null",
      JSON.stringify({ ...ok, kind: "altro" }),
      JSON.stringify({ ...ok, version: 2 }),
      JSON.stringify({ ...ok, version: "1" }),
      " ".repeat(BACKUP_MAX_CHARS + 1),
    ];
    for (const text of cases) expect(parseProgress(text, known)).toBeNull();
  });

  it("scarta voci non valide e fermate che il catalogo non conosce", () => {
    const ok = JSON.parse(exportProgress(withProgress(), new Date()));
    const dirty = {
      ...ok,
      completed: {
        ...ok.completed,
        scenario_003: { level: "neofita", choice: "b", at: "2026-10-04" },
        scenario_999: { level: "neofita", choice: "a", at: "2026-10-04" },
        scenario_004: { level: "neofita", choice: "a", at: "2026-10-04" },
        "../x": { level: "neofita", choice: "a", at: "2026-10-04" },
        scenario_001: { level: "esperto", choice: "a", at: "2026-10-01" },
      },
    };
    const back = parseProgress(JSON.stringify(dirty), known);
    expect(Object.keys(back?.completed ?? {}).sort()).toEqual(["scenario_002", "scenario_003"]);
  });

  it("senza serie valida riparte da zero, senza rifiutare il file", () => {
    const ok = JSON.parse(exportProgress(withProgress(), new Date()));
    const back = parseProgress(
      JSON.stringify({ ...ok, streak: { count: -3, lastDay: "ieri" } }),
      known,
    );
    expect(back?.streak).toEqual({ count: 0, lastDay: null });
    expect(Object.keys(back?.completed ?? {})).toHaveLength(2);
  });

  it("unito allo stato locale tiene la data più vecchia e la serie più lunga", () => {
    const local = {
      ...emptyState(),
      completed: {
        scenario_001: { level: "studente" as const, choice: "b", at: "2026-10-09" },
      },
      streak: { count: 1, lastDay: "2026-10-03" },
    };
    const file = parseProgress(exportProgress(withProgress(), new Date()), known)!;
    const merged = mergeState(local, file, () => "rituale");
    expect(merged.completed.scenario_001).toEqual({
      level: "neofita",
      choice: "a",
      at: "2026-10-01",
    });
    expect(Object.keys(merged.completed).sort()).toEqual(["scenario_001", "scenario_002"]);
    expect(merged.streak).toEqual({ count: 2, lastDay: "2026-10-03" });
  });
});
