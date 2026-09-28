import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:4173",
    reducedMotion: "reduce",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    { name: "telefono", use: { ...devices["Pixel 5"] } },
  ],
  webServer: {
    command: "pnpm build && pnpm preview --port 4173 --strictPort",
    url: "http://localhost:4173",
    env: {
      VITE_SUPABASE_URL: "https://e2e.supabase.test",
      VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_e2e",
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
