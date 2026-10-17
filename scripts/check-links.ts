import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export type Verdict = "ok" | "blocked" | "broken" | "unreachable";
export type Result = { url: string; status: number | null; verdict: Verdict; files: string[] };

type Fetch = (url: string, init: RequestInit) => Promise<Pick<Response, "status" | "body">>;

const USER_AGENT = "anthropology-clash-linkcheck (+https://github.com/AlbeAli/anthropology-clash)";
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function classify(status: number | null): Verdict {
  if (status === null || status === 408 || status >= 500) return "unreachable";
  if (status < 400) return "ok";
  if (status === 401 || status === 403 || status === 429 || status === 999) return "blocked";
  return "broken";
}

export function collectUrls(files: Record<string, unknown>): Map<string, string[]> {
  const found = new Map<string, string[]>();
  const walk = (node: unknown, file: string) => {
    if (Array.isArray(node)) {
      node.forEach((item) => walk(item, file));
      return;
    }
    if (typeof node !== "object" || node === null) return;
    for (const [key, value] of Object.entries(node)) {
      if (key === "url" && typeof value === "string" && /^https?:\/\/\S+$/.test(value)) {
        const list = found.get(value) ?? [];
        if (!list.includes(file)) list.push(file);
        found.set(value, list);
      } else {
        walk(value, file);
      }
    }
  };
  for (const [file, json] of Object.entries(files)) walk(json, file);
  return found;
}

async function probe(url: string, fetchFn: Fetch): Promise<number | null> {
  for (const method of ["HEAD", "GET"]) {
    try {
      const res = await fetchFn(url, {
        method,
        redirect: "follow",
        headers: { "user-agent": USER_AGENT },
        signal: AbortSignal.timeout(15_000),
      });
      void res.body?.cancel();
      if (method === "HEAD" && [403, 405, 501].includes(res.status)) continue;
      return res.status;
    } catch {
      if (method === "GET") return null;
    }
  }
  return null;
}

export async function checkUrl(
  url: string,
  fetchFn: Fetch = fetch,
  pause: (ms: number) => Promise<void> = wait,
  attempts = 3,
): Promise<number | null> {
  let status: number | null = null;
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await pause(1500 * i);
    status = await probe(url, fetchFn);
    if (classify(status) !== "unreachable") break;
  }
  return status;
}

export function report(results: Result[], date: string): string {
  const of = (verdict: Verdict) => results.filter((r) => r.verdict === verdict);
  const section = (title: string, list: Result[]) =>
    list.length
      ? [
          `## ${title}`,
          ...list.map(
            (r) => `- ${r.url} (${r.status ?? "nessuna risposta"}): ${r.files.join(", ")}`,
          ),
          "",
        ]
      : [];
  return [
    `# Controllo dei link del ${date}`,
    "",
    `${results.length} indirizzi controllati, ${of("ok").length} raggiungibili.`,
    "",
    ...section("Rotti (404, 410 o simili)", of("broken")),
    ...section("Senza risposta", of("unreachable")),
    ...section("Bloccati dal sito (da aprire a mano)", of("blocked")),
  ].join("\n");
}

function readContent(root: string): Record<string, unknown> {
  const files: Record<string, unknown> = {};
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith(".json")) {
        files[relative(root, path).replaceAll("\\", "/")] = JSON.parse(readFileSync(path, "utf8"));
      }
    }
  };
  walk(root);
  return files;
}

async function main() {
  const root = fileURLToPath(new URL("../src/content", import.meta.url));
  const urls = collectUrls(readContent(root));
  const results: Result[] = [];
  for (const [url, files] of urls) {
    const status = await checkUrl(url);
    results.push({ url, status, verdict: classify(status), files });
    await wait(400);
  }
  const text = report(results, new Date().toISOString().slice(0, 10));
  console.log(text);
  const out = process.argv[process.argv.indexOf("--out") + 1];
  if (process.argv.includes("--out") && out) writeFileSync(out, text);
  if (results.some((r) => r.verdict === "broken" || r.verdict === "unreachable")) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
