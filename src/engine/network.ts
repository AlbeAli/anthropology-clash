import type { ConceptId } from "../schema/scenario.schema";

export type Point = { x: number; y: number };
export type NetLabel = Point & { anchor: "start" | "end"; rotate: number };
export type NetBadge = Point & { concept: ConceptId };
export type NetStation = Point & {
  id: string;
  title: string;
  label: NetLabel;
  badges: NetBadge[];
};
export type NetLine = {
  concept: ConceptId;
  path: Point[];
  terminus: Point;
  pillRotate: number;
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
  label: (p: Point, e: number) => NetLabel;
  badge: Point;
  badgeStep: Point;
  pillRotate: number;
};

const D = Math.SQRT1_2;

const RAYS: Record<ConceptId, Ray> = {
  reciprocita: {
    dir: { x: -1, y: 0 },
    first: 80,
    step: 80,
    label: (p, e) => ({ x: p.x - 10 - e / 2, y: p.y - 12 - e, anchor: "end", rotate: 45 }),
    badge: { x: 0, y: 28 },
    badgeStep: { x: 0, y: 20 },
    pillRotate: 90,
  },
  parentela: {
    dir: { x: 0, y: -1 },
    first: 120,
    step: 60,
    label: (p, e) => ({ x: p.x - 18 - e, y: p.y + 5, anchor: "end", rotate: 0 }),
    badge: { x: 28, y: 0 },
    badgeStep: { x: 20, y: 0 },
    pillRotate: 0,
  },
  rituale: {
    dir: { x: 1, y: 0 },
    first: 80,
    step: 80,
    label: (p, e) => ({ x: p.x + 10 + e / 2, y: p.y - 12 - e, anchor: "start", rotate: -45 }),
    badge: { x: 0, y: 28 },
    badgeStep: { x: 0, y: 20 },
    pillRotate: 90,
  },
  relativismo: {
    dir: { x: 0, y: 1 },
    first: 80,
    step: 70,
    label: (p, e) => ({ x: p.x + 18 + e, y: p.y + 5, anchor: "start", rotate: 0 }),
    badge: { x: -28, y: 0 },
    badgeStep: { x: -20, y: 0 },
    pillRotate: 0,
  },
  consumo: {
    dir: { x: -D, y: D },
    first: 78,
    step: 78,
    label: (p, e) => ({ x: p.x - 18 - e, y: p.y + 5, anchor: "end", rotate: 0 }),
    badge: { x: 20, y: 20 },
    badgeStep: { x: 20, y: 0 },
    pillRotate: 45,
  },
};

const HUB = { width: 124, height: 48 };
const TERMINUS_GAP = 42;
const TERMINUS_SIZE = 28;
const BADGE_SIZE = 18;
const CHANGE_GAP = 9;
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
  entries: { id: string; concept: ConceptId; title: string; also?: ConceptId[] }[],
  order: ConceptId[],
): Network {
  const lines: NetLine[] = order.map((concept) => {
    const ray = RAYS[concept];
    const stops = entries.filter((e) => e.concept === concept);
    const stations = stops.map((e, k) => {
      const p = at(ray, ray.first + ray.step * k);
      const badges = (e.also ?? []).map((c, j) => ({
        concept: c,
        x: p.x + ray.badge.x + ray.badgeStep.x * j,
        y: p.y + ray.badge.y + ray.badgeStep.y * j,
      }));
      const label = ray.label(p, badges.length ? CHANGE_GAP : 0);
      return { id: e.id, title: e.title, ...p, label, badges };
    });
    const terminus = at(ray, ray.first + ray.step * Math.max(0, stops.length - 1) + TERMINUS_GAP);
    return {
      concept,
      path: [{ x: 0, y: 0 }, terminus],
      terminus,
      pillRotate: ray.pillRotate,
      stations,
    };
  });

  const points: Point[] = [
    { x: -HUB.width / 2, y: -HUB.height / 2 },
    { x: HUB.width / 2, y: HUB.height / 2 },
  ];
  const square = (p: Point, size: number) => {
    points.push({ x: p.x - size / 2, y: p.y - size / 2 }, { x: p.x + size / 2, y: p.y + size / 2 });
  };
  for (const line of lines) {
    square(line.terminus, TERMINUS_SIZE);
    for (const s of line.stations) for (const b of s.badges) square(b, BADGE_SIZE);
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
