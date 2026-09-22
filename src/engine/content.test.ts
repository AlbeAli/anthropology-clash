import { describe, expect, it } from "vitest";
import { getConcepts, getScenario, getScenarios } from "./content";

describe("content loader", () => {
  it("carica gli scenari italiani in ordine di id", () => {
    const ids = getScenarios("it").map((s) => s.id);
    expect(ids).toEqual([...ids].sort());
    expect(ids.length).toBeGreaterThanOrEqual(3);
  });

  it("trova scenario_001 e i 4 concetti", () => {
    expect(getScenario("it", "scenario_001")?.concept).toBe("reciprocita");
    expect(
      getConcepts("it")
        .map((c) => c.id)
        .sort(),
    ).toEqual(["consumo", "parentela", "reciprocita", "relativismo", "rituale"]);
  });

  it("restituisce liste vuote per una lingua senza contenuti", () => {
    expect(getScenarios("en")).toEqual([]);
    expect(getScenario("en", "scenario_001")).toBeUndefined();
  });
});
