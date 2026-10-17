import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { scenarios } from "./content";
import { fresh } from "./helpers";

const first = scenarios[0];

async function complete(page: Page, id: string) {
  await page.goto(`/s/${id}`);
  await page.locator('[aria-labelledby="choices-heading"] button').first().click();
  await expect(page.getByRole("heading", { name: "Dove porta la tua uscita" })).toBeVisible();
}

async function openManage(page: Page) {
  await page.goto("/viaggio");
  await page.getByText("Gestisci i progressi").click();
}

test("salva i progressi in un file e li ripristina dopo l'azzeramento", async ({ page }) => {
  await fresh(page, "/");
  await complete(page, first.id);
  await openManage(page);

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Salva i progressi in un file" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(
    /^anthropology-clash-progressi-\d{4}-\d{2}-\d{2}\.json$/,
  );
  const saved = JSON.parse(readFileSync((await file.path())!, "utf8"));
  expect(Object.keys(saved.completed)).toEqual([first.id]);
  expect(saved).not.toHaveProperty("notes");

  await page.getByRole("button", { name: "Azzera i progressi" }).click();
  await page.getByRole("button", { name: "Conferma: azzera i progressi" }).click();
  await expect(page.getByRole("link", { name: first.title, exact: true })).toHaveCount(0);

  await page.locator('input[type="file"]').setInputFiles({
    name: "progressi.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(saved)),
  });
  await expect(
    page.getByRole("status").filter({ hasText: "Ripristinata 1 fermata" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: first.title, exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("link", { name: first.title, exact: true })).toBeVisible();
});

test("il ripristino è offerto anche senza fermate e rifiuta i file che non sono salvataggi", async ({
  page,
}) => {
  await fresh(page, "/viaggio");
  await page.getByText("Gestisci i progressi").click();
  await expect(page.getByRole("button", { name: "Salva i progressi in un file" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Ripristina da un file" })).toBeVisible();

  await page.locator('input[type="file"]').setInputFiles({
    name: "altro.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"kind":"altro"}'),
  });
  await expect(page.getByRole("status").filter({ hasText: "non è un salvataggio" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Parti dalla prima fermata/ })).toBeVisible();
});

test("ripristinare lo stesso file due volte non cambia nulla", async ({ page }) => {
  await fresh(page, "/");
  await complete(page, first.id);
  await openManage(page);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Salva i progressi in un file" }).click();
  const saved = readFileSync((await (await download).path())!);

  await page.locator('input[type="file"]').setInputFiles({
    name: "progressi.json",
    mimeType: "application/json",
    buffer: saved,
  });
  await expect(page.getByRole("status").filter({ hasText: "Nessuna fermata nuova" })).toBeVisible();
});
