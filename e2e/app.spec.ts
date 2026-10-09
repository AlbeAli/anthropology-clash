import { expect, test, type Page } from "@playwright/test";
import { lineCount, scenarios } from "./content";

const first = scenarios[0];

async function fresh(page: Page, path = "/") {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto(path);
}

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1280) < 640;

async function openFromBar(page: Page, name: string) {
  const nav = page.getByRole("navigation", { name: "Navigazione" });
  if (isPhone(page)) await nav.getByRole("button", { name: "Altro" }).click();
  await nav.getByRole("link", { name }).click();
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

test("sul telefono la barra sta su due righe e Concetti, Percorsi, Metodo, Glossario e Autori sono nel menu Altro", async ({
  page,
}) => {
  test.skip(!isPhone(page), "il menu Altro compare solo sotto i 640 px");
  await fresh(page);
  const nav = page.getByRole("navigation", { name: "Navigazione" });
  const more = nav.getByRole("button", { name: "Altro" });
  await expect(nav.getByRole("link")).toHaveText([/^Viaggio/, "Diario"], { useInnerText: true });
  expect((await page.getByRole("banner").boundingBox())!.height).toBeLessThan(130);

  await more.click();
  await expect(more).toHaveAttribute("aria-expanded", "true");
  await expect(nav.getByRole("link")).toHaveText(
    [/^Viaggio/, "Diario", "Concetti", "Percorsi", "Metodo", "Glossario", "Autori"],
    {
      useInnerText: true,
    },
  );
  await page.keyboard.press("Escape");
  await expect(more).toHaveAttribute("aria-expanded", "false");
  await expect(more).toBeFocused();

  await more.click();
  await page.getByRole("heading", { level: 1 }).click();
  await expect(more).toHaveAttribute("aria-expanded", "false");

  await more.click();
  await nav.getByRole("link", { name: "Percorsi" }).click();
  await expect(page).toHaveURL("/percorsi");
  await expect(more).toHaveAttribute("aria-expanded", "false");
  await expect(nav.getByRole("link", { name: "Percorsi" })).toBeHidden();
});

test("sul telefono il tabellone ha solo la prossima partenza e la fermata del giorno scende sotto la rete", async ({
  page,
}) => {
  await fresh(page);
  const daily = page.getByRole("region", { name: /^Fermata del giorno/ });
  const title = page.getByRole("heading", { level: 1 });
  await expect(daily).toHaveCount(1);
  await expect(page.getByRole("link", { name: /Parti/ })).toBeVisible();
  const dailyTop = (await daily.boundingBox())!.y;
  const titleTop = (await title.boundingBox())!.y;
  if (isPhone(page)) {
    await expect(title).toBeInViewport();
    const net = (await page.getByTestId("net-mini").boundingBox())!;
    expect(dailyTop).toBeGreaterThan(net.y + net.height);
  } else {
    expect(dailyTop).toBeLessThan(titleTop);
  }
});

test("da 640 px la barra mostra tutte le voci e nessun menu Altro", async ({ page }) => {
  test.skip(isPhone(page), "sotto i 640 px le voci stanno nel menu Altro");
  await fresh(page);
  const nav = page.getByRole("navigation", { name: "Navigazione" });
  await expect(nav.getByRole("link")).toHaveText(
    ["Concetti", "Percorsi", /^Il tuo viaggio/, "Diario", "Metodo", "Glossario", "Autori"],
    { useInnerText: true },
  );
  await expect(nav.getByRole("button", { name: "Altro" })).toBeHidden();
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
  await page.getByText("Gestisci i progressi").click();
  await page.getByRole("button", { name: "Azzera i progressi" }).click();
  await page.getByRole("button", { name: "Conferma: azzera i progressi" }).click();
  await expect(page.getByRole("link", { name: first.title, exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Parti dalla prima fermata/ })).toBeVisible();
});

test("il viaggio timbra le linee toccate e segna il capolinea con tutte le fermate", async ({
  page,
}) => {
  const line = scenarios.filter((s) => s.concept === first.concept);
  const other = scenarios.find((s) => s.concept !== first.concept)!;
  const completed = Object.fromEntries(
    [...line, other].map((s, i) => [
      s.id,
      { level: "neofita", choice: "a", at: `2026-10-0${i + 1}` },
    ]),
  );
  await page.goto("/");
  await page.evaluate((c) => {
    localStorage.setItem(
      "anthropology-clash.v1",
      JSON.stringify({
        version: 1,
        lang: "it",
        level: "neofita",
        completed: c,
        streak: { count: 0, lastDay: null },
        seenConcepts: [],
      }),
    );
  }, completed);
  await page.goto("/viaggio");
  const stamps = page.getByRole("img", { name: /linea toccata|capolinea raggiunto/ });
  await expect(stamps).toHaveCount(2);
  await expect(page.getByRole("img", { name: /capolinea raggiunto il/ })).toHaveCount(1);
  await expect(page.getByRole("img", { name: /linea toccata il/ })).toHaveCount(1);
  await expect(page.getByText("non ancora percorsa")).toHaveCount(3);
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
  "/glossario",
  "/autori",
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
  await openFromBar(page, "Metodo");
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

test("tra 1024 e 1279 px la barra sta su una riga e Glossario e Autori sono nel menu Altro", async ({
  page,
}) => {
  test.skip(isPhone(page), "il caso intermedio si prova solo con la finestra da desktop");
  await page.setViewportSize({ width: 1100, height: 800 });
  await fresh(page);
  const nav = page.getByRole("navigation", { name: "Navigazione" });
  const more = nav.getByRole("button", { name: "Altro" });
  await expect(nav.getByRole("link")).toHaveText(
    ["Concetti", "Percorsi", /^Il tuo viaggio/, "Diario", "Metodo"],
    { useInnerText: true },
  );
  expect((await page.getByRole("banner").boundingBox())!.height).toBeLessThan(80);
  await more.click();
  await expect(nav.getByRole("link")).toHaveText(
    ["Concetti", "Percorsi", /^Il tuo viaggio/, "Diario", "Metodo", "Glossario", "Autori"],
    { useInnerText: true },
  );
});
