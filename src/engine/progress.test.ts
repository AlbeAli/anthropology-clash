import { describe, expect, it } from "vitest";
import { bumpStreak, currentStreak, dayKey, markCompleted, nextInSequence } from "./progress";
import { emptyState, readState, writeState, STORAGE_KEY } from "./storage";

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

  it("non lancia se lo storage rifiuta la scrittura", () => {
    const broken = {
      setItem: () => {
        throw new Error("quota");
      },
    };
    expect(() => writeState(emptyState(), broken)).not.toThrow();
  });
});
