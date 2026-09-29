import { expect, test, type Page } from "@playwright/test";
import { itineraries, scenarios } from "./content";

const first = scenarios[0];
const curated = itineraries[0];
const stepsOf = (s: (typeof scenarios)[number], level: "neofita" | "studente") =>
  3 + s.levels[level].choices.length + 1 + (s.discuss ? 1 : 0);

async function fresh(page: Page, path = "/") {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto(path);
}

const position = (page: Page) =>
  page.getByRole("navigation", { name: "Comandi della presentazione" }).locator("p");

test("la modalità aula si apre dallo scenario e svela una tappa alla volta", async ({ page }) => {
  const total = stepsOf(first, "neofita");
  const [choiceA] = first.levels.neofita.choices;

  await fresh(page, `/s/${first.id}`);
  await page.getByRole("link", { name: "Modalità aula" }).click();
  await expect(page).toHaveURL(`/aula/${first.id}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(first.title);
  await expect(page).toHaveTitle(new RegExp(`^Aula · ${first.title} · `));
  await expect(position(page)).toHaveText(`Passo 1 di ${total}`);
  await expect(page.getByRole("button", { name: "Indietro" })).toBeDisabled();

  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(`/aula/${first.id}?passo=2`);
  await expect(page.getByRole("heading", { name: "Sul campo" })).toBeVisible();
  await expect(page.getByText(first.levels.neofita.setup)).toBeVisible();

  await page.getByRole("button", { name: "Avanti" }).click();
  await expect(page.getByRole("heading", { name: "Quale uscita prendereste?" })).toBeVisible();
  await page.keyboard.press("PageDown");
  await expect(page.getByRole("heading", { name: "Uscita 1" })).toBeVisible();
  await expect(page.getByText(choiceA.text)).toBeVisible();
  await expect(page.getByText(first.levels.neofita.feedback[choiceA.id])).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Uscita 1" })).toBeVisible();

  await page.keyboard.press("End");
  await expect(position(page)).toHaveText(`Passo ${total} di ${total}`);
  await expect(page.getByRole("heading", { name: "Fonte" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Avanti" })).toBeDisabled();
  await page.keyboard.press("Home");
  await expect(position(page)).toHaveText(`Passo 1 di ${total}`);

  const completed = await page.evaluate(
    () => JSON.parse(localStorage.getItem("anthropology-clash.v1") ?? "{}").completed ?? {},
  );
  expect(Object.keys(completed)).toEqual([]);

  await page.getByRole("link", { name: "Esci dall'aula" }).click();
  await expect(page).toHaveURL(`/s/${first.id}`);
});

test("in aula il livello studente mostra tutte le sue uscite e le letture", async ({ page }) => {
  const total = stepsOf(first, "studente");
  await fresh(page, `/aula/${first.id}`);
  await page.getByRole("button", { name: "Studente" }).click();
  await expect(position(page)).toHaveText(`Passo 1 di ${total}`);
  await page.keyboard.press("End");
  await expect(page.getByRole("heading", { name: "Per approfondire" })).toBeVisible();
});

test("un percorso si porta in aula e passa da una fermata all'altra", async ({ page }) => {
  const [a, b] = curated.stops;
  const lastStop = curated.stops.at(-1)!;

  await fresh(page, `/percorso/${curated.id}`);
  await page.getByRole("link", { name: "In aula" }).click();
  await expect(page).toHaveURL(`/aula/${a}?percorso=${curated.id}`);
  await expect(position(page)).toHaveText(/^Passo 1 di/);
  await page.keyboard.press("End");
  await expect(page.getByRole("link", { name: "Prossima fermata" })).toHaveAttribute(
    "href",
    `/aula/${b}?percorso=${curated.id}`,
  );
  await page.getByRole("link", { name: "Prossima fermata" }).click();
  await expect(position(page)).toHaveText(/^Passo 1 di/);

  await page.goto(`/aula/${lastStop}?percorso=${curated.id}`);
  await expect(position(page)).toHaveText(/^Passo 1 di/);
  await page.keyboard.press("End");
  await expect(page.getByRole("link", { name: "Torna al percorso" })).toHaveAttribute(
    "href",
    `/percorso/${curated.id}`,
  );
});

test("un'aula per una fermata inesistente porta alla pagina 404", async ({ page }) => {
  await fresh(page, "/aula/scenario_999");
  await expect(page.getByRole("heading", { name: "Questa fermata non esiste" })).toBeVisible();
});
