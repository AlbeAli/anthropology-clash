import { useEffect } from "react";
import { Link, Route, Routes } from "react-router";
import { useTranslation } from "react-i18next";
import { AppStateProvider, useAppState } from "./state/AppState";
import { applyTheme } from "./engine/theme";
import AppBar from "./components/AppBar";
import Home from "./pages/Home";
import ScenarioPage from "./pages/Scenario";
import ConceptLibrary from "./pages/ConceptLibrary";
import Method from "./pages/Method";

function Shell() {
  const { t } = useTranslation();
  const { theme } = useAppState();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-ink">
      <AppBar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-12">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/s/:id" element={<ScenarioPage />} />
          <Route path="/concetti" element={<ConceptLibrary />} />
          <Route path="/metodo" element={<Method />} />
        </Routes>
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 font-mono text-xs text-ink-soft">
          <p>{t("app.footer")}</p>
          <Link to="/metodo" className="uppercase tracking-widest hover:text-accent">
            {t("nav.method")}
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <Shell />
    </AppStateProvider>
  );
}
