import { describe, expect, it } from "vitest";
import { lineColor, lineInk, stopNumber } from "./lines";

describe("linee della metro", () => {
  it("collega ogni concetto al suo colore di linea", () => {
    expect(lineColor("rituale")).toBe("var(--l-rituale)");
  });

  it("usa l'inchiostro scuro solo sulla linea gialla", () => {
    expect(lineInk("relativismo")).toBe("#1a1a1a");
    expect(lineInk("reciprocita")).toBe("#ffffff");
  });

  it("ricava il numero di fermata dall'id dello scenario", () => {
    expect(stopNumber("scenario_011")).toBe(11);
    expect(stopNumber("scenario_020")).toBe(20);
  });
});
