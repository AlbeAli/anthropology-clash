import { describe, expect, it } from "vitest";
import { aulaSteps, stepIndex } from "./aula";
import { Scenario } from "../schema/scenario.schema";
import raw from "../content/it/scenarios/scenario_001.json";

const scenario = Scenario.parse({ ...raw, discuss: undefined });

describe("passi della modalità aula", () => {
  it("vanno dal titolo alla fonte svelando un'uscita per passo", () => {
    const steps = aulaSteps(scenario, "neofita");
    const choices = scenario.levels.neofita.choices;
    expect(steps.map((s) => s.kind)).toEqual([
      "title",
      "setup",
      "choices",
      ...choices.map(() => "exit"),
      "source",
    ]);
    expect(steps.filter((s) => s.kind === "exit")).toEqual(
      choices.map((c, i) => ({ kind: "exit", choiceId: c.id, n: i + 1 })),
    );
  });

  it("il livello studente ha più uscite, e le domande chiudono se ci sono", () => {
    const withDiscuss = { ...scenario, discuss: ["Chi dà?", "Chi riceve?"] };
    const steps = aulaSteps(withDiscuss, "studente");
    expect(steps.filter((s) => s.kind === "exit")).toHaveLength(
      scenario.levels.studente.choices.length,
    );
    expect(steps.at(-1)).toEqual({ kind: "discuss" });
  });

  it("il passo nell'indirizzo parte da 1 e resta nei limiti", () => {
    expect(stepIndex(null, 6)).toBe(0);
    expect(stepIndex("1", 6)).toBe(0);
    expect(stepIndex("4", 6)).toBe(3);
    expect(stepIndex("99", 6)).toBe(5);
    expect(stepIndex("0", 6)).toBe(0);
    expect(stepIndex("2.5", 6)).toBe(0);
    expect(stepIndex("x", 6)).toBe(0);
  });
});
