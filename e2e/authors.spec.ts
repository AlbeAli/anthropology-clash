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

  const last = authors.filter((a) => a.born !== undefined).at(-1)!;
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

test("un'ancora nella stessa pagina non rifà l'animazione", async ({ page }) => {
  await fresh(page, "/autori");
  await expect(page.locator(".metro-wipe")).toHaveCount(0, { timeout: 5000 });
  const last = authors.filter((a) => a.born !== undefined).at(-1)!;
  await page.getByRole("link", { name: new RegExp(`^${last.name}, `) }).click();
  await expect(page.locator(".metro-wipe")).toHaveCount(0);
});

test("la legenda filtra per filone: restano le schede del filone, la linea del tempo attenua gli altri e Indietro torna a tutti", async ({
  page,
}) => {
  await fresh(page, "/autori");
  const school = "nordamericana";
  const inSchool = authors.filter((a) => a.school === school);
  const other = authors.find((a) => a.school !== school && a.born !== undefined)!;
  const button = page.getByRole("button", { name: "Antropologia nordamericana dopo Boas" });
  await expect(button).toHaveAttribute("aria-pressed", "false");

  await button.click();
  await expect(page).toHaveURL(`/autori?filone=${school}`);
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { level: 3 })).toHaveCount(inSchool.length);
  await expect(
    page.getByRole("heading", { level: 2, name: /Antropologia nordamericana/ }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: new RegExp(`^${other.name}, `) })).toHaveAttribute(
    "data-dim",
    "",
  );

  await page.getByRole("link", { name: new RegExp(`^${other.name}, `) }).click();
  await expect(page).toHaveURL(`/autori#${other.id}`);
  await expect(page.getByRole("heading", { level: 3, name: other.name })).toBeVisible();

  await page.goBack();
  await page.getByRole("button", { name: "Tutti i filoni" }).click();
  await expect(page).toHaveURL("/autori");
  await expect(page.getByRole("heading", { level: 3 })).toHaveCount(authors.length);
});

test("dal fondo di un filone si risale alla linea del tempo, dal link del filone e dal pulsante in basso", async ({
  page,
}) => {
  await fresh(page, "/autori");
  await expect(page.getByRole("link", { name: /Linea del tempo/ })).toHaveCount(0);
  await page
    .getByRole("link", { name: "Torna alla linea del tempo" })
    .last()
    .scrollIntoViewIfNeeded();
  await page.getByRole("link", { name: "Torna alla linea del tempo" }).last().click();
  await expect(page).toHaveURL("/autori#timeline-heading");
  await expect(page.getByRole("heading", { level: 2, name: "Linea del tempo" })).toBeInViewport();
  await expect(page.getByRole("heading", { level: 2, name: "Linea del tempo" })).toBeFocused();

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const up = page.getByRole("link", { name: "Linea del tempo", exact: true });
  await expect(up).toBeVisible();
  await up.click();
  await expect(page.getByRole("heading", { level: 2, name: "Linea del tempo" })).toBeInViewport();
});
