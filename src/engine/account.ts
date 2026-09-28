import type { SupabaseClient } from "@supabase/supabase-js";
import { AUTH_STORAGE_KEY } from "./remote";
import type { StoredState } from "./storage";
import { fromRows, toRows, type ProgressRow, type RemoteProgress, type StreakRow } from "./sync";

export type Providers = { google: boolean };

type UrlParts = Pick<Location, "search" | "hash">;

export function hasStoredSession(): boolean {
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function callbackError({ search, hash }: UrlParts): boolean {
  return (
    new URLSearchParams(search).has("error_description") ||
    new URLSearchParams(hash.replace(/^#/, "")).has("error_description")
  );
}

export function isAuthCallback(url: UrlParts): boolean {
  return new URLSearchParams(url.search).has("code") || callbackError(url);
}

export async function fetchProviders(): Promise<Providers> {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { google: false };
  try {
    const res = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } });
    if (!res.ok) return { google: false };
    const body = (await res.json()) as { external?: Record<string, boolean> };
    return { google: body.external?.google === true };
  } catch {
    return { google: false };
  }
}

export async function pullRemote(client: SupabaseClient, userId: string): Promise<RemoteProgress> {
  const [progress, streak] = await Promise.all([
    client
      .from("progress")
      .select("user_id, scenario_id, level, choice, completed_on")
      .eq("user_id", userId),
    client
      .from("streaks")
      .select("user_id, streak_count, last_day")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);
  if (progress.error) throw progress.error;
  if (streak.error) throw streak.error;
  return fromRows((progress.data ?? []) as ProgressRow[], streak.data as StreakRow | null);
}

export async function pushRemote(
  client: SupabaseClient,
  userId: string,
  state: StoredState,
): Promise<void> {
  const rows = toRows(userId, state);
  if (rows.progress.length > 0) {
    const { error } = await client
      .from("progress")
      .upsert(rows.progress, { onConflict: "user_id,scenario_id" });
    if (error) throw error;
  }
  const { error } = await client.from("streaks").upsert(rows.streak, { onConflict: "user_id" });
  if (error) throw error;
}

export async function clearRemote(client: SupabaseClient, userId: string): Promise<void> {
  const [progress, streak] = await Promise.all([
    client.from("progress").delete().eq("user_id", userId),
    client.from("streaks").delete().eq("user_id", userId),
  ]);
  if (progress.error) throw progress.error;
  if (streak.error) throw streak.error;
}
