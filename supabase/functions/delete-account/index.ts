import { createClient } from "npm:@supabase/supabase-js@2";

const baseHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function reply(req: Request, status: number, body: Record<string, unknown>): Response {
  const allowHeaders =
    req.headers.get("Access-Control-Request-Headers") ??
    "authorization, x-client-info, apikey, content-type";
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...baseHeaders, "Access-Control-Allow-Headers": allowHeaders },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return reply(req, 200, { ok: true });
  if (req.method !== "POST") return reply(req, 405, { error: "method_not_allowed" });

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return reply(req, 401, { error: "missing_token" });

  const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
  const key = secretKeys.default ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const url = Deno.env.get("SUPABASE_URL");
  if (!url || !key) return reply(req, 500, { error: "not_configured" });

  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return reply(req, 401, { error: "invalid_token" });

  const removed = await admin.auth.admin.deleteUser(data.user.id);
  if (removed.error) return reply(req, 500, { error: "delete_failed" });

  return reply(req, 200, { deleted: true });
});
