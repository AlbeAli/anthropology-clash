import { Link, NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { useAppState } from "../state/AppState";
import { useAccount } from "../state/Account";
import ThemeToggle from "./ThemeToggle";
import StreakBadge from "./StreakBadge";

const navClass = ({ isActive }: { isActive: boolean }) =>
  "inline-flex min-h-11 items-center rounded-sm px-2.5 font-display sm:px-3 text-[15px] font-bold transition-colors " +
  (isActive ? "bg-bar-ink text-bar" : "text-bar-ink hover:bg-white/15");

export default function AppBar() {
  const { t } = useTranslation();
  const { state, theme, setTheme, streak } = useAppState();
  const { available, user } = useAccount();
  const visited = Object.keys(state.completed).length;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-bar text-bar-ink">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-2 gap-y-0 px-4 py-2 sm:px-6">
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
        <nav
          aria-label={t("nav.label")}
          className="order-3 flex flex-wrap items-center gap-0.5 max-sm:w-full sm:order-2 sm:ml-auto sm:gap-1"
        >
          <NavLink to="/concetti" className={navClass}>
            {t("nav.concepts")}
          </NavLink>
          <NavLink to="/percorsi" className={navClass}>
            {t("nav.itineraries")}
          </NavLink>
          <NavLink to="/viaggio" className={navClass}>
            <span className="sm:hidden">{t("nav.journeyShort")}</span>
            <span className="hidden sm:inline">{t("nav.journey")}</span>
            <span
              aria-hidden="true"
              className="ml-2 inline-grid h-6 min-w-6 place-items-center rounded-full bg-(--l-relativismo) px-1.5 text-xs text-[#1a1a1a] tabular-nums"
            >
              {visited}
            </span>
          </NavLink>
          <NavLink to="/metodo" className={navClass}>
            {t("nav.methodShort")}
          </NavLink>
        </nav>
        <div className="order-2 flex items-center sm:order-3">
          <StreakBadge count={streak} />
          {available && (
            <NavLink
              to={user ? "/profilo" : "/accedi"}
              aria-label={user ? t("nav.account") : t("nav.signIn")}
              title={user ? t("nav.account") : t("nav.signIn")}
              className={({ isActive }) =>
                "inline-grid size-11 place-items-center rounded-sm transition-colors " +
                (isActive ? "bg-bar-ink text-bar" : "text-bar-ink hover:bg-white/15")
              }
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
                <circle
                  cx="12"
                  cy="8"
                  r="4"
                  fill={user ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"
                  fill={user ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </NavLink>
          )}
          <ThemeToggle theme={theme} onChange={setTheme} />
        </div>
      </div>
    </header>
  );
}
