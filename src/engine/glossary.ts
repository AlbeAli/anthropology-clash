import type { GlossaryEntry } from "../schema/scenario.schema";

export type Segment = string | { id: string; text: string };

type Hit = { id: string; start: number; end: number };

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function firstHit(text: string, entry: GlossaryEntry): Hit | undefined {
  let best: Hit | undefined;
  for (const form of entry.forms ?? [entry.term]) {
    const match = new RegExp(`(?<![\\p{L}\\p{N}])${escape(form)}(?![\\p{L}\\p{N}])`, "u").exec(
      text,
    );
    if (!match) continue;
    const hit = { id: entry.id, start: match.index, end: match.index + form.length };
    if (!best || hit.start < best.start || (hit.start === best.start && hit.end > best.end)) {
      best = hit;
    }
  }
  return best;
}

export function markTerms(text: string, entries: GlossaryEntry[]): Segment[] {
  const hits = entries
    .map((e) => firstHit(text, e))
    .filter((h): h is Hit => h !== undefined)
    .sort((a, b) => a.start - b.start || b.end - a.end);
  const segments: Segment[] = [];
  let pos = 0;
  for (const h of hits) {
    if (h.start < pos) continue;
    if (h.start > pos) segments.push(text.slice(pos, h.start));
    segments.push({ id: h.id, text: text.slice(h.start, h.end) });
    pos = h.end;
  }
  if (pos < text.length) segments.push(text.slice(pos));
  return segments;
}

export function markedIds(text: string, entries: GlossaryEntry[]): Set<string> {
  return new Set(markTerms(text, entries).flatMap((s) => (typeof s === "string" ? [] : [s.id])));
}
