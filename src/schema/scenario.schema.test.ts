import { describe, expect, it } from "vitest";
import { Itinerary, Scenario } from "./scenario.schema";
import scenario001 from "../content/it/scenarios/scenario_001.json";

describe("Scenario schema: domande per la discussione", () => {
  const withDiscuss = (discuss: string[]) => ({ ...structuredClone(scenario001), discuss });

  it("accetta da 2 a 3 domande", () => {
    expect(Scenario.safeParse(withDiscuss(["Chi dà?", "Chi riceve?"])).success).toBe(true);
    expect(Scenario.safeParse(withDiscuss(["Uno?", "Due?", "Tre?"])).success).toBe(true);
  });

  it("rifiuta una sola domanda, quattro domande e una frase senza punto interrogativo", () => {
    expect(Scenario.safeParse(withDiscuss(["Sola?"])).success).toBe(false);
    expect(Scenario.safeParse(withDiscuss(["1?", "2?", "3?", "4?"])).success).toBe(false);
    expect(Scenario.safeParse(withDiscuss(["Chi dà?", "Il dono obbliga."])).success).toBe(false);
  });
});

describe("Itinerary schema", () => {
  const base = {
    id: "dono-e-debito",
    lang: "it",
    title: "Dono e debito",
    description: "Due fermate sul dono.",
    stops: ["scenario_001", "scenario_004"],
  };

  it("accetta un itinerario ben formato", () => {
    expect(Itinerary.safeParse(base).success).toBe(true);
  });

  it("rifiuta id non in kebab-case, una sola fermata e fermate malformate", () => {
    expect(Itinerary.safeParse({ ...base, id: "Dono_Debito" }).success).toBe(false);
    expect(Itinerary.safeParse({ ...base, stops: ["scenario_001"] }).success).toBe(false);
    expect(Itinerary.safeParse({ ...base, stops: ["scenario_001", "s4"] }).success).toBe(false);
  });
});

describe("Scenario schema", () => {
  it("accetta scenario_001", () => {
    expect(Scenario.safeParse(scenario001).success).toBe(true);
  });

  it("rifiuta una scelta senza feedback", () => {
    const broken = structuredClone(scenario001);
    delete (broken.levels.neofita.feedback as Record<string, string>).b;
    const result = Scenario.safeParse(broken);
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.message)).toContain(
      "feedback mancante per la scelta b",
    );
  });

  it("accetta un hook opzionale e lo rifiuta oltre i 400 caratteri", () => {
    const conHook = structuredClone(scenario001);
    (conHook.levels.neofita as { hook?: string }).hook =
      "Oggi ti arriva un regalo che non puoi ricambiare.";
    expect(Scenario.safeParse(conHook).success).toBe(true);
    (conHook.levels.neofita as { hook?: string }).hook = "a".repeat(401);
    expect(Scenario.safeParse(conHook).success).toBe(false);
  });

  it("rifiuta un concept fuori tassonomia", () => {
    const broken = { ...scenario001, concept: "economia" };
    expect(Scenario.safeParse(broken).success).toBe(false);
  });
});
