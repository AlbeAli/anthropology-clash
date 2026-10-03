import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { scenarios } from "./content";

const first = scenarios[0];
const note = "Il tempo tra un dono e l'altro fa parte del legame: appunto di prova.";

async function fresh(page: Page, path = "/") {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto(path);
}

async function visit(page: Page, id: string) {
  await page.goto(`/s/${id}`);
  await page.locator('[aria-labelledby="choices-heading"] button').first().click();
  await expect(page.getByRole("heading", { name: "Dove porta la tua uscita" })).toBeVisible();
}

test("dallo scenario si scrive nel diario, l'appunto resta e si scarica", async ({ page }) => {
  await fresh(page);
  await visit(page, first.id);
  await page.getByRole("link", { name: "Scrivi nel diario" }).click();
  await expect(page).toHaveURL(`/diario#${first.id}`);
  const area = page.getByLabel(`Appunto su «${first.title}»`);
  await expect(area).toBeFocused();
  await expect(
    page.getByText(`La tua uscita: ${first.levels.neofita.choices[0].text}`),
  ).toBeVisible();
  await area.fill(note);
  await expect(page.getByText("Salvato in questo browser")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel(`Appunto su «${first.title}»`)).toHaveValue(note);

  await page.getByText("Spunti: le domande per la discussione").click();
  await page.getByRole("button", { name: first.discuss![0] }).click();
  await expect(page.getByLabel(`Appunto su «${first.title}»`)).toHaveValue(
    `${first.discuss![0]}\n\n${note}`,
  );

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Scarica il diario" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^diario-di-campo-\d{4}-\d{2}-\d{2}\.txt$/);
  const text = readFileSync((await download.path())!, "utf8");
  expect(text).toContain(first.title);
  expect(text).toContain(note);
  expect(text).toContain(`La tua uscita: ${first.levels.neofita.choices[0].text}`);
});

test("azzerare i progressi lascia il diario, salvo scelta; il diario si cancella a parte", async ({
  page,
}) => {
  await fresh(page);
  await visit(page, first.id);
  await page.goto(`/diario#${first.id}`);
  await page.getByLabel(`Appunto su «${first.title}»`).fill(note);
  await expect(page.getByText("Salvato in questo browser")).toBeVisible();

  await page.goto("/viaggio");
  await page.getByText("Gestisci i progressi").click();
  await page.getByRole("button", { name: "Azzera i progressi" }).click();
  await expect(page.getByLabel("Cancella anche il diario")).not.toBeChecked();
  await page.getByRole("button", { name: "Conferma: azzera i progressi" }).click();

  await page.goto("/diario");
  await expect(page.getByText("non più tra le fermate visitate")).toBeVisible();
  await expect(page.getByLabel(`Appunto su «${first.title}»`)).toHaveValue(note);

  await page.getByRole("button", { name: "Cancella il diario" }).click();
  await page.getByRole("button", { name: "Conferma: cancella tutti gli appunti" }).click();
  await expect(page.getByText("Diario cancellato")).toBeVisible();
  await expect(page.getByLabel(`Appunto su «${first.title}»`)).toHaveCount(0);
  await expect(page.getByText("Il diario si riempie con le fermate visitate")).toBeVisible();
});

test("l'aula e la scheda non mostrano il diario", async ({ page }) => {
  await fresh(page);
  await visit(page, first.id);
  await page.goto(`/diario#${first.id}`);
  await page.getByLabel(`Appunto su «${first.title}»`).fill(note);
  await expect(page.getByText("Salvato in questo browser")).toBeVisible();
  for (const path of [`/aula/${first.id}`, `/scheda/${first.id}`]) {
    await page.goto(path);
    await expect(page.locator("main")).toContainText(first.title);
    await expect(page.getByText(note)).toHaveCount(0);
  }
});
