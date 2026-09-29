import { expect, test } from "@playwright/test";
import { scenarios } from "./content";

test.use({ baseURL: "http://localhost:4174" });

test("senza configurazione di Supabase l'account e l'informativa non compaiono", async ({
  page,
}) => {
  const calls: string[] = [];
  page.on("request", (req) => {
    if (req.url().includes("supabase")) calls.push(req.url());
  });
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Accedi" })).toHaveCount(0);
  const footer = page.getByRole("contentinfo");
  await expect(footer).toContainText("Nessun account e nessun cookie");
  await expect(footer.getByRole("link", { name: "Privacy" })).toHaveCount(0);
  await page.goto("/metodo");
  await expect(page.getByText("L'app non ha account")).toBeVisible();
  await expect(page.getByRole("link", { name: "Leggi l'informativa sulla privacy" })).toHaveCount(
    0,
  );
  for (const path of ["/accedi", "/profilo", "/privacy"]) {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { level: 1, name: "Questa fermata non esiste" }),
    ).toBeVisible();
    await expect(page).toHaveTitle("Anthropology Clash");
  }
  await page.goto(`/s/${scenarios[0].id}`);
  expect(calls).toEqual([]);
});
