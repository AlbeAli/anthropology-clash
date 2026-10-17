import { describe, expect, it } from "vitest";
import { checkUrl, classify, collectUrls, report, type Result } from "./check-links";

const noWait = async () => {};

describe("collectUrls", () => {
  it("raccoglie gli url ovunque nel JSON, senza doppioni, con i file che li usano", () => {
    const found = collectUrls({
      "it/scenarios/scenario_001.json": {
        studente: { deepen: [{ ref: "A", url: "https://a.example/x" }, { ref: "B" }] },
      },
      "it/scenarios/scenario_002.json": {
        studente: { deepen: [{ url: "https://a.example/x" }, { url: "https://b.example" }] },
      },
    });
    expect([...found.keys()]).toEqual(["https://a.example/x", "https://b.example"]);
    expect(found.get("https://a.example/x")).toEqual([
      "it/scenarios/scenario_001.json",
      "it/scenarios/scenario_002.json",
    ]);
  });

  it("ignora i campi url che non sono indirizzi web", () => {
    const found = collectUrls({ f: { url: "javascript:alert(1)", x: [{ url: 3 }, { url: "" }] } });
    expect(found.size).toBe(0);
  });
});

describe("classify", () => {
  it("distingue raggiungibili, bloccati, rotti e senza risposta", () => {
    expect(classify(200)).toBe("ok");
    expect(classify(301)).toBe("ok");
    expect(classify(403)).toBe("blocked");
    expect(classify(429)).toBe("blocked");
    expect(classify(404)).toBe("broken");
    expect(classify(410)).toBe("broken");
    expect(classify(503)).toBe("unreachable");
    expect(classify(null)).toBe("unreachable");
  });
});

describe("checkUrl", () => {
  const reply = (...statuses: (number | Error)[]) => {
    const calls: string[] = [];
    const fn = async (_url: string, init: RequestInit) => {
      calls.push(String(init.method));
      const next = statuses[Math.min(calls.length - 1, statuses.length - 1)];
      if (next instanceof Error) throw next;
      return { status: next, body: null };
    };
    return { fn, calls };
  };

  it("ripiega su GET quando HEAD non è ammesso", async () => {
    const { fn, calls } = reply(405, 200);
    expect(await checkUrl("https://a.example", fn, noWait)).toBe(200);
    expect(calls).toEqual(["HEAD", "GET"]);
  });

  it("non ritenta un 404", async () => {
    const { fn, calls } = reply(404);
    expect(await checkUrl("https://a.example", fn, noWait)).toBe(404);
    expect(calls).toEqual(["HEAD"]);
  });

  it("ritenta gli errori passeggeri e poi riesce", async () => {
    const { fn } = reply(503, 503, 200);
    expect(await checkUrl("https://a.example", fn, noWait)).toBe(200);
  });

  it("restituisce null se la rete non risponde mai", async () => {
    const { fn } = reply(new Error("ENOTFOUND"));
    expect(await checkUrl("https://a.example", fn, noWait)).toBeNull();
  });
});

describe("report", () => {
  it("elenca solo le sezioni non vuote, con stato e file", () => {
    const results: Result[] = [
      { url: "https://ok.example", status: 200, verdict: "ok", files: ["f1"] },
      { url: "https://rotto.example", status: 404, verdict: "broken", files: ["f1", "f2"] },
      { url: "https://chiuso.example", status: 403, verdict: "blocked", files: ["f3"] },
    ];
    const text = report(results, "2026-10-17");
    expect(text).toContain("3 indirizzi controllati, 1 raggiungibili");
    expect(text).toContain("- https://rotto.example (404): f1, f2");
    expect(text).toContain("- https://chiuso.example (403): f3");
    expect(text).not.toContain("Senza risposta");
    expect(text).not.toContain("https://ok.example");
  });
});
