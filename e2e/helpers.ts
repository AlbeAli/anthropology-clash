import type { Page } from "@playwright/test";

export async function fresh(page: Page, path = "/") {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto(path);
}

export const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1280) < 768;
