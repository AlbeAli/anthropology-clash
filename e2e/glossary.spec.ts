import { expect, test, type Page } from "@playwright/test";
import { glossary, scenarios } from "./content";

const scenario = scenarios.find((s) => s.glossary?.length)!;
const entry = glossary.find((e) => e.id === scenario.glossary![0])!;

async function fresh(page: Page, path = "/") {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto(path);
}

test("un termine del setup apre la sua nota di contesto, Esc la chiude e la nota porta al glossario", async ({
  page,
}) => {
  await fresh(page, `/s/${scenario.id}`);
  const term = page.getByRole("button", { name: entry.term, exact: true });
  await expect(term).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("button", { name: /apre una nota di contesto/ })).toHaveCount(0);
  await expect(term).toHaveAccessibleDescription("apre una nota di contesto");

  await term.click();
  const note = page.getByRole("complementary", { name: entry.term });
  await expect(term).toHaveAttribute("aria-expanded", "true");
  await expect(note).toContainText(entry.text);
  await expect(note).toContainText(entry.source[0]);

  await page.keyboard.press("Escape");
  await expect(note).toHaveCount(0);
  await expect(term).toBeFocused();

  await term.click();
  await note.getByRole("link", { name: /Tutte le voci nel glossario/ }).click();
  await expect(page).toHaveURL(`/glossario#${entry.id}`);
  await expect(page.getByRole("heading", { level: 1, name: "Glossario" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 3, name: entry.term })).toBeInViewport();
  await page.getByRole("link", { name: scenario.title }).first().click();
  await expect(page).toHaveURL(`/s/${scenario.id}`);
});

test("il glossario si apre dal piè di pagina e mostra tutte le voci con la fonte", async ({
  page,
}) => {
  await fresh(page);
  await page.getByRole("contentinfo").getByRole("link", { name: "Glossario" }).click();
  await expect(page).toHaveTitle(/^Glossario · /);
  await expect(page.getByRole("heading", { level: 3 })).toHaveCount(glossary.length);
  await expect(page.getByText(/^Font[ei]:$/)).toHaveCount(glossary.length);
});

test("sul telefono la nota sale dal basso, lascia visibile il termine e si chiude toccando fuori", async ({
  page,
}) => {
  test.skip((page.viewportSize()?.width ?? 1280) >= 640, "il pannello compare solo sotto i 640 px");
  await fresh(page, `/s/${scenario.id}`);
  const term = page.getByRole("button", { name: entry.term, exact: true });
  await term.click();
  const note = page.getByRole("complementary", { name: entry.term });
  await expect(note).toBeInViewport({ ratio: 1 });
  const termBox = (await term.boundingBox())!;
  const noteBox = (await note.boundingBox())!;
  expect(termBox.y + termBox.height).toBeLessThanOrEqual(noteBox.y);
  expect(noteBox.y + noteBox.height).toBeCloseTo(page.viewportSize()!.height, 0);

  await page.mouse.click(noteBox.x + 20, Math.max(termBox.y - 60, 120));
  await expect(note).toHaveCount(0);
  await expect(term).toHaveAttribute("aria-expanded", "false");
});
