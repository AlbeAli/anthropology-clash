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

const inside = (net: Network, x: number, y: number) =>
  x >= net.box.x &&
  x <= net.box.x + net.box.width &&
  y >= net.box.y &&
  y <= net.box.y + net.box.height;

describe("buildNetwork", () => {
  it("mette ogni scenario una volta sola, sulla sua linea e nell'ordine del catalogo", () => {
    const net = buildNetwork(scenarios, order);
    expect(net.lines.map((l) => l.concept)).toEqual(order);
    for (const line of net.lines) {
      expect(line.stations.map((s) => s.id)).toEqual(
        scenarios.filter((s) => s.concept === line.concept).map((s) => s.id),
      );
    }
    const ids = net.lines.flatMap((l) => l.stations.map((s) => s.id));
    expect(ids.sort()).toEqual(scenarios.map((s) => s.id));
  });

  it("tiene fermate, nomi e capolinea dentro il riquadro, senza fermate sovrapposte", () => {
    const net = buildNetwork(scenarios, order);
    const stations = net.lines.flatMap((l) => l.stations);
    const keys = new Set(stations.map((s) => `${s.x.toFixed(1)},${s.y.toFixed(1)}`));
    expect(keys.size).toBe(stations.length);
    for (const s of stations) {
      expect(inside(net, s.x, s.y)).toBe(true);
      expect(inside(net, s.label.x, s.label.y)).toBe(true);
      expect(Math.hypot(s.x, s.y)).toBeGreaterThan(net.hub.width / 2);
    }
    for (const l of net.lines) expect(inside(net, l.terminus.x, l.terminus.y)).toBe(true);
  });

  it("segna gli interscambi con il simbolo di ogni altra linea, dentro il riquadro", () => {
    const net = buildNetwork(scenarios, order);
    const stations = net.lines.flatMap((l) => l.stations);
    for (const s of scenarios) {
      const st = stations.find((x) => x.id === s.id)!;
      expect(st.badges.map((b) => b.concept)).toEqual(s.also ?? []);
      for (const b of st.badges) expect(inside(net, b.x, b.y)).toBe(true);
    }
    expect(stations.some((s) => s.badges.length > 0)).toBe(true);
  });

  it("regge sei fermate per linea, l'obiettivo delle 30", () => {
    const many = order.flatMap((concept: ConceptId) =>
      Array.from({ length: 6 }, (_, k) => ({
        id: `${concept}_${k}`,
        concept,
        title: "Un titolo lungo quanto il più lungo di oggi",
      })),
    );
    const net = buildNetwork(many, order);
    expect(net.lines.every((l) => l.stations.length === 6)).toBe(true);
    for (const s of net.lines.flatMap((l) => l.stations)) {
      expect(inside(net, s.label.x, s.label.y)).toBe(true);
    }
  });
});

describe("nearestLine", () => {
  it("riconosce la linea di ogni fermata e del suo capolinea, anche un po' fuori dalla rotaia", () => {
    const net = buildNetwork(scenarios, order);
    for (const line of net.lines) {
      for (const s of [...line.stations, line.terminus]) {
        expect(nearestLine(net, { x: s.x + 12, y: s.y - 12 })).toBe(line.concept);
      }
    }
  });
});

type Poly = Point[];

function overlaps(a: Poly, b: Poly): boolean {
  for (const poly of [a, b]) {
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i];
      const q = poly[(i + 1) % poly.length];
      const axis = { x: q.y - p.y, y: p.x - q.x };
      const project = (pts: Poly) => pts.map((v) => v.x * axis.x + v.y * axis.y);
      const pa = project(a);
      const pb = project(b);
      if (Math.max(...pa) <= Math.min(...pb) || Math.max(...pb) <= Math.min(...pa)) return false;
    }
  }
  return true;
}

const square = (p: Point, size: number): Poly => [
  { x: p.x - size / 2, y: p.y - size / 2 },
  { x: p.x + size / 2, y: p.y - size / 2 },
  { x: p.x + size / 2, y: p.y + size / 2 },
  { x: p.x - size / 2, y: p.y + size / 2 },
];

function rail(a: Point, b: Point, half: number): Poly {
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
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > c.y !== b.y > c.y && c.x < ((b.x - a.x) * (c.y - a.y)) / (b.y - a.y) + a.x)
      inside = !inside;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((c.x - a.x) * dx + (c.y - a.y) * dy) / (dx * dx + dy * dy)));
    if (Math.hypot(c.x - a.x - t * dx, c.y - a.y - t * dy) < r) return true;
  }
  return inside;
}

function collisions(net: Network): string[] {
  const labels = net.lines.flatMap((l) =>
    l.stations.map((s) => ({ name: s.title, poly: labelPolygon(s.label, s.title) })),
  );
  const things = [
    ...labels,
    {
      name: "OGGI",
      poly: square({ x: 0, y: 0 }, net.hub.width).map((p) => ({
        x: p.x,
        y: p.y * (net.hub.height / net.hub.width),
      })),
    },
    ...net.lines.flatMap((l) => [
      { name: `rotaia ${l.concept}`, poly: rail(l.path[0], l.path[1], 5) },
      { name: `capolinea ${l.concept}`, poly: square(l.terminus, 28) },
      ...l.stations.flatMap((s) =>
        s.badges.map((b) => ({ name: `simbolo ${s.title}`, poly: square(b, 18) })),
      ),
    ]),
  ];
  const dots = net.lines.flatMap((l) =>
    l.stations.map((s) => ({ name: `fermata ${s.title}`, c: s, r: s.badges.length ? 18 : 11 })),
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
  it("non si sovrappongono tra loro, alle fermate, ai simboli, alle rotaie e allo snodo", () => {
    expect(collisions(buildNetwork(scenarios, order))).toEqual([]);
  });

  it("restano liberi con sei fermate per linea, le nuove in coda e lunghe quanto il titolo più lungo", () => {
    const longest = Math.max(...scenarios.map((s) => s.title.length));
    const many = order.flatMap((concept: ConceptId) => {
      const real = scenarios.filter((s) => s.concept === concept);
      const extra = Array.from({ length: 6 - real.length }, (_, k) => ({
        id: `${concept}_${k}`,
        concept,
        title: `${concept} ${k} `.padEnd(longest, "x"),
      }));
      return [...real, ...extra];
    });
    expect(collisions(buildNetwork(many, order))).toEqual([]);
  });
});
