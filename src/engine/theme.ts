import { readState, writeState, type Theme } from "./storage";

export function systemTheme(): Theme {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function initialTheme(): Theme {
  return readState().theme ?? systemTheme();
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  writeState({ theme });
}
