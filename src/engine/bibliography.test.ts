import { describe, expect, it } from "vitest";
import type { Lang } from "../schema/scenario.schema";
import { buildBibliography, refKey, splitSource, workOf } from "./bibliography";
import { loadScenarios } from "./content";

const bibliography = async (lang: Lang) => buildBibliography(await loadScenarios(lang), lang);

describe("bibliography", () => {
  it("separa le fonti sul punto e virgola senza spezzare i titoli", () => {
    expect(
      splitSource(
        "Malinowski, Argonauts, 1922, cap. III e XIV (Project Gutenberg #55822); Mauss, Essai sur le don, 1925",
      ),
    ).toEqual([
      "Malinowski, Argonauts, 1922, cap. III e XIV (Project Gutenberg #55822)",
      "Mauss, Essai sur le don, 1925",
    ]);
  });

  it("raccoglie source e deepen di tutti gli scenari senza duplicati, con link e accesso dai deepen", async () => {
    const entries = await bibliography("it");
    const refs = entries.map((e) => e.ref);
    expect(new Set(refs).size).toBe(refs.length);
    expect(refs.length).toBeGreaterThan(8);
    const miner = entries.find((e) => e.ref.includes("Body Ritual among the Nacirema"));
    expect(miner?.access).toBe("OA");
    expect(miner?.url).toContain("doi.org");
    expect(miner?.scenarios).toEqual(["scenario_003"]);
  });

  it("unisce citazioni della stessa opera scritte in forma diversa", async () => {
    expect(refKey("Lee, 'Eating Christmas in the Kalahari', 1969")).toBe(
      refKey("Lee, 'Eating Christmas in the Kalahari', Natural History 78(10), 1969"),
    );
    expect(refKey("Codere, Fighting with Property, 1950")).toBe(
      refKey(
        "Codere, Fighting with Property: A Study of Kwakiutl Potlatching and Warfare, 1792-1930, 1950",
      ),
    );
    expect(refKey("Miner, 'Body Ritual among the Nacirema', 1956")).not.toBe(
      refKey("Miner, 'The Folk-Urban Continuum', American Sociological Review 17(5), 1952"),
    );
    const lee = (await bibliography("it")).filter((e) => e.ref.startsWith("Lee, 'Eating"));
    expect(lee).toHaveLength(1);
    expect(lee[0].ref).toContain("Natural History");
    expect(lee[0].access).toBe("OA");
  });

  it("mostra l'opera senza capitoli, conservando pagine di articolo e traduzione", async () => {
    expect(workOf("Veblen, The Theory of the Leisure Class, 1899, cap. VII")).toBe(
      "Veblen, The Theory of the Leisure Class, 1899",
    );
    expect(
      workOf("Kroeber, 'On the Principle of Order', American Anthropologist 21, 1919, pp. 235-263"),
    ).toBe("Kroeber, 'On the Principle of Order', American Anthropologist 21, 1919, pp. 235-263");
    expect(
      workOf(
        "Mintz, Sweetness and Power, Viking, 1985, introduzione, cap. 1 «Food, Sociality, and Sugar» (pp. 14, 15, 18) e cap. 5 «Eating and Being» (pp. 192, 196)",
      ),
    ).toBe("Mintz, Sweetness and Power, Viking, 1985");
    expect(
      workOf(
        "Bourdieu, La distinction, 1979, introduzione (pp. 2-3, 6-7, 13), cap. 1 (pp. 35, 39), nella traduzione di Richard Nice, Distinction, Harvard University Press, 1984",
      ),
    ).toBe(
      "Bourdieu, La distinction, 1979, nella traduzione di Richard Nice, Distinction, Harvard University Press, 1984",
    );
    expect(
      workOf(
        "Douglas e Isherwood, The World of Goods, 1979, ristampa 1982, pp. 12, 57, 59 e 141-145",
      ),
    ).toBe("Douglas e Isherwood, The World of Goods, 1979, ristampa 1982");
    expect(workOf("Douglas e Isherwood, The World of Goods, 1979, ristampa 1982, p. 59")).toBe(
      "Douglas e Isherwood, The World of Goods, 1979, ristampa 1982",
    );
    expect(
      workOf(
        "Cohen, Custom and Politics in Urban Africa, 1969, cap. 2, sezioni «Housewives in Seclusion», «Trade from Behind the Purdah» e «Accumulation of Capital», pp. 67-68",
      ),
    ).toBe("Cohen, Custom and Politics in Urban Africa, 1969");
    expect(
      workOf("Radcliffe-Brown, Introduzione a African Systems of Kinship and Marriage, 1950"),
    ).toBe("Radcliffe-Brown, Introduzione a African Systems of Kinship and Marriage, 1950");
    const veblen = (await bibliography("it")).filter((e) => e.ref.startsWith("Veblen"));
    expect(veblen).toHaveLength(1);
    expect(veblen[0].ref).toBe("Veblen, The Theory of the Leisure Class, 1899");
    expect(veblen[0].scenarios).toEqual(
      expect.arrayContaining(["scenario_016", "scenario_017", "scenario_018", "scenario_021"]),
    );
    expect((await bibliography("it")).some((e) => /\bcap\.\s/.test(e.ref))).toBe(false);
  });

  it("è vuota per una lingua senza contenuti", async () => {
    expect(await bibliography("en")).toEqual([]);
  });
});
