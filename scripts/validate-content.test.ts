import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { validateAll } from "./validate-content";
import scenario001 from "../src/content/it/scenarios/scenario_001.json";
import concepts from "../src/content/it/concepts.json";

const REAL_CONTENT = fileURLToPath(new URL("../src/content", import.meta.url));

function fixture(
  scenario: object,
  fileName = "scenario_001.json",
  itineraries: Record<string, object> = {},
) {
  const root = mkdtempSync(join(tmpdir(), "ac-content-"));
  mkdirSync(join(root, "it", "scenarios"), { recursive: true });
  writeFileSync(join(root, "it", "concepts.json"), JSON.stringify(concepts));
  writeFileSync(join(root, "it", "scenarios", fileName), JSON.stringify(scenario));
  if (Object.keys(itineraries).length > 0) {
    mkdirSync(join(root, "it", "itineraries"));
    for (const [name, it] of Object.entries(itineraries)) {
      writeFileSync(join(root, "it", "itineraries", name), JSON.stringify(it));
    }
  }
  return root;
}

const scenario002 = { ...structuredClone(scenario001), id: "scenario_002" };

function twoScenarios(itineraries: Record<string, object>) {
  const root = fixture(scenario001, "scenario_001.json", itineraries);
  writeFileSync(join(root, "it", "scenarios", "scenario_002.json"), JSON.stringify(scenario002));
  return root;
}

const itinerary = {
  id: "dono-e-debito",
  lang: "it",
  title: "Dono e debito",
  description: "Due fermate sul dono.",
  stops: ["scenario_001", "scenario_002"],
};

describe("validate-content: itinerari", () => {
  it("accetta un itinerario con fermate esistenti", () => {
    const { issues, itineraries } = validateAll(twoScenarios({ "dono-e-debito.json": itinerary }));
    expect(issues).toEqual([]);
    expect(itineraries).toBe(1);
  });

  it("segnala fermate inesistenti, ripetute e nome file diverso dall'id", () => {
    const broken = { ...itinerary, stops: ["scenario_001", "scenario_001", "scenario_099"] };
    const messages = validateAll(twoScenarios({ "altro.json": broken })).issues.map(
      (i) => i.message,
    );
    expect(messages).toContainEqual(expect.stringContaining("scenario_099"));
    expect(messages).toContainEqual(expect.stringContaining("ripetuta"));
    expect(messages).toContainEqual(expect.stringContaining("nome file"));
  });
});

describe("validate-content", () => {
  it("passa sui contenuti del repo", () => {
    const { issues, count } = validateAll(REAL_CONTENT);
    expect(issues).toEqual([]);
    expect(count).toBeGreaterThanOrEqual(3);
  });

  it("segnala nome file diverso da id", () => {
    const { issues } = validateAll(fixture(scenario001, "scenario_009.json"));
    expect(issues.map((i) => i.message)).toContainEqual(expect.stringContaining("nome file"));
  });

  it("segnala deepen mancante e fonte senza anno nel livello studente", () => {
    const broken = structuredClone(scenario001);
    const studente = broken.levels.studente as { deepen?: unknown; source: string };
    delete studente.deepen;
    studente.source = "Malinowski";
    const messages = validateAll(fixture(broken)).issues.map((i) => i.message);
    expect(messages).toContainEqual(expect.stringContaining("deepen"));
    expect(messages).toContainEqual(expect.stringContaining("autore e anno"));
  });
});

describe("validate-content: domande per la discussione", () => {
  it("segnala uno scenario senza discuss", () => {
    const broken: { discuss?: unknown } = structuredClone(scenario001);
    delete broken.discuss;
    const messages = validateAll(fixture(broken)).issues.map((i) => i.message);
    expect(messages).toContainEqual(expect.stringContaining("discuss è obbligatorio"));
  });
});

describe("validate-content: aggancio contemporaneo", () => {
  it("segnala un hook presente in un solo livello", () => {
    const broken = structuredClone(scenario001);
    (broken.levels.neofita as { hook?: string }).hook = "Oggi, in una chat di gruppo.";
    delete (broken.levels.studente as { hook?: string }).hook;
    const messages = validateAll(fixture(broken)).issues.map((i) => i.message);
    expect(messages).toContainEqual(expect.stringContaining("hook"));
  });

  it("accetta un hook presente in entrambi i livelli", () => {
    const ok = structuredClone(scenario001);
    (ok.levels.neofita as { hook?: string }).hook = "Oggi, in una chat di gruppo.";
    (ok.levels.studente as { hook?: string }).hook = "Oggi, in una chat di gruppo.";
    expect(validateAll(fixture(ok)).issues).toEqual([]);
  });
});

describe("validate-content: vincoli sui livelli", () => {
  it("segnala feedback senza scelta corrispondente e numero scelte fuori regola", () => {
    const broken = structuredClone(scenario001);
    (broken.levels.neofita.feedback as Record<string, string>).c = "orfano";
    broken.levels.studente.choices = broken.levels.studente.choices.slice(0, 2);
    const messages = validateAll(fixture(broken)).issues.map((i) => i.message);
    expect(messages).toContainEqual(expect.stringContaining("feedback.c"));
    expect(messages).toContainEqual(expect.stringContaining("3-4 scelte"));
  });
});
