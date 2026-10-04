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

const lineOf = (concept: string) => scenarios.filter((s) => s.concept === concept);

test("Le linee: si apre la linea di «sei qui», le altre si aprono a richiesta", async ({
  page,
}) => {
  await fresh(page);
  await expect(page.locator(".metro-stop:visible")).toHaveCount(lineOf(first.concept).length);
  await page.locator(`#linea-${last.concept} summary`).click();
  await expect(page.locator(".metro-stop:visible")).toHaveCount(
    lineOf(first.concept).length + lineOf(last.concept).length,
  );
  await page.getByRole("link", { name: last.title, exact: true }).click();
  await expect(page).toHaveURL(`/s/${last.id}`);
});

test("sul telefono toccare una linea della miniatura apre le sue fermate", async ({ page }) => {
  test.skip(!isPhone(page), "la miniatura compare solo sotto i 768 px");
  await fresh(page);
  await expect(
    page.getByRole("navigation", { name: "La rete: tutte le linee partono da Oggi" }),
  ).toBeHidden();
  await page
    .getByTestId("net-mini")
    .locator(`.net-line[style*="--l-${last.concept}"] .net-term`)
    .click();
  await expect(page.locator(`#linea-${last.concept}`)).toHaveAttribute("open");
  await expect(page.locator(`#linea-${first.concept}`)).not.toHaveAttribute("open");
  await expect(page.locator(".metro-stop:visible")).toHaveCount(lineOf(last.concept).length);
  await expect(page.locator(`#linea-${last.concept} summary`)).toBeInViewport();
});

test("un interscambio si legge sulla rete, nelle colonne e sul cartello dello scenario", async ({
  page,
}) => {
  const change = scenarios.find((s) => s.also?.length)!;
  const names: Record<string, string> = {
    reciprocita: "Dono",
    parentela: "Parentela",
    rituale: "Rituale",
    relativismo: "Relativismo",
    consumo: "Consumo",
  };
  const lines = change.also!.map((c) => names[c]).join(", ");
  await fresh(page);
  if (!isPhone(page)) {
    const net = page.getByRole("navigation", { name: "La rete: tutte le linee partono da Oggi" });
    await expect(
      net.getByRole("link", { name: new RegExp(`${change.title}.*cambio per la linea ${lines}`) }),
    ).toBeVisible();
  }
  await page.locator(`#linea-${change.concept} summary`).click();
  await page
    .locator(".metro-stop")
    .getByRole("link", { name: new RegExp(`${change.title}.*cambio per la linea ${lines}`) })
    .click();
  await expect(page).toHaveURL(`/s/${change.id}`);
  await expect(page.getByText(`Interscambio: cambio per la linea ${lines}`)).toBeVisible();
});

test("la fermata del giorno si apre e si condivide con il link dello scenario", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as unknown as { shared: unknown[] }).shared = [];
    navigator.share = async (data) => {
      (window as unknown as { shared: unknown[] }).shared.push(data);
    };
  });
  await fresh(page);
  const band = page.getByRole("region", { name: /Fermata del giorno/ });
  const open = band.getByRole("link", { name: "Apri la fermata" });
  const href = await open.getAttribute("href");
  expect(href).toMatch(/^\/s\/scenario_\d+$/);
  await band.getByRole("button", { name: "Condividi" }).click();
  const shared = await page.evaluate(
    () => (window as unknown as { shared: { url: string; title: string }[] }).shared,
  );
  expect(shared).toHaveLength(1);
  expect(shared[0].url).toBe(`${new URL(page.url()).origin}${href}`);
  expect(shared[0].title).not.toBe("");
  await open.click();
  await expect(page).toHaveURL(href!);
});

test("con il movimento ridotto le fermate sono visibili subito", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await fresh(page);
  await page.waitForTimeout(150);
  const hidden = await page.evaluate(
    () =>
      [...document.querySelectorAll(".net-stop, .net-term, .metro-stop")].filter(
        (el) => el.getClientRects().length > 0 && Number(getComputedStyle(el).opacity) < 1,
      ).length,
  );
  expect(hidden).toBe(0);
});

test("proiettata a 1280×720 la rete mostra lo snodo Oggi nella prima schermata", async ({
  page,
}) => {
  test.skip(isPhone(page), "la rete intera compare da 768 px");
  await page.setViewportSize({ width: 1280, height: 720 });
  await fresh(page);
  const net = page.getByRole("navigation", { name: "La rete: tutte le linee partono da Oggi" });
  await expect(net.locator(".net-hub")).toBeInViewport({ ratio: 1 });
});
