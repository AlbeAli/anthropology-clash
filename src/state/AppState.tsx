import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { ConceptId, Level } from "../schema/scenario.schema";
import { readState, writeState, type StoredState, type Theme } from "../engine/storage";
import { currentStreak, dayKey, markCompleted } from "../engine/progress";
import { applyTheme, systemTheme } from "../engine/theme";
import { track } from "../engine/analytics";
import { getScenario } from "../engine/content";
import { mergeState, type RemoteProgress } from "../engine/sync";
import { DEFAULT_LANG } from "../i18n";

type AppState = {
  state: StoredState;
  level: Level;
  theme: Theme;
  streak: number;
  recent: string | null;
  clearRecent: () => void;
  resetProgress: () => void;
  mergeRemote: (remote: RemoteProgress) => void;
  setLevel: (level: Level) => void;
  setTheme: (theme: Theme) => void;
  complete: (input: { scenarioId: string; concept: ConceptId; choice: string }) => void;
};

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredState>(readState);
  const [recent, setRecent] = useState<string | null>(null);

  const update = useCallback((next: StoredState) => {
    setState(next);
    writeState(next);
  }, []);

  const mergeRemote = useCallback((remote: RemoteProgress) => {
    setState((prev) => {
      const next = mergeState(prev, remote, (id) => getScenario(DEFAULT_LANG, id)?.concept);
      writeState(next);
      return next;
    });
  }, []);

  const level = state.level ?? "neofita";
  const theme = state.theme ?? systemTheme();

  const value = useMemo<AppState>(
    () => ({
      state,
      level,
      theme,
      streak: currentStreak(state.streak, dayKey(new Date())),
      recent,
      clearRecent: () => setRecent(null),
      resetProgress: () => {
        setRecent(null);
        update({ ...state, completed: {}, streak: { count: 0, lastDay: null }, seenConcepts: [] });
      },
      mergeRemote,
      setLevel: (next) => {
        track("level_chosen", { level: next });
        update({ ...state, level: next });
      },
      setTheme: (next) => {
        applyTheme(next);
        update({ ...state, theme: next });
      },
      complete: ({ scenarioId, concept, choice }) => {
        track("scenario_completed", { scenario: scenarioId, level, choice });
        if (!(scenarioId in state.completed)) setRecent(scenarioId);
        update(
          markCompleted(state, { scenarioId, concept, level, choice, today: dayKey(new Date()) }),
        );
      },
    }),
    [state, level, theme, recent, update, mergeRemote],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppState fuori da AppStateProvider");
  return ctx;
}
