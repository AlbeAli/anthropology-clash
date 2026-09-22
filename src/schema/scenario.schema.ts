import { z } from "zod";

export const Lang = z.enum(["it", "en"]);
export const Level = z.enum(["neofita", "studente"]);
export const ConceptId = z.enum(["reciprocita", "parentela", "rituale", "relativismo", "consumo"]);

const Choice = z.object({
  id: z.string().regex(/^[a-d]$/),
  text: z.string().min(1).max(200),
});

const Deepen = z.object({
  ref: z.string().min(1).max(200),
  why: z.string().min(1).max(300),
  access: z.enum(["PD", "PD (fr)", "OA", "NON-OA", "verificare"]),
  url: z.url().optional(),
});

const LevelContent = z
  .object({
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

export const Scenario = z.object({
  id: z.string().regex(/^scenario_\d{3}$/),
  lang: Lang,
  title: z.string().min(1).max(80),
  concept: ConceptId,
  concept_label: z.string().min(1),
  levels: z.object({
    neofita: LevelContent,
    studente: LevelContent,
  }),
});

export const Concept = z.object({
  id: ConceptId,
  lang: Lang,
  label: z.string(),
  definition: z.string().max(600),
});

export type Lang = z.infer<typeof Lang>;
export type Level = z.infer<typeof Level>;
export type ConceptId = z.infer<typeof ConceptId>;
export type Scenario = z.infer<typeof Scenario>;
export type Concept = z.infer<typeof Concept>;
