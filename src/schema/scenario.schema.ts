import { z } from "zod";

export const Lang = z.enum(["it", "en"]);
export const Level = z.enum(["neofita", "studente"]);
export const ConceptId = z.enum(["reciprocita", "parentela", "rituale", "relativismo", "consumo"]);

const ScenarioId = z.string().regex(/^scenario_\d{3}$/);
const Slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

const DiscussQuestion = z
  .string()
  .min(1)
  .max(300)
  .regex(/\?$/, "una domanda per la discussione finisce con il punto interrogativo");

const Choice = z.object({
  id: z.string().regex(/^[a-d]$/),
  text: z.string().min(1).max(200),
});

const Deepen = z.object({
  ref: z.string().min(1).max(200),
  why: z.string().min(1).max(300),
  access: z.enum(["PD", "PD (fr)", "OA", "NON-OA"]),
  url: z.url().optional(),
});

const LevelContent = z
  .object({
    hook: z.string().min(1).max(400).optional(),
    setup: z.string().min(1).max(1200),
    choices: z.array(Choice).min(2).max(4),
    feedback: z.record(z.string(), z.string().min(1).max(800)),
    source: z.string().min(1),
    deepen: z.array(Deepen).min(1).max(5).optional(),
  })
  .superRefine((lvl, ctx) => {
    const ids = lvl.choices.map((c) => c.id);
    for (const id of ids) {
      if (!(id in lvl.feedback)) {
        ctx.addIssue({ code: "custom", message: `feedback mancante per la scelta ${id}` });
      }
    }
  });

export const Scenario = z
  .object({
    id: ScenarioId,
    lang: Lang,
    title: z.string().min(1).max(80),
    concept: ConceptId,
    concept_label: z.string().min(1),
    also: z.array(ConceptId).min(1).max(2).optional(),
    levels: z.object({
      neofita: LevelContent,
      studente: LevelContent,
    }),
    discuss: z.array(DiscussQuestion).min(2).max(3).optional(),
    glossary: z.array(Slug).min(1).max(8).optional(),
  })
  .superRefine((s, ctx) => {
    if (s.glossary && new Set(s.glossary).size !== s.glossary.length) {
      ctx.addIssue({ code: "custom", path: ["glossary"], message: "glossary senza ripetizioni" });
    }
    if (!s.also) return;
    if (s.also.includes(s.concept)) {
      ctx.addIssue({
        code: "custom",
        path: ["also"],
        message: "also non ripete il concetto principale",
      });
    }
    if (new Set(s.also).size !== s.also.length) {
      ctx.addIssue({ code: "custom", path: ["also"], message: "also senza ripetizioni" });
    }
  });

export const Itinerary = z.object({
  id: Slug,
  lang: Lang,
  title: z.string().min(1).max(80),
  description: z.string().min(1).max(400),
  stops: z.array(ScenarioId).min(2).max(12),
});

export const Concept = z.object({
  id: ConceptId,
  lang: Lang,
  label: z.string(),
  definition: z.string().max(600),
});

export const GlossaryKind = z.enum(["popolo", "luogo", "pratica"]);

export const GlossaryEntry = z.object({
  id: Slug,
  lang: Lang,
  term: z.string().min(1).max(60),
  kind: GlossaryKind,
  forms: z.array(z.string().min(1).max(60)).min(1).max(6).optional(),
  text: z.string().min(1).max(600),
  source: z.array(z.string().min(1).max(300)).min(1).max(4),
});

const Year = z.number().int().min(1500).max(2100);

export const Author = z
  .object({
    id: Slug,
    lang: Lang,
    name: z.string().min(1).max(80),
    surname: z.string().min(1).max(40),
    born: Year,
    died: Year.optional(),
    school: Slug,
    text: z.string().min(1).max(600),
    source: z.array(z.string().min(1).max(300)).min(1).max(4),
  })
  .refine((a) => a.died === undefined || a.died > a.born, {
    path: ["died"],
    message: "died viene dopo born",
  });

export const AuthorsFile = z.object({
  schools: z.array(z.object({ id: Slug, label: z.string().min(1).max(60) })).min(1),
  authors: z.array(Author),
});

export type Lang = z.infer<typeof Lang>;
export type Level = z.infer<typeof Level>;
export type ConceptId = z.infer<typeof ConceptId>;
export type Scenario = z.infer<typeof Scenario>;
export type Concept = z.infer<typeof Concept>;
export type Itinerary = z.infer<typeof Itinerary>;
export type GlossaryKind = z.infer<typeof GlossaryKind>;
export type GlossaryEntry = z.infer<typeof GlossaryEntry>;
export type Author = z.infer<typeof Author>;
export type AuthorsFile = z.infer<typeof AuthorsFile>;
