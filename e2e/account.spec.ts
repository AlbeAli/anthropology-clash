import { expect, test, type Page, type Route } from "@playwright/test";
import { scenarios } from "./content";

const HOST = "https://e2e.supabase.test";
const USER_ID = "00000000-0000-4000-8000-000000000001";
const local = scenarios[0];
const remoteOnly = scenarios[9];

type Call = { method: string; path: string; body: unknown };
type Remote = {
  progress?: object[];
  google?: boolean;
  failDelete?: boolean;
};

const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");

function fakeSession() {
  const exp = Math.floor(Date.now() / 1000) + 24 * 3600;
  const user = {
    id: USER_ID,
    aud: "authenticated",
    role: "authenticated",
    email: "prova@example.org",
    app_metadata: { provider: "email" },
    user_metadata: {},
  };
  return JSON.stringify({
    access_token: `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: USER_ID, role: "authenticated", exp })}.firma`,
    refresh_token: "refresh-e2e",
    token_type: "bearer",
    expires_in: 24 * 3600,
    expires_at: exp,
    user,
  });
}

async function mockSupabase(page: Page, remote: Remote = {}): Promise<Call[]> {
  const calls: Call[] = [];
  await page.route(`${HOST}/**`, async (route: Route) => {
    const req = route.request();
    const url = new URL(req.url());
    const method = req.method();
    const headers = {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
    };
    const reply = (status: number, data?: unknown) =>
      route.fulfill({
        status,
        headers,
        contentType: "application/json",
        body: data === undefined ? "" : JSON.stringify(data),
      });
    if (method === "OPTIONS") return reply(200, {});
    const raw = req.postData();
    let body: unknown = raw;
    try {
      body = raw ? JSON.parse(raw) : null;
    } catch {
      body = raw;
    }
    calls.push({ method, path: url.pathname, body });

    if (url.pathname === "/auth/v1/settings") {
      return reply(200, { external: { email: true, google: remote.google === true } });
    }
    if (url.pathname === "/auth/v1/otp") return reply(200, {});
    if (url.pathname === "/auth/v1/logout") return reply(204);
    if (url.pathname === "/functions/v1/delete-account") return reply(200, { deleted: true });
    if (url.pathname === "/rest/v1/progress" && method === "GET") {
      return reply(200, remote.progress ?? []);
    }
    if (url.pathname === "/rest/v1/streaks" && method === "GET") return reply(200, []);
    if (url.pathname.startsWith("/rest/v1/") && method === "DELETE") {
      return remote.failDelete ? reply(500, { message: "errore di prova" }) : reply(204);
    }
    if (url.pathname.startsWith("/rest/v1/")) return reply(201);
    return reply(404, {});
  });
  return calls;
}

async function signedIn(page: Page) {
  const state = {
    version: 1,
    lang: "it",
    level: null,
    completed: { [local.id]: { level: "neofita", choice: "a", at: "2026-09-20" } },
    streak: { count: 1, lastDay: "2026-09-20" },
    seenConcepts: [local.concept],
  };
  await page.addInitScript(
    ([session, progress]) => {
      localStorage.setItem("anthropology-clash.auth", session);
      if (!localStorage.getItem("anthropology-clash.v1")) {
        localStorage.setItem("anthropology-clash.v1", progress);
      }
    },
    [fakeSession(), JSON.stringify(state)],
  );
}

const remoteRow = {
  user_id: USER_ID,
  scenario_id: remoteOnly.id,
  level: "neofita",
  choice: "a",
  completed_on: "2026-09-15",
};

test("il link via email parte e Google resta nascosto finché non è attivo", async ({ page }) => {
  const calls = await mockSupabase(page);
  await page.goto("/accedi");
  await page.getByLabel("La tua email").fill("prova@example.org");
  await page.getByRole("button", { name: "Mandami il link" }).click();
  await expect(page.getByText("Controlla la posta")).toBeVisible();
  const otp = calls.find((c) => c.path === "/auth/v1/otp");
  expect((otp?.body as { email?: string }).email).toBe("prova@example.org");
  await expect(page.getByRole("button", { name: "Continua con Google" })).toHaveCount(0);
});

test("il pulsante Google compare quando il provider è attivo", async ({ page }) => {
  await mockSupabase(page, { google: true });
  await page.goto("/accedi");
  await expect(page.getByRole("button", { name: "Continua con Google" })).toBeVisible();
});

test("con l'account le fermate locali e remote si uniscono e vengono inviate", async ({ page }) => {
  const calls = await mockSupabase(page, { progress: [remoteRow] });
  await signedIn(page);
  await page.goto("/viaggio");
  await expect(page.getByRole("link", { name: local.title })).toBeVisible();
  await expect(page.getByRole("link", { name: remoteOnly.title })).toBeVisible();
  await expect
    .poll(() => {
      const push = calls.find((c) => c.path === "/rest/v1/progress" && c.method === "POST");
      return (push?.body as { scenario_id: string }[] | undefined)
        ?.map((r) => r.scenario_id)
        .sort();
    })
    .toEqual([local.id, remoteOnly.id].sort());
  await page.goto("/profilo");
  await expect(page.getByText("Fermate sincronizzate con il tuo account")).toBeVisible();
  await expect(page.getByText("Accesso con link via email")).toBeVisible();
});

test("azzerare i progressi con l'account cancella anche le righe remote", async ({ page }) => {
  const calls = await mockSupabase(page);
  await signedIn(page);
  await page.goto("/viaggio");
  await page.getByText("Gestisci i progressi").click();
  await page.getByRole("button", { name: "Azzera i progressi" }).click();
  await page.getByRole("button", { name: "Conferma: azzera i progressi" }).click();
  await expect(page.getByRole("link", { name: local.title, exact: true })).toHaveCount(0);
  const deleted = calls.filter((c) => c.method === "DELETE").map((c) => c.path);
  expect(deleted.sort()).toEqual(["/rest/v1/progress", "/rest/v1/streaks"]);
});

test("se Supabase non risponde l'azzeramento non cancella nulla", async ({ page }) => {
  await mockSupabase(page, { failDelete: true });
  await signedIn(page);
  await page.goto("/viaggio");
  await page.getByText("Gestisci i progressi").click();
  await page.getByRole("button", { name: "Azzera i progressi" }).click();
  await page.getByRole("button", { name: "Conferma: azzera i progressi" }).click();
  await expect(page.getByText("Non riesco a raggiungere il tuo account")).toBeVisible();
  await expect(page.getByRole("link", { name: local.title })).toBeVisible();
});

test("eliminare l'account chiama la funzione e chiude la sessione", async ({ page }) => {
  const calls = await mockSupabase(page);
  await signedIn(page);
  await page.goto("/profilo");
  await page.getByRole("button", { name: "Elimina l'account" }).click();
  await page.getByRole("button", { name: "Conferma: elimina l'account" }).click();
  await expect(page.getByText("Account eliminato")).toBeVisible();
  expect(calls.some((c) => c.path === "/functions/v1/delete-account" && c.method === "POST")).toBe(
    true,
  );
  await expect(page.getByText("Non hai fatto l'accesso.")).toBeVisible();
});
