import { describe, expect, it } from "vitest";
import { Level } from "../schema/scenario.schema";
import { LEVELS } from "./levels";

describe("livelli", () => {
  it("coincidono con l'enum dello schema", () => {
    expect([...LEVELS]).toEqual(Level.options);
  });
});
