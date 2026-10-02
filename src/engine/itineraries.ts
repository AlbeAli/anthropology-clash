import type { Itinerary, Lang } from "../schema/scenario.schema";
import { getEntry } from "./content";

export const MAX_STOPS = 12;

const itineraryFiles = import.meta.glob<Itinerary>("../content/*/itineraries/*.json", {
  eager: true,
  import: "default",
});

export type Trip = {
  id?: string;
  title?: string;
  description?: string;
  stops: string[];
  search: string;
  href: string;
};

export function getItineraries(lang: Lang): Itinerary[] {
  return Object.values(itineraryFiles)
    .filter((i) => i.lang === lang)
    .sort((a, b) => a.title.localeCompare(b.title, lang));
}

export function getItinerary(lang: Lang, id: string): Itinerary | undefined {
  const it = itineraryFiles[`../content/${lang}/itineraries/${id}.json`];
  return it?.lang === lang ? it : undefined;
}

export function encodeStops(ids: string[]): string {
  return ids.map((id) => String(Number(id.slice("scenario_".length)))).join("-");
}

export function decodeStops(
  lang: Lang,
  param: string | null,
): { stops: string[]; dropped: number } {
  const tokens = (param ?? "").split("-").filter(Boolean);
  const stops: string[] = [];
  for (const token of tokens) {
    if (!/^\d{1,3}$/.test(token) || stops.length >= MAX_STOPS) continue;
    const id = `scenario_${token.padStart(3, "0")}`;
    if (getEntry(lang, id) && !stops.includes(id)) stops.push(id);
  }
  return { stops, dropped: tokens.length - stops.length };
}

export function curatedTrip(lang: Lang, id: string): Trip | undefined {
  const it = getItinerary(lang, id);
  if (!it) return undefined;
  return {
    id: it.id,
    title: it.title,
    description: it.description,
    stops: it.stops,
    search: `?percorso=${it.id}`,
    href: `/percorso/${it.id}`,
  };
}

export function customTrip(stops: string[]): Trip | undefined {
  if (stops.length < 2) return undefined;
  const search = `?f=${encodeStops(stops)}`;
  return { stops, search, href: `/percorso${search}` };
}

export function tripFromSearch(lang: Lang, params: URLSearchParams): Trip | undefined {
  const id = params.get("percorso");
  if (id) return curatedTrip(lang, id);
  return customTrip(decodeStops(lang, params.get("f")).stops);
}

export function nextInTrip(trip: Trip, id: string): string | undefined {
  const idx = trip.stops.indexOf(id);
  return idx < 0 ? undefined : trip.stops[idx + 1];
}
