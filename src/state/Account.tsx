import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase, supabaseConfigured } from "../engine/remote";
import {
  clearRemote,
  hasStoredSession,
  isAuthCallback,
  pullRemote,
  pushRemote,
} from "../engine/account";
import { useAppState } from "./AppState";

export type SyncStatus = "idle" | "syncing" | "synced" | "error";
export type LinkResult = "sent" | "rate" | "error";
export type AccountUser = { id: string; email: string | null };

type Account = {
  available: boolean;
  user: AccountUser | null;
  status: SyncStatus;
  sendLink: (email: string) => Promise<LinkResult>;
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => Promise<void>;
  clearAccountProgress: () => Promise<boolean>;
};

const Ctx = createContext<Account | null>(null);

const returnUrl = () => `${window.location.origin}/accedi`;

export function AccountProvider({ children }: { children: ReactNode }) {
  const { state, mergeRemote } = useAppState();
  const available = supabaseConfigured();
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [user, setUser] = useState<AccountUser | null>(null);
  const [pulled, setPulled] = useState<{ id: string; ok: boolean } | null>(null);
  const [pushed, setPushed] = useState<{ key: string; ok: boolean } | null>(null);
  const latest = useRef(state);

  useEffect(() => {
    latest.current = state;
  }, [state]);

  const connect = useCallback(async () => {
    const c = await getSupabase();
    if (c) setClient(c);
    return c;
  }, []);

  useEffect(() => {
    if (!available || !(hasStoredSession() || isAuthCallback(window.location))) return;
    let cancelled = false;
    void getSupabase().then((c) => {
      if (!cancelled && c) setClient(c);
    });
    return () => {
      cancelled = true;
    };
  }, [available]);

  useEffect(() => {
    if (!client) return;
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      setUser((prev) =>
        u ? (prev?.id === u.id ? prev : { id: u.id, email: u.email ?? null }) : null,
      );
    });
    return () => data.subscription.unsubscribe();
  }, [client]);

  useEffect(() => {
    if (!client || !user) return;
    let cancelled = false;
    pullRemote(client, user.id)
      .then((remote) => {
        if (cancelled) return;
        mergeRemote(remote);
        setPulled({ id: user.id, ok: true });
      })
      .catch(() => {
        if (!cancelled) setPulled({ id: user.id, ok: false });
      });
    return () => {
      cancelled = true;
    };
  }, [client, user, mergeRemote]);

  const ready = user !== null && pulled?.id === user.id && pulled.ok;
  const pushKey = `${user?.id}:${JSON.stringify([state.completed, state.streak])}`;

  useEffect(() => {
    if (!client || !user || !ready) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      pushRemote(client, user.id, latest.current)
        .then(() => {
          if (!cancelled) setPushed({ key: pushKey, ok: true });
        })
        .catch(() => {
          if (!cancelled) setPushed({ key: pushKey, ok: false });
        });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [client, user, ready, pushKey]);

  const status: SyncStatus = !user
    ? "idle"
    : pulled?.id !== user.id
      ? "syncing"
      : !pulled.ok
        ? "error"
        : pushed?.key !== pushKey
          ? "syncing"
          : pushed.ok
            ? "synced"
            : "error";

  const value = useMemo<Account>(
    () => ({
      available,
      user,
      status,
      sendLink: async (email) => {
        const c = client ?? (await connect());
        if (!c) return "error";
        const { error } = await c.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: returnUrl() },
        });
        if (!error) return "sent";
        return error.status === 429 ? "rate" : "error";
      },
      signInWithGoogle: async () => {
        const c = client ?? (await connect());
        if (!c) return false;
        const { error } = await c.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: returnUrl() },
        });
        return !error;
      },
      signOut: async () => {
        if (client) await client.auth.signOut({ scope: "local" });
        setUser(null);
      },
      clearAccountProgress: async () => {
        if (!client || !user) return true;
        try {
          await clearRemote(client, user.id);
          return true;
        } catch {
          return false;
        }
      },
    }),
    [available, user, status, client, connect],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAccount(): Account {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAccount fuori da AccountProvider");
  return ctx;
}
