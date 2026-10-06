import { expect, test, type Page } from "@playwright/test";
import { itineraries, scenarios } from "./content";

const curated = itineraries[0];
const titleOf = (id: string) => scenarios.find((s) => s.id === id)!.title;
const numberOf = (id: string) => String(Number(id.slice("scenario_".length)));

async function fresh(page: Page, path = "/") {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto(path);
}

async function choose(page: Page) {
  await page.locator('[aria-labelledby="choices-heading"] button').first().click();
  await expect(page.getByRole("heading", { name: "Dove porta la tua uscita" })).toBeVisible();
}

test("un percorso curato si apre dalla barra e guida da una fermata all'altra fino al capolinea", async ({
  page,
}) => {
  const [firstStop, secondStop] = curated.stops;
  const lastStop = curated.stops.at(-1)!;
  const total = curated.stops.length;

  await fresh(page);
  const nav = page.getByRole("navigation", { name: "Navigazione" });
  if ((page.viewportSize()?.width ?? 1280) < 640) {
    await nav.getByRole("button", { name: "Altro" }).click();
  }
  await nav.getByRole("link", { name: "Percorsi" }).click();
  await page.getByRole("link", { name: curated.title }).click();
  await expect(page).toHaveURL(`/percorso/${curated.id}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(curated.title);
  await expect(page).toHaveTitle(new RegExp(`^${curated.title} · `));
  await expect(page.locator(".metro-stop a")).toHaveText(
    curated.stops.map((id, i) => `${i + 1}. ${titleOf(id)}`),
  );

  await page.getByRole("link", { name: "Parti" }).click();
  await expect(page).toHaveURL(`/s/${firstStop}?percorso=${curated.id}`);
  await expect(page.getByRole("link", { name: new RegExp(`fermata 1 di ${total}`) })).toBeVisible();
  await choose(page);
  await expect(page.getByText(`Prossima fermata del percorso · 2 di ${total}`)).toBeVisible();
  await expect(page.getByRole("link", { name: "Prosegui" })).toHaveAttribute(
    "href",
    `/s/${secondStop}?percorso=${curated.id}`,
  );

  await page.goto(`/s/${lastStop}?percorso=${curated.id}`);
  await choose(page);
  await expect(page.getByText(`Fine del percorso · ${total} fermate`)).toBeVisible();
  await page.getByRole("link", { name: "Torna al percorso" }).click();
  await expect(page).toHaveURL(`/percorso/${curated.id}`);
  await expect(page.getByText(`2 fermate visitate su ${total}`)).toBeVisible();
  await expect(page.getByRole("link", { name: "Continua" })).toHaveAttribute(
    "href",
    `/s/${secondStop}?percorso=${curated.id}`,
  );
});

test("il percorso su misura si compone scegliendo le fermate e vive nel link", async ({ page }) => {
  const [a, b, c] = [scenarios[10], scenarios[2], scenarios[6]];
  await fresh(page, "/percorsi");
  await expect(page.getByText("Nessuna fermata scelta.")).toBeVisible();

  await page.getByRole("button", { name: a.title, exact: true }).click();
  await expect(page.getByText("Scegli almeno un'altra fermata.")).toBeVisible();
  await page.getByRole("button", { name: b.title, exact: true }).click();
  await page.getByRole("button", { name: c.title, exact: true }).click();
  await expect(page.getByRole("button", { name: a.title, exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const f = [a, b, c].map((s) => numberOf(s.id)).join("-");
  await expect(page).toHaveURL(`/percorsi?f=${f}`);

  await page.reload();
  await page.getByRole("button", { name: `Togli ${b.title}` }).click();
  const f2 = [a, c].map((s) => numberOf(s.id)).join("-");
  await expect(page.getByRole("link", { name: "Apri il percorso" })).toHaveAttribute(
    "href",
    `/percorso?f=${f2}`,
  );

  await page.getByRole("link", { name: "Apri il percorso" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Percorso su misura");
  await expect(page.locator(".metro-stop a")).toHaveText([`1. ${a.title}`, `2. ${c.title}`]);
  await page.getByRole("link", { name: "Parti" }).click();
  await expect(page).toHaveURL(`/s/${a.id}?f=${f2}`);
  await choose(page);
  await expect(page.getByRole("link", { name: "Prosegui" })).toHaveAttribute(
    "href",
    `/s/${c.id}?f=${f2}`,
  );
});

test("un link con fermate inesistenti le scarta e lo dice; senza due fermate valide non parte", async ({
  page,
}) => {
  await fresh(page, "/percorso?f=1-2-999");
  await expect(
    page.getByText("Una fermata del link non esiste e non compare nel percorso."),
  ).toBeVisible();
  await expect(page.locator(".metro-stop")).toHaveCount(2);

  await page.goto("/percorso?f=1-999");
  await expect(page.getByText("Questo link non contiene almeno due fermate valide.")).toBeVisible();
  await page.getByRole("link", { name: "Componi un percorso" }).click();
  await expect(page.getByRole("heading", { name: "Componi il tuo percorso" })).toBeVisible();

  await page.goto("/percorso/percorso-inesistente");
  await expect(page.getByRole("heading", { name: "Questa fermata non esiste" })).toBeVisible();
});

test("fuori da un percorso lo scenario non mostra il cartello del percorso", async ({ page }) => {
  await fresh(page, `/s/${curated.stops[0]}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Percorso/ })).toHaveCount(0);
});
