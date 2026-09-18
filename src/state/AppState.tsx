import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { ConceptId, Level } from "../schema/scenario.schema";
import { readState, writeState, type StoredState, type Theme } from "../engine/storage";
import { currentStreak, dayKey, markCompleted } from "../engine/progress";
import { applyTheme, systemTheme } from "../engine/theme";

type AppState = {
  state: StoredState;
  level: Level;
  levelChosen: boolean;
  theme: Theme;
  streak: number;
  setLevel: (level: Level) => void;
  setTheme: (theme: Theme) => void;
  complete: (input: { scenarioId: string; concept: ConceptId; choice: string }) => void;
};

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredState>(readState);

  const update = useCallback((next: StoredState) => {
    setState(next);
    writeState(next);
  }, []);

  const level = state.level ?? "neofita";
  const theme = state.theme ?? systemTheme();

  const value = useMemo<AppState>(
    () => ({
      state,
      level,
      levelChosen: state.level !== null,
      theme,
      streak: currentStreak(state.streak, dayKey(new Date())),
      setLevel: (next) => update({ ...state, level: next }),
      setTheme: (next) => {
        applyTheme(next);
        update({ ...state, theme: next });
      },
      complete: ({ scenarioId, concept, choice }) =>
        update(
          markCompleted(state, { scenarioId, concept, level, choice, today: dayKey(new Date()) }),
        ),
    }),
    [state, level, theme, update],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppState fuori da AppStateProvider");
  return ctx;
}
