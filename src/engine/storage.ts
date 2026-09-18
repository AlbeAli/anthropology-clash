export const STORAGE_KEY = "anthropology-clash.v1";
export const STORAGE_VERSION = 1;

export type Theme = "light" | "dark";

export type StoredState = {
  version: typeof STORAGE_VERSION;
  theme?: Theme;
};

export function readState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: STORAGE_VERSION };
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    if (parsed.version !== STORAGE_VERSION) return { version: STORAGE_VERSION };
    return { ...parsed, version: STORAGE_VERSION };
  } catch {
    return { version: STORAGE_VERSION };
  }
}

export function writeState(patch: Partial<Omit<StoredState, "version">>): void {
  try {
    const next = { ...readState(), ...patch };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* persistenza non disponibile: l'app continua senza */
  }
}
