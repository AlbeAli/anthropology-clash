import { expect, test, type Page } from "@playwright/test";
import { authors, scenarios } from "./content";

const { scenario, author } = scenarios
  .flatMap((scenario) => authors.map((author) => ({ scenario, author })))
  .find(({ scenario, author }) => scenario.levels.neofita.source.startsWith(`${author.surname},`))!;

async function fresh(page: Page, path = "/") {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto(path);
}

test("la pagina Autori mostra la linea del tempo e una scheda per autore", async ({ page }) => {
  await fresh(page, "/autori");
  await expect(page).toHaveTitle(/^Autori · /);
  await expect(page.getByRole("heading", { level: 2, name: "Linea del tempo" })).toBeVisible();
  for (const a of authors) {
    await expect(page.getByRole("heading", { level: 3, name: a.name })).toBeVisible();
  }
  await expect(page.getByText(/^Font[ei]:$/)).toHaveCount(authors.length);

  const last = authors.at(-1)!;
  await page.getByRole("link", { name: new RegExp(`^${last.name}, `) }).click();
  await expect(page).toHaveURL(`/autori#${last.id}`);
  await expect(page.getByRole("heading", { level: 3, name: last.name })).toBeInViewport();
  await expect(page.locator(`li#${last.id}`)).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
});

test("nella fonte di uno scenario il cognome porta alla scheda dell'autore", async ({ page }) => {
  await fresh(page, `/s/${scenario.id}`);
  await page.locator('[aria-labelledby="choices-heading"] button').first().click();
  const source = page.locator('[aria-labelledby="source-heading"]');
  await source.getByRole("link", { name: author.surname, exact: true }).click();
  await expect(page).toHaveURL(`/autori#${author.id}`);
  await expect(page.getByRole("heading", { level: 3, name: author.name })).toBeInViewport();
  await page.getByRole("link", { name: scenario.title }).first().click();
  await expect(page).toHaveURL(`/s/${scenario.id}`);
});

test("la pagina Autori si apre dal piè di pagina e, sul telefono, dal menu Altro", async ({
  page,
}) => {
  await fresh(page);
  const width = page.viewportSize()?.width ?? 1280;
  if (width < 768) {
    const nav = page.getByRole("navigation", { name: "Navigazione" });
    await nav.getByRole("button", { name: "Altro" }).click();
    await nav.getByRole("link", { name: "Autori" }).click();
  } else {
    await page.getByRole("contentinfo").getByRole("link", { name: "Autori" }).click();
  }
  await expect(page).toHaveURL("/autori");
  await expect(page.getByRole("heading", { level: 1, name: "Autori" })).toBeVisible();
});

test("la legenda porta al filone e un'ancora nella stessa pagina non rifà l'animazione", async ({
  page,
}) => {
  await fresh(page, "/autori");
  await expect(page.locator(".metro-wipe")).toHaveCount(0, { timeout: 5000 });
  const link = page.getByRole("link", { name: "Antropologia nordamericana dopo Boas" }).first();
  await link.click();
  await expect(page).toHaveURL("/autori#school-nordamericana");
  await expect(page.locator("#school-nordamericana")).toBeInViewport();
  await expect(page.locator(".metro-wipe")).toHaveCount(0);
  const last = authors.at(-1)!;
  await page.getByRole("link", { name: new RegExp(`^${last.name}, `) }).click();
  await expect(page.locator(".metro-wipe")).toHaveCount(0);
});
