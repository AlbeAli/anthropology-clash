import { describe, expect, it } from "vitest";
import {
  MAX_STOPS,
  curatedTrip,
  customTrip,
  decodeStops,
  encodeStops,
  getItineraries,
  nextInTrip,
  tripFromSearch,
} from "./itineraries";
import { getCatalog, getEntry } from "./content";

describe("itinerari curati", () => {
  it("hanno fermate che esistono nel catalogo", () => {
    const list = getItineraries("it");
    expect(list.length).toBeGreaterThanOrEqual(1);
    for (const it of list) for (const s of it.stops) expect(getEntry("it", s)).toBeDefined();
  });

  it("diventano un viaggio con link alla pagina e alle fermate", () => {
    const first = getItineraries("it")[0];
    const trip = curatedTrip("it", first.id);
    expect(trip?.href).toBe(`/percorso/${first.id}`);
    expect(trip?.search).toBe(`?percorso=${first.id}`);
    expect(curatedTrip("it", "non-esiste")).toBeUndefined();
  });
});

describe("itinerari personalizzati", () => {
  it("codificano le fermate in un link corto e le ritrovano nello stesso ordine", () => {
    const ids = ["scenario_011", "scenario_003", "scenario_007"];
    expect(encodeStops(ids)).toBe("11-3-7");
    expect(decodeStops("it", "11-3-7")).toEqual({ stops: ids, dropped: 0 });
  });

  it("scartano fermate inesistenti, malformate e ripetute, contandole", () => {
    expect(decodeStops("it", "3-999-x-3-003-7")).toEqual({
      stops: ["scenario_003", "scenario_007"],
      dropped: 4,
    });
    expect(decodeStops("it", null)).toEqual({ stops: [], dropped: 0 });
  });

  it(`si fermano a ${MAX_STOPS} fermate`, () => {
    const all = getCatalog("it").map((s) => s.id);
    const { stops } = decodeStops("it", encodeStops(all));
    expect(stops).toHaveLength(Math.min(MAX_STOPS, all.length));
  });

  it("servono almeno due fermate", () => {
    expect(customTrip(["scenario_001"])).toBeUndefined();
    expect(customTrip(["scenario_001", "scenario_002"])?.href).toBe("/percorso?f=1-2");
  });
});

describe("viaggio dall'indirizzo", () => {
  it("riconosce un itinerario curato, uno personalizzato o nessuno", () => {
    const first = getItineraries("it")[0];
    expect(tripFromSearch("it", new URLSearchParams(`percorso=${first.id}`))?.id).toBe(first.id);
    expect(tripFromSearch("it", new URLSearchParams("f=4-2"))?.stops).toEqual([
      "scenario_004",
      "scenario_002",
    ]);
    expect(tripFromSearch("it", new URLSearchParams("f=4"))).toBeUndefined();
    expect(tripFromSearch("it", new URLSearchParams(""))).toBeUndefined();
  });

  it("indica la fermata successiva e nessuna dopo l'ultima", () => {
    const trip = customTrip(["scenario_004", "scenario_002"])!;
    expect(nextInTrip(trip, "scenario_004")).toBe("scenario_002");
    expect(nextInTrip(trip, "scenario_002")).toBeUndefined();
    expect(nextInTrip(trip, "scenario_009")).toBeUndefined();
  });
});
