import { expect, test } from "@playwright/test";
import { scenarios } from "./content";

const first = scenarios[0];

test("la scheda si apre dallo scenario, mostra tutto il contenuto e si stampa senza la barra", async ({
  page,
}) => {
  await page.goto(`/s/${first.id}`);
  await page.getByRole("link", { name: "Scheda stampabile" }).click();
  await expect(page).toHaveURL(`/scheda/${first.id}`);
  await expect(page).toHaveTitle(new RegExp(`^Scheda · ${first.title} · `));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(first.title);
  await expect(page.getByText(first.levels.neofita.setup)).toBeVisible();
  for (const c of first.levels.neofita.choices) {
    await expect(page.getByText(first.levels.neofita.feedback[c.id])).toBeVisible();
  }
  await page.getByRole("button", { name: "Studente" }).click();
  await expect(page.getByText(first.levels.studente.setup)).toBeVisible();

  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("banner")).toBeHidden();
  await expect(page.getByRole("contentinfo")).toBeHidden();
  await expect(page.getByRole("button", { name: "Stampa la scheda" })).toBeHidden();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("una scheda per una fermata inesistente porta alla pagina 404", async ({ page }) => {
  await page.goto("/scheda/scenario_999");
  await expect(page.getByRole("heading", { name: "Questa fermata non esiste" })).toBeVisible();
});
