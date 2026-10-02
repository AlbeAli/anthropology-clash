import { expect, test, type Page } from "@playwright/test";
import { lineCount, scenarios } from "./content";

const first = scenarios[0];

async function fresh(page: Page, path = "/") {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto(path);
}

async function choose(page: Page, index = 0) {
  await page.locator('[aria-labelledby="choices-heading"] button').nth(index).click();
  await expect(page.getByRole("heading", { name: "Dove porta la tua uscita" })).toBeVisible();
}

test("la Home mostra tutte le linee e tutte le fermate", async ({ page }) => {
  await fresh(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    `${lineCount} linee, ${scenarios.length} fermate.`,
  );
  await expect(page.locator(".metro-stop")).toHaveCount(scenarios.length);
  await expect(page.getByRole("link", { name: new RegExp(`Parti`) })).toHaveAttribute(
    "href",
    `/s/${first.id}`,
  );
});

test("uno scenario mostra gli esiti di tutte le uscite e la fonte", async ({ page }) => {
  await fresh(page, `/s/${first.id}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(first.title);
  await choose(page);
  await expect(page.locator("article")).toHaveCount(first.levels.neofita.choices.length);
  await expect(page.getByRole("heading", { name: "Fonte" })).toBeVisible();
  await expect(page.getByText("Fermata visitata")).toBeVisible();
});

test("il livello studente ha le sue uscite e le letture per approfondire", async ({ page }) => {
  const s = scenarios.find((x) => x.levels.studente.deepen?.length) ?? first;
  await fresh(page, `/s/${s.id}`);
  await page.getByRole("button", { name: "Studente" }).click();
  await expect(page.locator('[aria-labelledby="choices-heading"] button')).toHaveCount(
    s.levels.studente.choices.length,
  );
  await choose(page);
  await expect(page.getByRole("heading", { name: "Per approfondire" })).toBeVisible();
});

test("i progressi restano dopo il ricaricamento e finiscono nel viaggio", async ({ page }) => {
  await fresh(page, `/s/${first.id}`);
  await choose(page);
  await page.goto("/viaggio");
  await page.reload();
  await expect(page.getByRole("link", { name: first.title })).toBeVisible();
  await page.getByRole("button", { name: "Azzera i progressi" }).click();
  await page.getByRole("button", { name: "Conferma: azzera i progressi" }).click();
  await expect(page.getByRole("link", { name: first.title })).toHaveCount(0);
});

test("la bibliografia non ha voci doppie", async ({ page }) => {
  await fresh(page, "/metodo");
  const entries = page.locator("#bibliography ol > li > p:first-child");
  await expect(entries.first()).toBeVisible();
  const refs = await entries.allTextContents();
  expect(refs.length).toBeGreaterThan(0);
  expect(new Set(refs).size).toBe(refs.length);
});

test("un indirizzo inesistente porta alla pagina 404", async ({ page }) => {
  await fresh(page, "/nessuna-fermata");
  await expect(page.getByRole("heading", { name: "Questa fermata non esiste" })).toBeVisible();
});

for (const path of [
  "/",
  `/s/${first.id}`,
  "/concetti",
  "/metodo",
  "/viaggio",
  "/percorsi",
  "/percorso?f=1-6-11",
  `/aula/${first.id}`,
  `/aula/${first.id}?passo=4`,
]) {
  test(`nessuno scroll orizzontale su ${path}`, async ({ page }) => {
    await fresh(page, path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test("se una pagina non si carica compare il guasto sulla linea, e ricaricando si riparte", async ({
  page,
}) => {
  await fresh(page);
  await page.route(/\/assets\/Method-[^/]+\.js$/, (route) => route.abort());
  await page.getByRole("navigation").getByRole("link", { name: "Metodo" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Un guasto sulla linea" }),
  ).toBeVisible();
  await expect(page.getByRole("banner")).toBeVisible();
  await page.unrouteAll();
  await page.getByRole("button", { name: "Ricarica la pagina" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Da dove vengono gli scenari" }),
  ).toBeVisible();
});

test("le fermate sulla striscia della linea non si sovrappongono", async ({ page }) => {
  const byConcept = Map.groupBy(scenarios, (s) => s.concept);
  const longest = [...byConcept.values()].sort((a, b) => b.length - a.length)[0];
  await fresh(page, `/s/${longest[0].id}`);
  const links = page.getByRole("navigation", { name: "Fermate della linea" }).getByRole("link");
  await expect(links).toHaveCount(longest.length);
  const boxes = await links.evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, clipped: el.scrollWidth > el.clientWidth };
    }),
  );
  boxes.forEach((b, i) => {
    expect(b.clipped).toBe(false);
    if (i > 0) expect(b.left).toBeGreaterThanOrEqual(boxes[i - 1].right - 0.5);
  });
});

test("senza account nessuna pagina contatta Supabase, e la pagina di accesso esiste", async ({
  page,
}) => {
  const calls: string[] = [];
  page.on("request", (req) => {
    if (req.url().includes("supabase")) calls.push(req.url());
  });
  await fresh(page);
  for (const path of [`/s/${first.id}`, "/concetti", "/viaggio", "/metodo"]) {
    await page.goto(path);
  }
  expect(calls).toEqual([]);
  await page.goto("/accedi");
  await expect(page.getByRole("heading", { level: 1, name: "Accedi" })).toBeVisible();
});

test("l'informativa sulla privacy si apre dal piè di pagina e il profilo chiede l'accesso", async ({
  page,
}) => {
  await fresh(page);
  await page.getByRole("contentinfo").getByRole("link", { name: "Privacy" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Privacy" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Per quanto tempo" })).toBeVisible();
  await expect(page.getByText("privacy@anthropologyclash.app").first()).toBeVisible();
  await page.goto("/profilo");
  await expect(page.getByRole("heading", { level: 1, name: "Il tuo account" })).toBeVisible();
});

test.describe("tema", () => {
  test.use({ colorScheme: "dark" });

  test("senza una scelta salvata segue il tema scuro del sistema", async ({ page }) => {
    await fresh(page);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});
