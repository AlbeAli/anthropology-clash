import { useState } from "react";
import { Route, Routes, Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { Level } from "./schema/scenario.schema";
import type { Theme } from "./engine/storage";
import { applyTheme, initialTheme } from "./engine/theme";
import LevelToggle from "./components/LevelToggle";
import ThemeToggle from "./components/ThemeToggle";
import Home from "./pages/Home";
import ScenarioPage from "./pages/Scenario";

export default function App() {
  const { t } = useTranslation();
  const [level, setLevel] = useState<Level>("neofita");
  const [theme, setTheme] = useState<Theme>(initialTheme);

  function changeTheme(next: Theme) {
    applyTheme(next);
    setTheme(next);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-ink">
      <header className="border-b-2 border-clay">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4">
          <Link
            to="/"
            className="font-serif text-xl font-semibold tracking-tight text-ink hover:text-accent"
          >
            {t("app.name")}
          </Link>
          <div className="flex items-center gap-2">
            <LevelToggle level={level} onChange={setLevel} />
            <ThemeToggle theme={theme} onChange={changeTheme} />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-12">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/s/:id" element={<ScenarioPage level={level} />} />
        </Routes>
      </main>
      <footer className="border-t border-line">
        <p className="mx-auto max-w-2xl px-4 py-4 font-mono text-xs text-ink-soft">
          {t("app.footer")}
        </p>
      </footer>
    </div>
  );
}
