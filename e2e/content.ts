import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

type Level = {
  setup: string;
  choices: { id: string; text: string }[];
  feedback: Record<string, string>;
  source: string;
  deepen?: unknown[];
};
export type ScenarioFile = {
  id: string;
  title: string;
  concept: string;
  levels: { neofita: Level; studente: Level };
  discuss?: string[];
  glossary?: string[];
};

const dir = join(process.cwd(), "src/content/it/scenarios");

export const scenarios: ScenarioFile[] = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as ScenarioFile);

export const lineCount = new Set(scenarios.map((s) => s.concept)).size;

export type ItineraryFile = { id: string; title: string; stops: string[] };

const itineraryDir = join(process.cwd(), "src/content/it/itineraries");

export const itineraries: ItineraryFile[] = readdirSync(itineraryDir)
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((f) => JSON.parse(readFileSync(join(itineraryDir, f), "utf8")) as ItineraryFile);

export type GlossaryFile = { id: string; term: string; text: string; source: string[] };

export const glossary = JSON.parse(
  readFileSync(join(process.cwd(), "src/content/it/glossary.json"), "utf8"),
) as GlossaryFile[];

export type AuthorFile = { id: string; name: string; surname: string; born: number; text: string };

export const authors = (
  JSON.parse(readFileSync(join(process.cwd(), "src/content/it/authors.json"), "utf8")) as {
    authors: AuthorFile[];
  }
).authors;
