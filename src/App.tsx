import { lazy, Suspense, useEffect } from "react";
import { Link, Route, Routes, useLocation, useMatch } from "react-router";
import { useTranslation } from "react-i18next";
import { AppStateProvider, useAppState } from "./state/AppState";
import { applyTheme } from "./engine/theme";
import { getScenario } from "./engine/content";
import { DEFAULT_LANG } from "./i18n";
import AppBar from "./components/AppBar";
import Home from "./pages/Home";

const ScenarioPage = lazy(() => import("./pages/Scenario"));
const ConceptLibrary = lazy(() => import("./pages/ConceptLibrary"));
const Method = lazy(() => import("./pages/Method"));

function Shell() {
  const { t } = useTranslation();
  const { theme } = useAppState();
  const { pathname } = useLocation();
  const scenarioMatch = useMatch("/s/:id");

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const pageTitle = scenarioMatch
      ? getScenario(DEFAULT_LANG, scenarioMatch.params.id ?? "")?.title
      : pathname === "/concetti"
        ? t("concepts.title")
        : pathname === "/metodo"
          ? t("method.title")
          : undefined;
    document.title = pageTitle ? `${pageTitle} · ${t("app.name")}` : t("app.name");
  }, [pathname, scenarioMatch, t]);

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-accent focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-widest focus:text-surface focus:outline-none"
      >
        {t("nav.skipToContent")}
      </a>
      <AppBar />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 outline-none sm:py-12"
      >
        <Suspense fallback={<div className="min-h-48" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/s/:id" element={<ScenarioPage />} />
            <Route path="/concetti" element={<ConceptLibrary />} />
            <Route path="/metodo" element={<Method />} />
          </Routes>
        </Suspense>
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
