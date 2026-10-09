import { describe, expect, it } from "vitest";
import type { GlossaryEntry } from "../schema/scenario.schema";
import { freshTerms, markedIds, markTerms } from "./glossary";

const entry = (id: string, term: string, forms?: string[]): GlossaryEntry => ({
  id,
  lang: "it",
  term,
  kind: "popolo",
  forms,
  text: "Nota.",
  source: ["Fonte, 2000"],
});

const dayak = entry("dayak", "Dayak");
const ngadju = entry("olo-ngadju", "Olo Ngadju");

describe("markTerms", () => {
  it("segna solo la prima occorrenza di ogni voce e lascia il resto del testo intatto", () => {
    const text = "Tra gli Olo Ngadju, uno dei popoli Dayak. I Dayak e gli Olo Ngadju.";
    const segments = markTerms(text, [dayak, ngadju]);
    expect(segments).toEqual([
      "Tra gli ",
      { id: "olo-ngadju", text: "Olo Ngadju" },
      ", uno dei popoli ",
      { id: "dayak", text: "Dayak" },
      ". I Dayak e gli Olo Ngadju.",
    ]);
    expect(segments.map((s) => (typeof s === "string" ? s : s.text)).join("")).toBe(text);
  });

  it("non segna un termine dentro un'altra parola", () => {
    expect(markTerms("I Dayakesi", [dayak])).toEqual(["I Dayakesi"]);
  });

  it("usa la forma che compare per prima e, a pari posizione, la più lunga", () => {
    const borneo = entry("borneo", "Borneo", ["Borneo", "Borneo sud-orientale"]);
    expect(markTerms("Borneo sud-orientale, Ottocento.", [borneo])).toEqual([
      { id: "borneo", text: "Borneo sud-orientale" },
      ", Ottocento.",
    ]);
  });

  it("tra due voci che iniziano nello stesso punto vince la più lunga, l'altra resta fuori", () => {
    const olo = entry("olo", "Olo");
    expect(markedIds("Gli Olo Ngadju.", [olo, ngadju])).toEqual(new Set(["olo-ngadju"]));
  });

  it("senza voci restituisce il testo intero", () => {
    expect(markTerms("Testo.", [])).toEqual(["Testo."]);
  });
});

describe("freshTerms", () => {
  const kula = entry("kula", "Kula");
  const texts = { a: "Il Kula e i Dayak.", b: "Ancora il Kula.", c: "Niente." };

  it("lascia fuori i termini già segnati nel setup", () => {
    const marks = freshTerms("Nel setup i Dayak.", texts, ["a", "b", "c"], [dayak, kula]);
    expect(marks.get("a")).toEqual([kula]);
  });

  it("segna ogni termine una volta sola, nel primo riscontro in cui compare", () => {
    const marks = freshTerms("Setup.", texts, ["b", "a", "c"], [dayak, kula]);
    expect(marks.get("b")).toEqual([kula]);
    expect(marks.get("a")).toEqual([dayak]);
    expect(marks.get("c")).toEqual([]);
  });

  it("senza voci non segna nulla", () => {
    expect(freshTerms("Setup.", texts, ["a"], []).get("a")).toEqual([]);
  });
});
