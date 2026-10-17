import { describe, expect, it } from "vitest";
import { bumpStreak, currentStreak, dayKey, markCompleted, nextInSequence } from "./progress";
import {
  BACKUP_KEY,
  clearBackup,
  emptyState,
  migrateState,
  readState,
  writeState,
  STORAGE_KEY,
} from "./storage";

describe("streak", () => {
  it("parte da 1 alla prima chiusura", () => {
    expect(bumpStreak({ count: 0, lastDay: null }, "2026-09-18")).toEqual({
      count: 1,
      lastDay: "2026-09-18",
    });
  });

  it("aumenta se l'ultimo giorno è ieri, anche a cavallo di mese e anno", () => {
    expect(bumpStreak({ count: 3, lastDay: "2026-09-17" }, "2026-09-18").count).toBe(4);
    expect(bumpStreak({ count: 3, lastDay: "2026-09-30" }, "2026-10-01").count).toBe(4);
    expect(bumpStreak({ count: 3, lastDay: "2026-12-31" }, "2027-01-01").count).toBe(4);
  });

  it("resta invariata se già chiuso oggi", () => {
    const s = { count: 3, lastDay: "2026-09-18" };
    expect(bumpStreak(s, "2026-09-18")).toBe(s);
  });

  it("riparte da 1 dopo un giorno saltato", () => {
    expect(bumpStreak({ count: 3, lastDay: "2026-09-16" }, "2026-09-18")).toEqual({
      count: 1,
      lastDay: "2026-09-18",
    });
  });

  it("vale 0 in lettura se l'ultimo giorno è prima di ieri", () => {
    expect(currentStreak({ count: 5, lastDay: "2026-09-17" }, "2026-09-18")).toBe(5);
    expect(currentStreak({ count: 5, lastDay: "2026-09-16" }, "2026-09-18")).toBe(0);
    expect(currentStreak({ count: 0, lastDay: null }, "2026-09-18")).toBe(0);
  });

  it("dayKey usa la data locale con zero iniziali", () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("markCompleted", () => {
  it("registra scenario, livello, scelta, data e concetto visto", () => {
    const next = markCompleted(emptyState(), {
      scenarioId: "scenario_001",
      concept: "reciprocita",
      level: "studente",
      choice: "c",
      today: "2026-09-18",
    });
    expect(next.completed.scenario_001).toEqual({
      level: "studente",
      choice: "c",
      at: "2026-09-18",
    });
    expect(next.seenConcepts).toEqual(["reciprocita"]);
    expect(next.streak).toEqual({ count: 1, lastDay: "2026-09-18" });
  });

  it("non duplica i concetti e non muta lo stato precedente", () => {
    const first = markCompleted(emptyState(), {
      scenarioId: "scenario_001",
      concept: "reciprocita",
      level: "neofita",
      choice: "a",
      today: "2026-09-18",
    });
    const second = markCompleted(first, {
      scenarioId: "scenario_002",
      concept: "reciprocita",
      level: "neofita",
      choice: "b",
      today: "2026-09-18",
    });
    expect(second.seenConcepts).toEqual(["reciprocita"]);
    expect(Object.keys(first.completed)).toEqual(["scenario_001"]);
  });

  it("rigiocare una fermata conserva scelta, livello e data della prima visita", () => {
    const first = markCompleted(emptyState(), {
      scenarioId: "scenario_001",
      concept: "reciprocita",
      level: "neofita",
      choice: "a",
      today: "2026-09-18",
    });
    const replay = markCompleted(first, {
      scenarioId: "scenario_001",
      concept: "reciprocita",
      level: "studente",
      choice: "c",
      today: "2026-09-19",
    });
    expect(replay.completed.scenario_001).toEqual({
      level: "neofita",
      choice: "a",
      at: "2026-09-18",
    });
    expect(replay.completed).toBe(first.completed);
    expect(replay.seenConcepts).toEqual(["reciprocita"]);
    expect(replay.streak).toEqual({ count: 2, lastDay: "2026-09-19" });
  });
});

describe("nextInSequence", () => {
  it("è il primo scenario non completato, undefined se finiti", () => {
    const ids = ["scenario_001", "scenario_002", "scenario_003"];
    let s = emptyState();
    expect(nextInSequence(s, ids)).toBe("scenario_001");
    for (const id of ids) {
      s = markCompleted(s, {
        scenarioId: id,
        concept: "rituale",
        level: "neofita",
        choice: "a",
        today: "2026-09-18",
      });
    }
    expect(nextInSequence(s, ids)).toBeUndefined();
  });
});

describe("storage", () => {
  function fakeStorage(initial: Record<string, string> = {}) {
    const data = { ...initial };
    return {
      getItem: (k: string) => data[k] ?? null,
      setItem: (k: string, v: string) => {
        data[k] = v;
      },
      removeItem: (k: string) => {
        delete data[k];
      },
      data,
    };
  }

  it("restituisce lo stato vuoto senza storage o con JSON corrotto", () => {
    expect(readState(undefined)).toEqual(emptyState());
    expect(readState(fakeStorage({ [STORAGE_KEY]: "{non json" }))).toEqual(emptyState());
  });

  it("azzera dichiaratamente uno stato con version diversa", () => {
    const s = fakeStorage({ [STORAGE_KEY]: JSON.stringify({ version: 0, level: "studente" }) });
    expect(readState(s).level).toBeNull();
  });

  it("conserva una copia di ciò che scarta: JSON corrotto, versione ignota, valore non oggetto", () => {
    for (const raw of ["{non json", JSON.stringify({ version: 9, level: "studente" }), "[1,2]"]) {
      const s = fakeStorage({ [STORAGE_KEY]: raw });
      expect(readState(s)).toEqual(emptyState());
      expect(s.data[BACKUP_KEY]).toBe(raw);
    }
  });

  it("non crea la copia se lo stato è valido o assente", () => {
    const s = fakeStorage({ [STORAGE_KEY]: JSON.stringify({ version: 1, level: "studente" }) });
    readState(s);
    readState(fakeStorage());
    expect(s.data[BACKUP_KEY]).toBeUndefined();
  });

  it("resta vuoto, senza eccezioni, se la copia non si può scrivere", () => {
    const s = {
      getItem: () => "{non json",
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };
    expect(readState(s)).toEqual(emptyState());
  });

  it("clearBackup toglie la copia e non fallisce senza storage", () => {
    const s = fakeStorage({ [BACKUP_KEY]: "x" });
    clearBackup(s);
    expect(s.data[BACKUP_KEY]).toBeUndefined();
    expect(() => clearBackup(undefined)).not.toThrow();
  });

  it("scarta da seenConcepts i valori che non sono concetti", () => {
    const s = fakeStorage({
      [STORAGE_KEY]: JSON.stringify({
        version: 1,
        seenConcepts: ["rituale", "constructor", 3, null, "consumo"],
      }),
    });
    expect(readState(s).seenConcepts).toEqual(["rituale", "consumo"]);
  });

  it("scrive e rilegge lo stato, scartando campi non validi", () => {
    const s = fakeStorage();
    writeState({ ...emptyState(), level: "studente", theme: "dark" }, s);
    const back = readState(s);
    expect(back.level).toBe("studente");
    expect(back.theme).toBe("dark");
    s.setItem(STORAGE_KEY, JSON.stringify({ version: 1, level: "esperto", theme: "blu" }));
    expect(readState(s).level).toBeNull();
    expect(readState(s).theme).toBeUndefined();
  });

  it("scarta le fermate e la serie malformate senza perdere le altre", () => {
    const s = fakeStorage();
    s.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        completed: {
          scenario_001: { level: "neofita", choice: "a", at: "2026-10-01" },
          scenario_002: { level: "neofita", choice: "z", at: "2026-10-01" },
          scenario_003: { level: "esperto", choice: "a", at: "2026-10-01" },
          scenario_004: { level: "neofita", choice: "a", at: 20261001 },
          scenario_005: "x",
          altro: { level: "neofita", choice: "a", at: "2026-10-01" },
        },
        streak: { count: -1, lastDay: "ieri" },
      }),
    );
    const back = readState(s);
    expect(Object.keys(back.completed)).toEqual(["scenario_001"]);
    expect(back.streak).toEqual({ count: 0, lastDay: null });
    s.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, streak: { count: 3, lastDay: "2026-10-02" } }),
    );
    expect(readState(s).streak).toEqual({ count: 3, lastDay: "2026-10-02" });
  });

  it("non lancia se lo storage rifiuta la scrittura", () => {
    const broken = {
      setItem: () => {
        throw new Error("quota");
      },
    };
    expect(() => writeState(emptyState(), broken)).not.toThrow();
  });
});

describe("migrateState", () => {
  const to2 = (raw: Record<string, unknown>) => ({ ...raw, version: 2, extra: [] });
  const to3 = (raw: Record<string, unknown>) => ({ ...raw, version: 3 });

  it("lascia passare lo stato già alla versione corrente", () => {
    const raw = { version: 2, a: 1 };
    expect(migrateState(raw, 2, {})).toBe(raw);
  });

  it("applica i passi in catena fino alla versione richiesta", () => {
    expect(migrateState({ version: 1, a: 1 }, 3, { 1: to2, 2: to3 })).toEqual({
      version: 3,
      a: 1,
      extra: [],
    });
  });

  it("restituisce null se manca un passo, se la versione è futura o non è un intero", () => {
    expect(migrateState({ version: 1 }, 2, {})).toBeNull();
    expect(migrateState({ version: 3 }, 2, { 1: to2 })).toBeNull();
    expect(migrateState({ version: "1" }, 2, { 1: to2 })).toBeNull();
    expect(migrateState({}, 2, { 1: to2 })).toBeNull();
  });

  it("interrompe una migrazione che non fa avanzare la versione", () => {
    expect(migrateState({ version: 1 }, 2, { 1: (raw) => raw })).toBeNull();
  });
});
