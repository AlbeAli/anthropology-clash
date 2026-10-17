import { expect, test, type Page } from "@playwright/test";
import { scenarios } from "./content";
import { fresh } from "./helpers";

const first = scenarios[0];

async function goClient(page: Page, path: string) {
  await page.evaluate((p) => {
    history.pushState({}, "", p);
    dispatchEvent(new PopStateEvent("popstate"));
  }, path);
}

test("al caricamento il focus non viene spostato", async ({ page }) => {
  await fresh(page, "/metodo");
  await expect(page.locator("#main-content")).not.toBeFocused();
  await expect(page.locator("#route-announcer")).toHaveText("");
});

test("al cambio pagina il focus passa al contenuto e il titolo viene annunciato", async ({
  page,
}) => {
  await fresh(page, "/");
  await goClient(page, "/metodo");
  await expect(page.locator("#main-content")).toBeFocused();
  await expect(page.locator("#route-announcer")).toHaveText(await page.title());
  await goClient(page, `/s/${first.id}`);
  await expect(page.locator("#route-announcer")).toContainText(first.title);
});

test("una pagina che porta il focus su un suo campo lo mantiene", async ({ page }) => {
  await fresh(page, `/s/${first.id}`);
  await page.locator('[aria-labelledby="choices-heading"] button').first().click();
  await expect(page.getByRole("heading", { name: "Dove porta la tua uscita" })).toBeVisible();
  await goClient(page, `/diario#${first.id}`);
  await expect(page.locator("textarea").first()).toBeFocused();
  await expect(page.locator("#main-content")).not.toBeFocused();
});
