import { describe, expect, it } from "vitest";
import { buildAuthors, citedWorks, refNames } from "./authors";

const scenarios = [
  {
    id: "scenario_001",
    source:
      "Malinowski, Argonauts of the Western Pacific, 1922, cap. III (Project Gutenberg #55822); Mauss, Essai sur le don, 1925",
  },
  {
    id: "scenario_007",
    source:
      "Malinowski, Argonauts of the Western Pacific, 1922, cap. II §VI; Malinowski, Crime and Custom in Savage Society, 1926, Parte I",
  },
  { id: "scenario_008", source: "Bohannan & Bohannan, The Tiv of Central Nigeria, 1953" },
];

describe("autori", () => {
  it("legge i nomi prima della prima virgola, anche per le opere a più mani", () => {
    expect(refNames("Mauss, Essai sur le don, 1925")).toEqual(["Mauss"]);
    expect(refNames("Bohannan & Bohannan, The Tiv, 1953")).toEqual(["Bohannan", "Bohannan"]);
    expect(refNames("van Gennep, Les rites de passage, 1909")).toEqual(["van Gennep"]);
  });

  it("raccoglie le opere citate senza capitoli, una volta sola, in ordine di anno", () => {
    const works = citedWorks("Malinowski", scenarios);
    expect(works).toEqual([
      {
        ref: "Malinowski, Argonauts of the Western Pacific, 1922",
        year: 1922,
        scenarios: ["scenario_001", "scenario_007"],
      },
      {
        ref: "Malinowski, Crime and Custom in Savage Society, 1926",
        year: 1926,
        scenarios: ["scenario_007"],
      },
    ]);
  });

  it("unisce a ogni autore le opere e gli scenari in cui è citato", () => {
    const author = {
      id: "mauss",
      lang: "it" as const,
      name: "Marcel Mauss",
      surname: "Mauss",
      born: 1872,
      died: 1950,
      school: "durkheim",
      text: "Nota.",
      source: ["Fonte"],
    };
    const data = buildAuthors(
      { schools: [{ id: "durkheim", label: "Scuola" }], authors: [author] },
      scenarios,
    );
    expect(data.authors[0].scenarios).toEqual(["scenario_001"]);
    expect(data.authors[0].works.map((w) => w.year)).toEqual([1925]);
  });
});
