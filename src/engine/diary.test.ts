import { describe, expect, it } from "vitest";
import type { CatalogEntry } from "./content";
import { diaryEntries, diaryText, withNote } from "./diary";
import { emptyState, NOTE_MAX, readState, STORAGE_KEY, type StoredState } from "./storage";
import { mergeState } from "./sync";

const entry = (id: string): CatalogEntry =>
  ({ id, lang: "it", title: `Titolo ${id}`, concept: "reciprocita" }) as CatalogEntry;
const catalog = ["scenario_001", "scenario_002", "scenario_003"].map(entry);
const now = new Date("2026-10-03T21:41:00Z");

describe("withNote", () => {
  it("salva, taglia a 2000 caratteri e toglie l'appunto vuoto", () => {
    let s = withNote(emptyState(), "scenario_001", "x".repeat(NOTE_MAX + 50), now);
    expect(s.notes?.scenario_001).toEqual({ text: "x".repeat(NOTE_MAX), at: now.toISOString() });
    s = withNote(s, "scenario_001", "   \n ", now);
    expect(s.notes).toBeUndefined();
  });
});

describe("diaryEntries", () => {
  it("segue l'ordine delle visite e tiene in fondo gli appunti di fermate non più visitate", () => {
    const state: StoredState = {
      ...emptyState(),
      completed: {
        scenario_002: { level: "neofita", choice: "a", at: "2026-10-01" },
        scenario_001: { level: "studente", choice: "b", at: "2026-10-02" },
      },
      notes: { scenario_003: { text: "rimasto", at: now.toISOString() } },
    };
    const entries = diaryEntries(state, catalog);
    expect(entries.map((e) => e.scenario.id)).toEqual([
      "scenario_002",
      "scenario_001",
      "scenario_003",
    ]);
    expect(entries[2].completion).toBeUndefined();
    expect(entries[2].note?.text).toBe("rimasto");
  });
});

describe("lettura e sincronizzazione", () => {
  it("scarta appunti malformati letti dal browser", () => {
    const raw = {
      ...emptyState(),
      notes: {
        scenario_001: { text: "valido", at: "2026-10-03T21:41:00.000Z" },
        scenario_002: { text: "   ", at: "x" },
        "../altro": { text: "no", at: "x" },
        scenario_004: { text: 42, at: "x" },
      },
    };
    const state = readState({ getItem: (k) => (k === STORAGE_KEY ? JSON.stringify(raw) : null) });
    expect(Object.keys(state.notes ?? {})).toEqual(["scenario_001"]);
  });

  it("l'unione con i progressi remoti conserva il diario locale", () => {
    const local = withNote(emptyState(), "scenario_001", "solo qui", now);
    const merged = mergeState(
      local,
      {
        completed: { scenario_002: { level: "neofita", choice: "a", at: "2026-10-01" } },
        streak: { count: 1, lastDay: "2026-10-01" },
      },
      () => "reciprocita",
    );
    expect(merged.notes).toEqual(local.notes);
  });
});

describe("diaryText", () => {
  it("mette titolo, dati della fermata, uscita e appunto in un testo semplice", () => {
    const text = diaryText("Diario di campo", [
      {
        title: "La soglia",
        meta: "Linea Rituale · fermata 10",
        choice: "La tua uscita: A",
        text: " Uno \n",
      },
      { title: "La collana", meta: "Linea Dono · fermata 1", text: "Due" },
    ]);
    expect(text).toBe(
      "Diario di campo\n\nLa soglia\nLinea Rituale · fermata 10\nLa tua uscita: A\n\nUno\n\n—\n\nLa collana\nLinea Dono · fermata 1\n\nDue\n\n—\n",
    );
  });
});
