import { lazy, Suspense, useEffect } from "react";
import { Link, Route, Routes, useLocation, useMatch } from "react-router";
import { useTranslation } from "react-i18next";
import { AppStateProvider, useAppState } from "./state/AppState";
import { AccountProvider, useAccount } from "./state/Account";
import { applyTheme } from "./engine/theme";
import { getEntry } from "./engine/content";
import { DEFAULT_LANG } from "./i18n";
import AppBar from "./components/AppBar";
import ErrorBoundary from "./components/ErrorBoundary";
import RouteWipe from "./components/metro/RouteWipe";
import Home from "./pages/Home";

const ScenarioPage = lazy(() => import("./pages/Scenario"));
const ConceptLibrary = lazy(() => import("./pages/ConceptLibrary"));
const Method = lazy(() => import("./pages/Method"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Journey = lazy(() => import("./pages/Journey"));
const SignIn = lazy(() => import("./pages/SignIn"));
const Profile = lazy(() => import("./pages/Profile"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Itineraries = lazy(() => import("./pages/Itineraries"));
const ItineraryPage = lazy(() => import("./pages/Itinerary"));
const Aula = lazy(() => import("./pages/Aula"));
const Sheet = lazy(() => import("./pages/Sheet"));

const PAGE_TITLES: Record<string, string> = {
  "/concetti": "concepts.title",
  "/percorsi": "itineraries.title",
  "/viaggio": "journey.title",
  "/metodo": "method.title",
};
const ACCOUNT_TITLES: Record<string, string> = {
  "/accedi": "account.title",
  "/profilo": "account.titleSignedIn",
  "/privacy": "privacyPage.title",
};

function Shell() {
  const { t } = useTranslation();
  const { theme } = useAppState();
  const { available } = useAccount();
  const { pathname } = useLocation();
  const scenarioMatch = useMatch("/s/:id");
  const aulaMatch = useMatch("/aula/:id");
  const sheetMatch = useMatch("/scheda/:id");
  const itineraryMatch = useMatch("/percorso/:id");
  const selfTitled = Boolean(itineraryMatch) || pathname === "/percorso";

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    if (selfTitled) return;
    const key = PAGE_TITLES[pathname] ?? (available ? ACCOUNT_TITLES[pathname] : undefined);
    const aulaTitle = aulaMatch && getEntry(DEFAULT_LANG, aulaMatch.params.id ?? "")?.title;
    const sheetTitle = sheetMatch && getEntry(DEFAULT_LANG, sheetMatch.params.id ?? "")?.title;
    const pageTitle = scenarioMatch
      ? getEntry(DEFAULT_LANG, scenarioMatch.params.id ?? "")?.title
      : aulaTitle
        ? `${t("aula.title")} · ${aulaTitle}`
        : sheetTitle
          ? `${t("sheet.title")} · ${sheetTitle}`
          : key && t(key);
    document.title = pageTitle ? `${pageTitle} · ${t("app.name")}` : t("app.name");
  }, [pathname, scenarioMatch, aulaMatch, sheetMatch, selfTitled, available, t]);

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-accent focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-widest focus:text-surface focus:outline-none"
      >
        {t("nav.skipToContent")}
      </a>
      <AppBar />
      <RouteWipe />
      <main
        id="main-content"
        tabIndex={-1}
        className="w-full flex-1 px-4 py-8 outline-none sm:px-6 sm:py-10"
      >
        <ErrorBoundary resetKey={pathname}>
          <Suspense fallback={<div className="min-h-48" />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/s/:id" element={<ScenarioPage />} />
              <Route path="/aula/:id" element={<Aula />} />
              <Route path="/scheda/:id" element={<Sheet />} />
              <Route path="/concetti" element={<ConceptLibrary />} />
              <Route path="/percorsi" element={<Itineraries />} />
              <Route path="/percorso" element={<ItineraryPage />} />
              <Route path="/percorso/:id" element={<ItineraryPage />} />
              <Route path="/metodo" element={<Method />} />
              <Route path="/viaggio" element={<Journey />} />
              {available && (
                <>
                  <Route path="/accedi" element={<SignIn />} />
                  <Route path="/profilo" element={<Profile />} />
                  <Route path="/privacy" element={<Privacy />} />
                </>
              )}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 font-mono text-xs text-ink-soft sm:px-6">
          <p>{t(available ? "app.footer" : "app.footerLocal")}</p>
          <div className="flex gap-x-5">
            <Link
              to="/metodo"
              className="inline-block py-1 uppercase tracking-widest hover:text-accent"
            >
              {t("nav.method")}
            </Link>
            {available && (
              <Link
                to="/privacy"
                className="inline-block py-1 uppercase tracking-widest hover:text-accent"
              >
                {t("nav.privacy")}
              </Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <AccountProvider>
        <Shell />
      </AccountProvider>
    </AppStateProvider>
  );
}
