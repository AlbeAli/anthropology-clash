import { describe, expect, it } from "vitest";
import { getCatalog } from "./content";
import { linesTouched, visitsInOrder } from "./journey";

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
});
