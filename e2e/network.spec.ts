import { expect, test, type Page } from "@playwright/test";
import { scenarios } from "./content";

const first = scenarios[0];
const last = scenarios.at(-1)!;

async function fresh(page: Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/");
}

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1280) < 768;

test("la rete apre la Home: tutte le fermate partono da Oggi e portano allo scenario", async ({
  page,
}) => {
  test.skip(isPhone(page), "sotto i 768 px la rete è in miniatura");
  await fresh(page);
  const net = page.getByRole("navigation", { name: "La rete: tutte le linee partono da Oggi" });
  await expect(net.getByRole("link")).toHaveCount(scenarios.length);
  await expect(
    net.getByRole("link", { name: new RegExp(`${first.title}.*sei qui`) }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Parti/ })).toHaveAttribute("href", `/s/${first.id}`);
  const stop = net.getByRole("link", { name: new RegExp(last.title) });
  await stop.hover();
  await expect(net.getByText(last.title, { exact: false }).last()).toBeVisible();
  await stop.click();
  await expect(page).toHaveURL(`/s/${last.id}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(last.title);
});

test("sul telefono la rete in miniatura isola una linea e l'elenco resta sotto", async ({
  page,
}) => {
  test.skip(!isPhone(page), "la miniatura compare solo sotto i 768 px");
  await fresh(page);
  await expect(
    page.getByRole("navigation", { name: "La rete: tutte le linee partono da Oggi" }),
  ).toBeHidden();
  const mini = page.getByRole("button", { name: /La rete in miniatura/ });
  await expect(page.locator(".metro-stop:visible")).toHaveCount(scenarios.length);
  await mini.click();
  await expect(mini).toHaveAccessibleName(/Linea isolata: Dono/);
  const line = scenarios.filter((s) => s.concept === first.concept);
  await expect(page.locator(".metro-stop:visible")).toHaveCount(line.length);
});

test("«Continua» porta dalla rete alle linee", async ({ page }) => {
  await fresh(page);
  await page.getByRole("link", { name: "Continua" }).click();
  await expect(page.getByRole("group", { name: "Isola una linea sulla mappa" })).toBeInViewport();
});
