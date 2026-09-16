import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { validateAll } from "./validate-content";
import scenario001 from "../src/content/it/scenarios/scenario_001.json";
import concepts from "../src/content/it/concepts.json";

const REAL_CONTENT = fileURLToPath(new URL("../src/content", import.meta.url));

function fixture(scenario: object, fileName = "scenario_001.json") {
  const root = mkdtempSync(join(tmpdir(), "ac-content-"));
  mkdirSync(join(root, "it", "scenarios"), { recursive: true });
  writeFileSync(join(root, "it", "concepts.json"), JSON.stringify(concepts));
  writeFileSync(join(root, "it", "scenarios", fileName), JSON.stringify(scenario));
  return root;
}

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
