import { describe, expect, it } from "vitest";
import { Scenario } from "./scenario.schema";
import scenario001 from "../content/it/scenarios/scenario_001.json";

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
