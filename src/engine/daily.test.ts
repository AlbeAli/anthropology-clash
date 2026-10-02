import { describe, expect, it } from "vitest";
import { getCatalog } from "./content";
import { dailyStop } from "./daily";

const scenarios = getCatalog("it");

describe("fermata del giorno", () => {
  it("è la stessa per tutto il giorno, a qualunque ora", () => {
    const morning = dailyStop(scenarios, new Date(2026, 9, 3, 0, 5));
    const night = dailyStop(scenarios, new Date(2026, 9, 3, 23, 55));
    expect(morning?.id).toBe(night?.id);
  });

  it("cambia ogni giorno e torna uguale dopo un giro completo del catalogo", () => {
    const day = (n: number) => dailyStop(scenarios, new Date(2026, 9, 3 + n))?.id;
    expect(day(1)).not.toBe(day(0));
    expect(day(scenarios.length)).toBe(day(0));
    expect(new Set(Array.from({ length: scenarios.length }, (_, n) => day(n))).size).toBe(
      scenarios.length,
    );
  });

  it("non dipende dall'ordine del catalogo e non esiste senza scenari", () => {
    const d = new Date(2026, 9, 3);
    expect(dailyStop([...scenarios].reverse(), d)?.id).toBe(dailyStop(scenarios, d)?.id);
    expect(dailyStop([], d)).toBeNull();
  });
});
