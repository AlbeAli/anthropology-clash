import type { Level, Scenario } from "../schema/scenario.schema";

export type AulaStep =
  | { kind: "title" }
  | { kind: "setup" }
  | { kind: "choices" }
  | { kind: "exit"; choiceId: string; n: number }
  | { kind: "source" }
  | { kind: "discuss" };

export function aulaSteps(scenario: Scenario, level: Level): AulaStep[] {
  return [
    { kind: "title" },
    { kind: "setup" },
    { kind: "choices" },
    ...scenario.levels[level].choices.map((c, i) => ({
      kind: "exit" as const,
      choiceId: c.id,
      n: i + 1,
    })),
    { kind: "source" },
    ...(scenario.discuss ? [{ kind: "discuss" as const }] : []),
  ];
}

export function stepIndex(param: string | null, total: number): number {
  const n = Number(param);
  if (!Number.isInteger(n) || n < 1) return 0;
  return Math.min(n, total) - 1;
}
