import { describe, expect, it } from "vitest";
import { nextScenarioId } from "./sequence";
import { getScenarios } from "./content";

describe("nextScenarioId", () => {
  it("segue l'ordine degli id", () => {
    expect(nextScenarioId("it", "scenario_001")).toBe("scenario_002");
    expect(nextScenarioId("it", "scenario_002")).toBe("scenario_003");
  });

  it("restituisce undefined dopo l'ultimo scenario", () => {
    const ids = getScenarios("it").map((s) => s.id);
    expect(nextScenarioId("it", ids[ids.length - 1])).toBeUndefined();
  });

  it("restituisce undefined per id sconosciuto o lingua senza contenuti", () => {
    expect(nextScenarioId("it", "scenario_999")).toBeUndefined();
    expect(nextScenarioId("en", "scenario_001")).toBeUndefined();
  });
});
