import { describe, expect, it } from "vitest";
import { hashTarget } from "./hash";

describe("hashTarget", () => {
  it("toglie il cancelletto e decodifica", () => {
    expect(hashTarget("#autore%20uno")).toBe("autore uno");
    expect(hashTarget("")).toBe("");
  });

  it("con una codifica malformata restituisce il testo grezzo", () => {
    expect(hashTarget("#%")).toBe("%");
    expect(hashTarget("#a%E0%A4%A")).toBe("a%E0%A4%A");
  });
});
