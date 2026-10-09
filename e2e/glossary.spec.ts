import { expect, test, type Page } from "@playwright/test";
import { glossary, scenarios } from "./content";

const { scenario, entry } = scenarios
  .flatMap((scenario) =>
    (scenario.glossary ?? []).map((id) => ({
      scenario,
      entry: glossary.find((e) => e.id === id)!,
    })),
  )
  .find(({ scenario, entry }) => scenario.levels.neofita.setup.includes(entry.term))!;

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
  await expect(page.locator(`li#${entry.id}`)).not.toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  await page.getByRole("link", { name: scenario.title }).first().click();
  await expect(page).toHaveURL(`/s/${scenario.id}`);
});

test("il glossario si apre dal piè di pagina e, sul telefono, dal menu Altro e mostra tutte le voci con la fonte", async ({
  page,
}) => {
  await fresh(page);
  if ((page.viewportSize()?.width ?? 1280) < 640) {
    const nav = page.getByRole("navigation", { name: "Navigazione" });
    await nav.getByRole("button", { name: "Altro" }).click();
    await nav.getByRole("link", { name: "Glossario" }).click();
  } else {
    await page.getByRole("contentinfo").getByRole("link", { name: "Glossario" }).click();
  }
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

const fresher = scenarios
  .flatMap((scenario) =>
    (scenario.glossary ?? []).flatMap((id) => {
      const entry = glossary.find((e) => e.id === id)!;
      const level = scenario.levels.neofita;
      const choice = level.choices.findIndex((c) => level.feedback[c.id].includes(entry.term));
      return !level.setup.includes(entry.term) && choice >= 0 ? [{ scenario, entry, choice }] : [];
    }),
  )
  .at(0)!;

test("un termine che il setup non contiene si apre dal riscontro", async ({ page }) => {
  await fresh(page, `/s/${fresher.scenario.id}`);
  await page.locator('[aria-labelledby="choices-heading"] button').nth(fresher.choice).click();
  const term = page.getByRole("button", { name: fresher.entry.term, exact: true });
  await expect(term).toHaveCount(1);
  await term.click();
  await expect(page.getByRole("complementary", { name: fresher.entry.term })).toContainText(
    fresher.entry.text,
  );
});

const withNotes = scenarios.find((s) => (s.glossary ?? []).length > 1)!;
const notes = withNotes.glossary!.map((id) => glossary.find((e) => e.id === id)!);

test("la scheda stampabile riporta le note di contesto con le fonti", async ({ page }) => {
  await fresh(page, `/scheda/${withNotes.id}`);
  await expect(page.getByRole("heading", { level: 2, name: "Note di contesto" })).toBeVisible();
  for (const e of notes) {
    await expect(page.getByText(e.text, { exact: true })).toBeVisible();
  }
});

test("in aula le note di contesto si aprono dal pulsante sulla diapositiva del setup", async ({
  page,
}) => {
  await fresh(page, `/aula/${withNotes.id}?passo=2`);
  const button = page.getByRole("button", { name: `Note di contesto (${notes.length})` });
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByText(notes[0].text, { exact: true })).toHaveCount(0);
  await button.click();
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText(notes[0].text, { exact: true })).toBeVisible();
});
