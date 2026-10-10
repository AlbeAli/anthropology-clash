import type { AuthorsData } from "../engine/authors";

const PALETTE = ["#00838f", "#a0522d", "#c2185b", "#5d6d7e", "#6b8e23", "#283593", "#7b1fa2"];

export function schoolColor(schools: AuthorsData["schools"], id: string): string {
  return PALETTE[
    Math.max(
      0,
      schools.findIndex((s) => s.id === id),
    ) % PALETTE.length
  ];
}
