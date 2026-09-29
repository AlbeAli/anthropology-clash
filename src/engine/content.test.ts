import { describe, expect, it } from "vitest";
import { getCatalog, getConcepts, getEntry, loadScenario, loadScenarios } from "./content";

describe("content loader", () => {
  it("il catalogo ha gli scenari italiani in ordine di id, senza il testo", () => {
    const catalog = getCatalog("it");
    const ids = catalog.map((s) => s.id);
    expect(ids).toEqual([...ids].sort());
    expect(ids.length).toBeGreaterThanOrEqual(3);
    expect(Object.keys(catalog[0]).sort()).toEqual(
      ["concept", "concept_label", "hook", "id", "lang", "title"].sort(),
    );
  });

  it("trova scenario_001 nel catalogo e i 5 concetti", () => {
    expect(getEntry("it", "scenario_001")?.concept).toBe("reciprocita");
    expect(
      getConcepts("it")
        .map((c) => c.id)
        .sort(),
    ).toEqual(["consumo", "parentela", "reciprocita", "relativismo", "rituale"]);
  });

  it("carica il testo completo di uno scenario coerente con il catalogo", async () => {
    const entry = getEntry("it", "scenario_002");
    const scenario = await loadScenario("it", "scenario_002");
    expect(scenario?.title).toBe(entry?.title);
    expect(scenario?.levels.neofita.hook).toBe(entry?.hook);
    expect(scenario?.levels.studente.choices.length).toBeGreaterThanOrEqual(3);
  });

  it("carica tutti gli scenari nell'ordine del catalogo", async () => {
    const all = await loadScenarios("it");
    expect(all.map((s) => s.id)).toEqual(getCatalog("it").map((s) => s.id));
  });

  it("restituisce vuoto per una lingua senza contenuti o un id sconosciuto", async () => {
    expect(getCatalog("en")).toEqual([]);
    expect(getEntry("en", "scenario_001")).toBeUndefined();
    expect(getConcepts("en")).toEqual([]);
    expect(await loadScenario("it", "scenario_999")).toBeUndefined();
    expect(await loadScenarios("en")).toEqual([]);
  });
});
