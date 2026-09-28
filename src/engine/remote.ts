import type { SupabaseClient } from "@supabase/supabase-js";

export const AUTH_STORAGE_KEY = "anthropology-clash.auth";

let client: Promise<SupabaseClient | null> | undefined;

export function supabaseConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function getSupabase(): Promise<SupabaseClient | null> {
  if (!supabaseConfigured()) return Promise.resolve(null);
  client ??= import("@supabase/supabase-js")
    .then(({ createClient }) =>
      createClient(
        import.meta.env.VITE_SUPABASE_URL as string,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
        { auth: { flowType: "pkce", persistSession: true, storageKey: AUTH_STORAGE_KEY } },
      ),
    )
    .catch(() => null);
  return client;
}
