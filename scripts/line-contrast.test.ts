import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { lineInk } from "../src/engine/lines";
import type { ConceptId } from "../src/schema/scenario.schema";

const css = readFileSync(fileURLToPath(new URL("../src/index.css", import.meta.url)), "utf8");

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

describe("colori di linea", () => {
  it("le lettere sul colore di linea hanno contrasto AA (4,5:1)", () => {
    const ids: ConceptId[] = ["reciprocita", "parentela", "rituale", "relativismo", "consumo"];
    for (const id of ids) {
      const color = css.match(new RegExp(`--l-${id}: (#[0-9a-f]{6});`))?.[1];
      expect(color, id).toBeDefined();
      expect(contrast(color!, lineInk(id)), id).toBeGreaterThanOrEqual(4.5);
    }
  });
});
