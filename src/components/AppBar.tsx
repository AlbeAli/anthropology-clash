import { Link, NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { useAppState } from "../state/AppState";
import ThemeToggle from "./ThemeToggle";
import StreakBadge from "./StreakBadge";

const navClass = ({ isActive }: { isActive: boolean }) =>
  "inline-flex min-h-11 items-center rounded-sm px-3 font-display text-[15px] font-bold transition-colors " +
  (isActive ? "bg-bar-ink text-bar" : "text-bar-ink hover:bg-white/15");

export default function AppBar() {
  const { t } = useTranslation();
  const { theme, setTheme, streak } = useAppState();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-bar text-bar-ink">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2">
        <Link
          to="/"
          className="group inline-flex min-h-11 items-center gap-2.5 font-display text-xl font-extrabold tracking-tight"
        >
          <span
            aria-hidden="true"
            className="size-5.5 rounded-full border-[5px] border-current transition-transform duration-500 ease-out-expo group-hover:scale-110 group-hover:rotate-180"
          />
          {t("app.name")}
        </Link>
        <nav aria-label={t("nav.label")} className="flex flex-wrap items-center gap-1">
          <NavLink to="/concetti" className={navClass}>
            {t("nav.concepts")}
          </NavLink>
          <NavLink to="/metodo" className={navClass}>
            {t("nav.methodShort")}
          </NavLink>
          <StreakBadge count={streak} />
          <ThemeToggle theme={theme} onChange={setTheme} />
        </nav>
      </div>
    </header>
  );
}
