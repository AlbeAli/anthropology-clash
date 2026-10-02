import type { ConceptId } from "../schema/scenario.schema";

export type Point = { x: number; y: number };
export type NetLabel = Point & { anchor: "start" | "end"; rotate: number };
export type NetStation = Point & { id: string; title: string; label: NetLabel };
export type NetLine = {
  concept: ConceptId;
  path: Point[];
  terminus: Point;
  stations: NetStation[];
};
export type Box = { x: number; y: number; width: number; height: number };
export type Network = {
  box: Box;
  core: Box;
  hub: Point & { width: number; height: number };
  lines: NetLine[];
};

type Ray = {
  dir: Point;
  first: number;
  step: number;
  label: (p: Point) => NetLabel;
};

const D = Math.SQRT1_2;

const RAYS: Record<ConceptId, Ray> = {
  reciprocita: {
    dir: { x: -1, y: 0 },
    first: 80,
    step: 80,
    label: (p) => ({ x: p.x - 10, y: p.y - 12, anchor: "end", rotate: 45 }),
  },
  parentela: {
    dir: { x: 0, y: -1 },
    first: 120,
    step: 60,
    label: (p) => ({ x: p.x - 18, y: p.y + 5, anchor: "end", rotate: 0 }),
  },
  rituale: {
    dir: { x: 1, y: 0 },
    first: 80,
    step: 80,
    label: (p) => ({ x: p.x + 10, y: p.y - 12, anchor: "start", rotate: -45 }),
  },
  relativismo: {
    dir: { x: 0, y: 1 },
    first: 80,
    step: 70,
    label: (p) => ({ x: p.x + 18, y: p.y + 5, anchor: "start", rotate: 0 }),
  },
  consumo: {
    dir: { x: -D, y: D },
    first: 78,
    step: 78,
    label: (p) => ({ x: p.x - 18, y: p.y + 5, anchor: "end", rotate: 0 }),
  },
};

const HUB = { width: 124, height: 48 };
const TERMINUS_GAP = 42;
const TERMINUS_SIZE = 28;
const CHAR_WIDTH = 8.4;
const LABEL_HEIGHT = 16;
const MARGIN = 16;

const at = (ray: Ray, d: number): Point => ({ x: ray.dir.x * d, y: ray.dir.y * d });

function labelEnd(label: NetLabel, title: string): Point {
  const length = title.length * CHAR_WIDTH;
  const a = (label.rotate * Math.PI) / 180;
  const sign = label.anchor === "start" ? 1 : -1;
  return { x: label.x + sign * Math.cos(a) * length, y: label.y + sign * Math.sin(a) * length };
}

export function buildNetwork(
  entries: { id: string; concept: ConceptId; title: string }[],
  order: ConceptId[],
): Network {
  const lines: NetLine[] = order.map((concept) => {
    const ray = RAYS[concept];
    const stops = entries.filter((e) => e.concept === concept);
    const stations = stops.map((e, k) => {
      const p = at(ray, ray.first + ray.step * k);
      return { id: e.id, title: e.title, ...p, label: ray.label(p) };
    });
    const terminus = at(ray, ray.first + ray.step * Math.max(0, stops.length - 1) + TERMINUS_GAP);
    return { concept, path: [{ x: 0, y: 0 }, terminus], terminus, stations };
  });

  const points: Point[] = [
    { x: -HUB.width / 2, y: -HUB.height / 2 },
    { x: HUB.width / 2, y: HUB.height / 2 },
  ];
  for (const line of lines) {
    const t = TERMINUS_SIZE / 2;
    points.push(
      { x: line.terminus.x - t, y: line.terminus.y - t },
      { x: line.terminus.x + t, y: line.terminus.y + t },
    );
  }
  const core = boxOf(points, MARGIN * 2);
  for (const line of lines) {
    for (const s of line.stations) {
      const end = labelEnd(s.label, s.title);
      points.push(
        { x: s.label.x, y: s.label.y - LABEL_HEIGHT },
        { x: s.label.x, y: s.label.y + LABEL_HEIGHT / 2 },
        { x: end.x, y: end.y - LABEL_HEIGHT },
        { x: end.x, y: end.y + LABEL_HEIGHT / 2 },
      );
    }
  }
  return { box: boxOf(points, MARGIN), core, hub: { x: 0, y: 0, ...HUB }, lines };
}

function boxOf(points: Point[], margin: number): Box {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const x = Math.floor(Math.min(...xs) - margin);
  const y = Math.floor(Math.min(...ys) - margin);
  return {
    x,
    y,
    width: Math.ceil(Math.max(...xs) + margin - x),
    height: Math.ceil(Math.max(...ys) + margin - y),
  };
}
