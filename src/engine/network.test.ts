import { describe, expect, it } from "vitest";
import type { Concept, ConceptId, Scenario } from "../schema/scenario.schema";
import { buildNetwork, type Network } from "./network";

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
