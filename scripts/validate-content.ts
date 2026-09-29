import { readdirSync, readFileSync, existsSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Concept, Itinerary, Lang, Level, Scenario } from "../src/schema/scenario.schema";

const CONTENT_DIR = fileURLToPath(new URL("../src/content", import.meta.url));
const STUDENTE_SOURCE = /\p{Lu}\p{L}+.*\b(1[5-9]|20)\d{2}\b/u;

type Issue = { file: string; message: string };

function formatZodIssues(prefix: string, issues: { path: PropertyKey[]; message: string }[]) {
  return issues.map((i) => ({
    file: prefix,
    message: `${i.path.map(String).join(".") || "(root)"}: ${i.message}`,
  }));
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

function jsonFiles(dir: string): string[] {
  return existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => f.endsWith(".json"))
        .sort()
    : [];
}

function validateItineraries(lang: Lang, dir: string, scenarioIds: Set<string>) {
  const issues: Issue[] = [];
  const files = jsonFiles(join(dir, "itineraries"));
  const seenIds = new Set<string>();

  for (const file of files) {
    const label = `${lang}/itineraries/${file}`;
    const parsed = Itinerary.safeParse(readJson(join(dir, "itineraries", file)));
    if (!parsed.success) {
      issues.push(...formatZodIssues(label, parsed.error.issues));
      continue;
    }
    const it = parsed.data;
    if (basename(file, ".json") !== it.id) {
      issues.push({ file: label, message: `nome file diverso dall'id "${it.id}"` });
    }
    if (it.lang !== lang) {
      issues.push({ file: label, message: `lang "${it.lang}" diverso dalla cartella "${lang}"` });
    }
    if (seenIds.has(it.id)) {
      issues.push({ file: label, message: `id duplicato "${it.id}"` });
    }
    seenIds.add(it.id);
    if (new Set(it.stops).size !== it.stops.length) {
      issues.push({ file: label, message: "stops: fermata ripetuta" });
    }
    for (const stop of it.stops) {
      if (!scenarioIds.has(stop)) {
        issues.push({ file: label, message: `stops: "${stop}" non esiste in ${lang}/scenarios` });
      }
    }
  }

  return { issues, count: files.length };
}

export function validateLang(
  lang: Lang,
  dir: string,
): { issues: Issue[]; count: number; itineraries: number } {
  const issues: Issue[] = [];
  const conceptsPath = join(dir, "concepts.json");
  const conceptIds = new Set<string>();

  if (existsSync(conceptsPath)) {
    const parsed = Concept.array().safeParse(readJson(conceptsPath));
    if (!parsed.success) {
      issues.push(...formatZodIssues(`${lang}/concepts.json`, parsed.error.issues));
    } else {
      for (const c of parsed.data) {
        if (c.lang !== lang) {
          issues.push({
            file: `${lang}/concepts.json`,
            message: `concetto ${c.id}: lang "${c.lang}" diverso dalla cartella "${lang}"`,
          });
        }
        conceptIds.add(c.id);
      }
    }
  } else {
    issues.push({ file: `${lang}/concepts.json`, message: "file mancante" });
  }

  const scenariosDir = join(dir, "scenarios");
  const files = jsonFiles(scenariosDir);
  const seenIds = new Set<string>();

  for (const file of files) {
    const label = `${lang}/scenarios/${file}`;
    const parsed = Scenario.safeParse(readJson(join(scenariosDir, file)));
    if (!parsed.success) {
      issues.push(...formatZodIssues(label, parsed.error.issues));
      continue;
    }
    const s = parsed.data;
    if (basename(file, ".json") !== s.id) {
      issues.push({ file: label, message: `nome file diverso dall'id "${s.id}"` });
    }
    if (s.lang !== lang) {
      issues.push({ file: label, message: `lang "${s.lang}" diverso dalla cartella "${lang}"` });
    }
    if (seenIds.has(s.id)) {
      issues.push({ file: label, message: `id duplicato "${s.id}"` });
    }
    seenIds.add(s.id);
    if (!conceptIds.has(s.concept)) {
      issues.push({ file: label, message: `concept "${s.concept}" assente in concepts.json` });
    }
    for (const level of Level.options) {
      const lvl = s.levels[level];
      const choiceIds = lvl.choices.map((c) => c.id);
      if (new Set(choiceIds).size !== choiceIds.length) {
        issues.push({ file: label, message: `levels.${level}.choices: id duplicati` });
      }
      for (const key of Object.keys(lvl.feedback)) {
        if (!choiceIds.includes(key)) {
          issues.push({
            file: label,
            message: `levels.${level}.feedback.${key}: nessuna scelta corrispondente`,
          });
        }
      }
    }
    if (Boolean(s.levels.neofita.hook) !== Boolean(s.levels.studente.hook)) {
      issues.push({
        file: label,
        message: "hook: presente in un livello e assente nell'altro; o in entrambi o in nessuno",
      });
    }
    if (s.levels.neofita.choices.length !== 2) {
      issues.push({
        file: label,
        message: "levels.neofita.choices: il livello neofita ha esattamente 2 scelte",
      });
    }
    if (s.levels.studente.choices.length < 3) {
      issues.push({
        file: label,
        message: "levels.studente.choices: il livello studente ha 3-4 scelte",
      });
    }
    if (!STUDENTE_SOURCE.test(s.levels.studente.source)) {
      issues.push({
        file: label,
        message: "levels.studente.source deve contenere almeno autore e anno",
      });
    }
    if (!s.levels.studente.deepen) {
      issues.push({ file: label, message: "levels.studente.deepen è obbligatorio" });
    }
  }

  const itineraries = validateItineraries(lang, dir, seenIds);
  issues.push(...itineraries.issues);

  return { issues, count: files.length, itineraries: itineraries.count };
}

export function validateAll(contentDir: string) {
  const issues: Issue[] = [];
  let count = 0;
  let itineraries = 0;
  for (const lang of Lang.options) {
    const dir = join(contentDir, lang);
    if (!existsSync(dir)) continue;
    const r = validateLang(lang, dir);
    issues.push(...r.issues);
    count += r.count;
    itineraries += r.itineraries;
  }
  return { issues, count, itineraries };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { issues, count, itineraries } = validateAll(CONTENT_DIR);
  const summary = `${count} scenari, ${itineraries} ${itineraries === 1 ? "itinerario" : "itinerari"}`;
  if (issues.length > 0) {
    for (const i of issues) console.error(`✗ ${i.file}: ${i.message}`);
    console.error(`\n${issues.length} problemi (${summary})`);
    process.exit(1);
  }
  console.log(`✓ contenuti validi: ${summary}`);
}
