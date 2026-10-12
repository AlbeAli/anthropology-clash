import { describe, expect, it } from "vitest";
import type { Concept, ConceptId, Scenario } from "../schema/scenario.schema";
import { buildNetwork, labelPolygon, nearestLine, type Network, type Point } from "./network";

const scenarios = Object.values(
  import.meta.glob<Scenario>("../content/it/scenarios/*.json", { eager: true, import: "default" }),
).sort((a, b) => a.id.localeCompare(b.id));
const concepts = Object.values(
  import.meta.glob<Concept[]>("../content/it/concepts.json", { eager: true, import: "default" }),
)[0];
const order = concepts.map((c) => c.id);
const net = buildNetwork(scenarios, order);
const stations = net.lines.flatMap((l) => l.stations);

const inside = (n: Network, x: number, y: number) =>
  x >= n.box.x && x <= n.box.x + n.box.width && y >= n.box.y && y <= n.box.y + n.box.height;

type Segment = [Point, Point];

const railsOf = (n: Network, concept: ConceptId): Segment[] =>
  n.lines
    .filter((l) => l.concept === concept)
    .flatMap((l) => l.paths.flatMap((path) => path.slice(1).map((q, i): Segment => [path[i], q])));

function pointSegment(q: Point, [a, b]: Segment): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((q.x - a.x) * dx + (q.y - a.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(q.x - a.x - t * dx, q.y - a.y - t * dy);
}

function intersection([a, b]: Segment, [c, d]: Segment): Point | null {
  const r = { x: b.x - a.x, y: b.y - a.y };
  const s = { x: d.x - c.x, y: d.y - c.y };
  const den = r.x * s.y - r.y * s.x;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / den;
  const u = ((c.x - a.x) * r.y - (c.y - a.y) * r.x) / den;
  if (t < -1e-9 || t > 1 + 1e-9 || u < -1e-9 || u > 1 + 1e-9) return null;
  return { x: a.x + t * r.x, y: a.y + t * r.y };
}

function touch(a: Segment, b: Segment): Point | null {
  const hit = intersection(a, b);
  if (hit) return hit;
  for (const [q, seg] of [
    [a[0], b],
    [a[1], b],
    [b[0], a],
    [b[1], a],
  ] as [Point, Segment][]) {
    if (pointSegment(q, seg) < 1) return q;
  }
  return null;
}

const CHANGE_REACH = 14;

describe("buildNetwork", () => {
  it("mette ogni scenario una volta sola, sulla sua linea", () => {
    expect(net.lines.map((l) => l.concept)).toEqual(order);
    for (const line of net.lines) {
      expect(line.stations.map((s) => s.id).sort()).toEqual(
        scenarios.filter((s) => s.concept === line.concept).map((s) => s.id),
      );
    }
    expect(stations.map((s) => s.id).sort()).toEqual(scenarios.map((s) => s.id));
  });

  it("tiene fermate, nomi e capolinea dentro il riquadro, senza fermate sovrapposte né sullo snodo", () => {
    const keys = new Set(stations.map((s) => `${s.x},${s.y}`));
    expect(keys.size).toBe(stations.length);
    for (const s of stations) {
      expect(inside(net, s.x, s.y)).toBe(true);
      expect(inside(net, s.label.x, s.label.y)).toBe(true);
      expect(
        Math.abs(s.x - net.hub.x) > net.hub.width / 2 ||
          Math.abs(s.y - net.hub.y) > net.hub.height / 2,
      ).toBe(true);
    }
    for (const l of net.lines) for (const t of l.termini) expect(inside(net, t.x, t.y)).toBe(true);
  });

  it("disegna un interscambio solo dove la fermata ha un also, e la sua linea ci passa", () => {
    for (const sc of scenarios) {
      const st = stations.find((x) => x.id === sc.id)!;
      expect(st.also).toEqual(sc.also ?? []);
      expect(st.shape.kind === "dot").toBe(!sc.also?.length);
      for (const other of sc.also ?? []) {
        const reach = Math.min(...railsOf(net, other).map((seg) => pointSegment(st, seg)));
        expect(reach, `${sc.id} sulla linea ${other}`).toBeLessThanOrEqual(CHANGE_REACH);
      }
    }
    expect(stations.some((s) => s.also.length > 0)).toBe(true);
  });

  it("fa toccare due linee solo in un interscambio dichiarato", () => {
    const placed = net.lines.flatMap((l) =>
      l.stations.map((s) => ({ s, lines: [l.concept, ...s.also] })),
    );
    const found: string[] = [];
    for (let i = 0; i < order.length; i++) {
      for (let j = i + 1; j < order.length; j++) {
        for (const a of railsOf(net, order[i])) {
          for (const b of railsOf(net, order[j])) {
            const hit = touch(a, b);
            if (!hit) continue;
            const declared = placed.some(
              ({ s, lines }) =>
                Math.hypot(s.x - hit.x, s.y - hit.y) <= CHANGE_REACH &&
                lines.includes(order[i]) &&
                lines.includes(order[j]),
            );
            if (!declared) found.push(`${order[i]} × ${order[j]} in ${hit.x},${hit.y}`);
          }
        }
      }
    }
    expect(found).toEqual([]);
  });

  it("tiene ogni fermata lontana dalle linee che non sono né la sua né un suo cambio", () => {
    for (const line of net.lines) {
      for (const s of line.stations) {
        for (const other of order) {
          if (other === line.concept || s.also.includes(other)) continue;
          const reach = Math.min(...railsOf(net, other).map((seg) => pointSegment(s, seg)));
          expect(reach, `${s.id} vicina alla linea ${other}`).toBeGreaterThan(CHANGE_REACH);
        }
      }
    }
  });

  it("ripete l'ordine del catalogo lungo ogni linea per le fermate che non sono cambi", () => {
    for (const line of net.lines) {
      const own = scenarios.filter((s) => s.concept === line.concept && !s.also?.length);
      expect(line.stations.filter((s) => !s.also.length).map((s) => s.id)).toEqual(
        own.map((s) => s.id),
      );
    }
  });
});

describe("nearestLine", () => {
  it("riconosce la linea di ogni fermata semplice e di ogni capolinea, anche un po' fuori dalla rotaia", () => {
    for (const line of net.lines) {
      for (const s of [...line.stations.filter((x) => !x.also.length), ...line.termini]) {
        expect(nearestLine(net, { x: s.x + 6, y: s.y - 6 })).toBe(line.concept);
      }
    }
  });
});

type Poly = Point[];

function overlaps(a: Poly, b: Poly): boolean {
  for (const poly of [a, b]) {
    for (let i = 0; i < poly.length; i++) {
      const q = poly[i];
      const r = poly[(i + 1) % poly.length];
      const axis = { x: r.y - q.y, y: q.x - r.x };
      const project = (pts: Poly) => pts.map((v) => v.x * axis.x + v.y * axis.y);
      const pa = project(a);
      const pb = project(b);
      if (Math.max(...pa) <= Math.min(...pb) || Math.max(...pb) <= Math.min(...pa)) return false;
    }
  }
  return true;
}

const square = (q: Point, size: number): Poly => [
  { x: q.x - size / 2, y: q.y - size / 2 },
  { x: q.x + size / 2, y: q.y - size / 2 },
  { x: q.x + size / 2, y: q.y + size / 2 },
  { x: q.x - size / 2, y: q.y + size / 2 },
];

function rail([a, b]: Segment, half: number): Poly {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const n = { x: (-(b.y - a.y) / len) * half, y: ((b.x - a.x) / len) * half };
  return [
    { x: a.x + n.x, y: a.y + n.y },
    { x: b.x + n.x, y: b.y + n.y },
    { x: b.x - n.x, y: b.y - n.y },
    { x: a.x - n.x, y: a.y - n.y },
  ];
}

function touchesCircle(poly: Poly, c: Point, r: number): boolean {
  let inPoly = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > c.y !== b.y > c.y && c.x < ((b.x - a.x) * (c.y - a.y)) / (b.y - a.y) + a.x)
      inPoly = !inPoly;
    if (pointSegment(c, [a, b]) < r) return true;
  }
  return inPoly;
}

function collisions(n: Network): string[] {
  const labels = n.lines.flatMap((l) =>
    l.stations.map((s) => ({ name: s.title, poly: labelPolygon(s.label, s.title) })),
  );
  const things = [
    ...labels,
    {
      name: "OGGI",
      poly: [
        { x: n.hub.x - n.hub.width / 2, y: n.hub.y - n.hub.height / 2 },
        { x: n.hub.x + n.hub.width / 2, y: n.hub.y - n.hub.height / 2 },
        { x: n.hub.x + n.hub.width / 2, y: n.hub.y + n.hub.height / 2 },
        { x: n.hub.x - n.hub.width / 2, y: n.hub.y + n.hub.height / 2 },
      ],
    },
    ...n.lines.flatMap((l) => [
      ...l.paths.flatMap((path) =>
        path.slice(1).map((q, i) => ({
          name: `rotaia ${l.concept}`,
          poly: rail([path[i], q], 5),
        })),
      ),
      ...l.termini.map((t) => ({ name: `capolinea ${l.concept}`, poly: square(t, 28) })),
    ]),
  ];
  const dots = n.lines.flatMap((l) =>
    l.stations.map((s) => ({
      name: `fermata ${s.title}`,
      c: s,
      r: s.shape.kind === "pill" ? 24 : s.also.length ? 14 : 11,
    })),
  );
  const found: string[] = [];
  for (const label of labels) {
    for (const d of dots) {
      if (touchesCircle(label.poly, d.c, d.r)) found.push(`${label.name} × ${d.name}`);
    }
    for (const thing of things) {
      if (thing === label) continue;
      if (overlaps(label.poly, thing.poly)) found.push(`${label.name} × ${thing.name}`);
    }
  }
  return found;
}

describe("nomi della rete", () => {
  it("non si sovrappongono tra loro, alle fermate, ai capolinea, alle rotaie e allo snodo", () => {
    expect(collisions(net)).toEqual([]);
  });
});
