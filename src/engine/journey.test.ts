import { describe, expect, it } from "vitest";
import { getCatalog } from "./content";
import { linesTouched, lineStamps, visitsInOrder } from "./journey";
import type { Completion } from "./storage";

const scenarios = getCatalog("it");

describe("il tuo viaggio", () => {
  it("ordina le fermate per data di visita e poi per id", () => {
    const visits = visitsInOrder(
      {
        scenario_010: { level: "neofita", choice: "a", at: "2026-09-27" },
        scenario_002: { level: "studente", choice: "b", at: "2026-09-28" },
        scenario_001: { level: "neofita", choice: "a", at: "2026-09-27" },
      },
      scenarios,
    );
    expect(visits.map((v) => v.scenario.id)).toEqual([
      "scenario_001",
      "scenario_010",
      "scenario_002",
    ]);
  });

  it("ignora gli id che non corrispondono a uno scenario", () => {
    expect(
      visitsInOrder(
        { scenario_999: { level: "neofita", choice: "a", at: "2026-09-27" } },
        scenarios,
      ),
    ).toEqual([]);
  });

  it("elenca le linee toccate una volta sola", () => {
    const visits = visitsInOrder(
      {
        scenario_001: { level: "neofita", choice: "a", at: "2026-09-27" },
        scenario_002: { level: "neofita", choice: "a", at: "2026-09-27" },
        scenario_011: { level: "neofita", choice: "a", at: "2026-09-27" },
      },
      scenarios,
    );
    expect(linesTouched(visits)).toEqual(["reciprocita", "rituale"]);
  });

  describe("timbri", () => {
    const order = ["reciprocita", "parentela", "rituale", "relativismo", "consumo"] as const;
    const done = (ids: string[], at: string) =>
      Object.fromEntries(
        ids.map((id) => [id, { level: "neofita", choice: "a", at } satisfies Completion]),
      );
    const ofLine = (c: string) => scenarios.filter((s) => s.concept === c).map((s) => s.id);

    it("dà un timbro di passaggio con la data della prima fermata", () => {
      const [a, b] = ofLine("rituale");
      const stamps = lineStamps(
        visitsInOrder({ ...done([b], "2026-10-05"), ...done([a], "2026-10-03") }, scenarios),
        scenarios,
        [...order],
      );
      const r = stamps.find((x) => x.concept === "rituale")!;
      expect(r).toMatchObject({
        seen: 2,
        first: "2026-10-03",
        last: "2026-10-05",
        terminus: false,
      });
      expect(stamps.find((x) => x.concept === "consumo")).toMatchObject({
        seen: 0,
        first: null,
        terminus: false,
      });
    });

    it("segna il capolinea solo con tutte le fermate della linea, a qualunque livello", () => {
      const ids = ofLine("consumo");
      const partial = lineStamps(
        visitsInOrder(done(ids.slice(1), "2026-10-03"), scenarios),
        scenarios,
        [...order],
      );
      expect(partial.find((x) => x.concept === "consumo")!.terminus).toBe(false);
      const all = lineStamps(
        visitsInOrder(
          {
            ...done(ids.slice(1), "2026-10-03"),
            [ids[0]]: { level: "studente", choice: "b", at: "2026-10-09" },
          },
          scenarios,
        ),
        scenarios,
        [...order],
      );
      expect(all.find((x) => x.concept === "consumo")).toMatchObject({
        seen: ids.length,
        total: ids.length,
        last: "2026-10-09",
        terminus: true,
      });
    });

    it("segue l'ordine dei concetti e non timbra le linee senza fermate visitate", () => {
      const stamps = lineStamps([], scenarios, [...order]);
      expect(stamps.map((x) => x.concept)).toEqual([...order]);
      expect(stamps.every((x) => x.seen === 0 && !x.terminus)).toBe(true);
    });
  });
});
