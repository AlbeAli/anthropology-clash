import { describe, expect, it } from "vitest";
import { buildBibliography, refKey, splitSource } from "./bibliography";

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

  it("raccoglie source e deepen di tutti gli scenari senza duplicati, con link e accesso dai deepen", () => {
    const entries = buildBibliography("it");
    const refs = entries.map((e) => e.ref);
    expect(new Set(refs).size).toBe(refs.length);
    expect(refs.length).toBeGreaterThan(8);
    const miner = entries.find((e) => e.ref.includes("Body Ritual among the Nacirema"));
    expect(miner?.access).toBe("OA");
    expect(miner?.url).toContain("doi.org");
    expect(miner?.scenarios).toEqual(["scenario_003"]);
  });

  it("unisce citazioni della stessa opera scritte in forma diversa", () => {
    expect(refKey("Lee, 'Eating Christmas in the Kalahari', 1969")).toBe(
      refKey("Lee, 'Eating Christmas in the Kalahari', Natural History 78(10), 1969"),
    );
    expect(refKey("Miner, 'Body Ritual among the Nacirema', 1956")).not.toBe(
      refKey("Miner, 'The Folk-Urban Continuum', American Sociological Review 17(5), 1952"),
    );
    const lee = buildBibliography("it").filter((e) => e.ref.startsWith("Lee, 'Eating"));
    expect(lee).toHaveLength(1);
    expect(lee[0].ref).toContain("Natural History");
    expect(lee[0].access).toBe("OA");
  });

  it("è vuota per una lingua senza contenuti", () => {
    expect(buildBibliography("en")).toEqual([]);
  });
});
