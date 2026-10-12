import type { ConceptId } from "../schema/scenario.schema";

export type Point = { x: number; y: number };
export type NetLabel = Point & { anchor: "start" | "end"; rotate: number };
type NetShape =
  { kind: "dot" } | { kind: "circle" } | { kind: "pill"; width: number; rotate: number };
type NetStation = Point & {
  id: string;
  title: string;
  label: NetLabel;
  also: ConceptId[];
  shape: NetShape;
};
type NetLine = {
  concept: ConceptId;
  paths: Point[][];
  termini: Point[];
  stations: NetStation[];
};
export type Box = { x: number; y: number; width: number; height: number };
export type Network = {
  box: Box;
  core: Box;
  hub: Point & { width: number; height: number };
  lines: NetLine[];
};

const p = (x: number, y: number): Point => ({ x, y });

const HUB = { x: 520, y: 360, width: 150, height: 54 };

const RAILS: Record<ConceptId, Point[][]> = {
  reciprocita: [
    [
      p(205, 360),
      p(720, 360),
      p(800, 440),
      p(840, 400),
      p(920, 400),
      p(960, 440),
      p(1000, 400),
      p(1000, 50),
      p(440, 50),
    ],
  ],
  parentela: [
    [p(520, 0), p(520, 333)],
    [p(500, 385), p(262, 623), p(289, 650), p(600, 650)],
  ],
  rituale: [[p(528, 387), p(528, 440), p(1110, 440)]],
  relativismo: [[p(512, 387), p(512, 825)]],
  consumo: [[p(480, 378), p(144, 714)]],
};

const TERMINI: Record<ConceptId, Point[]> = {
  reciprocita: [p(205, 360), p(440, 50)],
  parentela: [p(520, 0), p(600, 650)],
  rituale: [p(1110, 440)],
  relativismo: [p(512, 825)],
  consumo: [p(144, 714)],
};

type Layout = {
  x: number;
  y: number;
  label: [dx: number, dy: number, anchor: "start" | "end", rotate: number];
  shape?: NetShape;
};

const UP_LEFT: Layout["label"] = [-10, -12, "end", 45];
const DOWN_RIGHT: Layout["label"] = [8, 14, "start", 45];
const LEFT: Layout["label"] = [-18, 5, "end", 0];
const RIGHT: Layout["label"] = [18, 5, "start", 0];

const LAYOUT: Record<string, Layout> = {
  scenario_001: { x: 440, y: 360, label: UP_LEFT },
  scenario_002: { x: 385, y: 360, label: UP_LEFT },
  scenario_004: { x: 330, y: 360, label: UP_LEFT },
  scenario_005: { x: 275, y: 360, label: UP_LEFT },
  scenario_025: { x: 1000, y: 330, label: LEFT },
  scenario_028: { x: 1000, y: 270, label: LEFT },
  scenario_006: { x: 520, y: 300, label: RIGHT },
  scenario_007: { x: 520, y: 250, label: RIGHT },
  scenario_008: { x: 520, y: 200, label: RIGHT },
  scenario_009: { x: 520, y: 150, label: RIGHT },
  scenario_024: { x: 520, y: 100, label: RIGHT },
  scenario_029: { x: 520, y: 50, label: [14, -18, "start", 0], shape: { kind: "circle" } },
  scenario_010: { x: 800, y: 440, label: [8, 16, "start", 45], shape: { kind: "circle" } },
  scenario_011: { x: 850, y: 440, label: DOWN_RIGHT },
  scenario_012: { x: 900, y: 440, label: DOWN_RIGHT },
  scenario_019: { x: 960, y: 440, label: [8, 16, "start", 45], shape: { kind: "circle" } },
  scenario_022: { x: 1010, y: 440, label: DOWN_RIGHT },
  scenario_026: { x: 1060, y: 440, label: DOWN_RIGHT },
  scenario_003: {
    x: 520,
    y: 440,
    label: [28, 26, "start", 0],
    shape: { kind: "pill", width: 34, rotate: 0 },
  },
  scenario_013: { x: 512, y: 505, label: RIGHT },
  scenario_014: { x: 512, y: 575, label: RIGHT },
  scenario_015: { x: 512, y: 650, label: [18, 28, "start", 0], shape: { kind: "circle" } },
  scenario_023: { x: 512, y: 715, label: RIGHT },
  scenario_030: { x: 512, y: 770, label: RIGHT },
  scenario_016: { x: 434, y: 424, label: LEFT },
  scenario_017: { x: 384, y: 474, label: LEFT },
  scenario_018: { x: 334, y: 524, label: LEFT },
  scenario_020: {
    x: 290,
    y: 581,
    label: [-32, -15, "end", 0],
    shape: { kind: "pill", width: 34, rotate: 45 },
  },
  scenario_021: { x: 234, y: 624, label: LEFT },
  scenario_027: { x: 184, y: 674, label: LEFT },
};

const TERMINUS_SIZE = 28;
const CHANGE_RADIUS = 12;
const MARGIN = 16;
const CHAR_WIDTH = 8.4;
const ASCENT = 12;
const DESCENT = 4;

export function labelPolygon(label: NetLabel, title: string): Point[] {
  const a = (label.rotate * Math.PI) / 180;
  const sign = label.anchor === "start" ? 1 : -1;
  const length = title.length * CHAR_WIDTH;
  const end = {
    x: label.x + sign * Math.cos(a) * length,
    y: label.y + sign * Math.sin(a) * length,
  };
  const n = { x: -Math.sin(a), y: Math.cos(a) };
  const off = (q: Point, d: number) => ({ x: q.x + n.x * d, y: q.y + n.y * d });
  return [off(label, -ASCENT), off(end, -ASCENT), off(end, DESCENT), off(label, DESCENT)];
}

export function buildNetwork(
  entries: { id: string; concept: ConceptId; title: string; also?: ConceptId[] }[],
  order: ConceptId[],
): Network {
  const lines: NetLine[] = order.map((concept) => ({
    concept,
    paths: RAILS[concept],
    termini: TERMINI[concept],
    stations: entries
      .filter((e) => e.concept === concept && e.id in LAYOUT)
      .map((e) => {
        const at = LAYOUT[e.id];
        return {
          id: e.id,
          title: e.title,
          x: at.x,
          y: at.y,
          label: {
            x: at.x + at.label[0],
            y: at.y + at.label[1],
            anchor: at.label[2],
            rotate: at.label[3],
          },
          also: e.also ?? [],
          shape: at.shape ?? { kind: "dot" },
        };
      }),
  }));

  const points: Point[] = [
    p(HUB.x - HUB.width / 2, HUB.y - HUB.height / 2),
    p(HUB.x + HUB.width / 2, HUB.y + HUB.height / 2),
  ];
  const square = (q: Point, size: number) => {
    points.push(p(q.x - size / 2, q.y - size / 2), p(q.x + size / 2, q.y + size / 2));
  };
  for (const line of lines) {
    for (const t of line.termini) square(t, TERMINUS_SIZE);
    for (const s of line.stations)
      square(s, s.shape.kind === "pill" ? 2 * CHANGE_RADIUS + 28 : 2 * CHANGE_RADIUS);
  }
  const core = boxOf(points, MARGIN * 2);
  for (const line of lines) {
    for (const s of line.stations) points.push(...labelPolygon(s.label, s.title));
  }
  return { box: boxOf(points, MARGIN), core, hub: { ...HUB }, lines };
}

function boxOf(points: Point[], margin: number): Box {
  const xs = points.map((q) => q.x);
  const ys = points.map((q) => q.y);
  const x = Math.floor(Math.min(...xs) - margin);
  const y = Math.floor(Math.min(...ys) - margin);
  return {
    x,
    y,
    width: Math.ceil(Math.max(...xs) + margin - x),
    height: Math.ceil(Math.max(...ys) + margin - y),
  };
}

function segmentDistance(q: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((q.x - a.x) * dx + (q.y - a.y) * dy) / len)) : 0;
  return Math.hypot(q.x - (a.x + t * dx), q.y - (a.y + t * dy));
}

export function nearestLine(net: Network, q: Point): ConceptId | null {
  let best: ConceptId | null = null;
  let min = Infinity;
  for (const line of net.lines) {
    for (const path of line.paths) {
      for (let i = 1; i < path.length; i++) {
        const d = segmentDistance(q, path[i - 1], path[i]);
        if (d < min) {
          min = d;
          best = line.concept;
        }
      }
    }
  }
  return best;
}
