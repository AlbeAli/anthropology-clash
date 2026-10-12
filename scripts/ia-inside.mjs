import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const [id, ...rest] = process.argv.slice(2);
if (!id || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(id)) {
  console.error("uso: node scripts/ia-inside.mjs <id-item> [--out dir] [--scarto N] [regex ...]");
  process.exit(2);
}
const take = (flag) => {
  const i = rest.indexOf(flag);
  return i >= 0 ? rest.splice(i, 2)[1] : undefined;
};
const scarto = Number(take("--scarto") ?? 0);
const outDir = take("--out") ?? join(".ia-cache", id);
mkdirSync(outDir, { recursive: true });
const cache = join(outDir, "paragrafi.json");

const clean = (t) =>
  t
    .replace(/<\/?IA_FTS_MATCH>/g, "")
    .replace(/\s+/g, " ")
    .trim();

async function scarica() {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`https://archive.org/details/${id}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(4000);
    return await page.evaluate(async (id) => {
      const meta = await fetch(`https://archive.org/metadata/${id}`, {
        credentials: "include",
      }).then((r) => r.json());
      const server = meta.server || meta.d1;
      const q = async (p) => {
        const u = `https://${server}/fulltext/inside.php?item_id=${id}&doc=${id}&q=${encodeURIComponent(p)}&path=${meta.dir}&pre_tag=%3CIA_FTS_MATCH%3E&post_tag=%3C%2FIA_FTS_MATCH%3E`;
        const r = await fetch(u, { credentials: "include" });
        if (!r.ok) throw new Error(`inside.php ${r.status}`);
        return r.json();
      };
      const j = await q("the");
      return {
        title: meta.metadata?.title,
        items: j.matches.map((m) => ({ p: m.par?.[0]?.page, t: m.text })),
      };
    }, id);
  } finally {
    await browser.close();
  }
}

let dati;
if (existsSync(cache)) dati = JSON.parse(readFileSync(cache, "utf8"));
else {
  const raw = await scarica();
  dati = {
    title: raw.title,
    items: raw.items.map((x) => ({ p: x.p, t: clean(x.t) })).sort((a, b) => a.p - b.p),
  };
  writeFileSync(cache, JSON.stringify(dati));
  writeFileSync(join(outDir, "testo.txt"), dati.items.map((x) => `[L${x.p}] ${x.t}`).join("\n\n"));
}
const fogli = new Set(dati.items.map((x) => x.p));
console.log(
  `${dati.title}: ${dati.items.length} paragrafi, ${fogli.size} fogli (${Math.min(...fogli)}-${Math.max(...fogli)}) -> ${outDir}/testo.txt`,
);

for (const f of rest) {
  const re = new RegExp(f, "i");
  const hit = dati.items.filter((x) => re.test(x.t));
  console.log(`\n### ${f} (${hit.length})`);
  for (const x of hit.slice(0, 8)) {
    const i = x.t.search(re);
    console.log(
      `[L${x.p}${scarto ? ` p.${x.p - scarto}` : ""}] ...${x.t.slice(Math.max(0, i - 120), i + 200)}...`,
    );
  }
}
