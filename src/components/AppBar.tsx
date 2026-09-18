import { Link, NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { useAppState } from "../state/AppState";
import LevelToggle from "./LevelToggle";
import ThemeToggle from "./ThemeToggle";
import StreakBadge from "./StreakBadge";

export default function AppBar() {
  const { t, i18n } = useTranslation();
  const { level, setLevel, theme, setTheme, streak } = useAppState();

  return (
    <header className="border-b-2 border-clay">
      <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-4 sm:flex-nowrap">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            to="/"
            className="font-serif text-lg font-semibold tracking-tight text-ink hover:text-accent"
          >
            {t("app.name")}
          </Link>
          <NavLink
            to="/concetti"
            className={({ isActive }) =>
              "font-mono text-xs uppercase tracking-widest hover:text-accent " +
              (isActive ? "text-accent" : "text-ink-soft")
            }
          >
            {t("nav.concepts")}
          </NavLink>
          <StreakBadge count={streak} />
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <LevelToggle level={level} onChange={setLevel} />
          <select
            aria-label={t("lang.label")}
            value={i18n.language}
            onChange={() => {}}
            className="h-9 rounded-sm border border-line bg-surface px-1.5 font-mono text-[11px] uppercase text-ink-soft"
          >
            <option value="it">{t("lang.it")}</option>
          </select>
          <ThemeToggle theme={theme} onChange={setTheme} />
        </div>
      </div>
    </header>
  );
}
