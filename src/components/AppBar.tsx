import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { useAppState } from "../state/AppState";
import { useAccount } from "../state/Account";
import ThemeToggle from "./ThemeToggle";
import StreakBadge from "./StreakBadge";

const itemClass = (isActive: boolean) =>
  "inline-flex min-h-11 items-center rounded-sm px-2.5 font-display sm:px-3 text-[15px] font-bold transition-colors " +
  (isActive ? "bg-bar-ink text-bar" : "text-bar-ink hover:bg-white/15");
const navClass = ({ isActive }: { isActive: boolean }) => itemClass(isActive);
const wideClass = (state: { isActive: boolean }) => navClass(state) + " max-sm:hidden";
const xlClass = (state: { isActive: boolean }) => navClass(state) + " max-xl:hidden";

const more = [
  { to: "/concetti", key: "nav.concepts", phoneOnly: true },
  { to: "/percorsi", key: "nav.itineraries", phoneOnly: true },
  { to: "/metodo", key: "nav.methodShort", phoneOnly: true },
  { to: "/glossario", key: "nav.glossary", phoneOnly: false },
  { to: "/autori", key: "nav.authors", phoneOnly: false },
] as const;

function MoreMenu() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const active = more.some(({ to }) => pathname === to || pathname.startsWith(to + "/"));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpenAt(null);
      button.current?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpenAt(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div
      ref={wrap}
      className="relative sm:max-lg:hidden xl:hidden"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpenAt(null);
      }}
    >
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls="nav-more"
        onClick={() => setOpenAt(open ? null : pathname)}
        className={itemClass(active || open) + " gap-1.5"}
      >
        {t("nav.more")}
        <svg
          aria-hidden="true"
          viewBox="0 0 12 12"
          className={"size-3 transition-transform " + (open ? "rotate-180" : "")}
        >
          <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>
      {open && (
        <ul
          id="nav-more"
          onClick={() => setOpenAt(null)}
          className="absolute top-full right-0 z-50 mt-1 grid min-w-44 gap-0.5 rounded-md bg-bar p-1 shadow-lg ring-1 ring-white/15"
        >
          {more.map(({ to, key, phoneOnly }) => (
            <li key={to} className={phoneOnly ? "sm:hidden" : undefined}>
              <NavLink to={to} className={(s) => navClass(s) + " w-full"}>
                {t(key)}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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
          <NavLink to="/concetti" className={wideClass}>
            {t("nav.concepts")}
          </NavLink>
          <NavLink to="/percorsi" className={wideClass}>
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
          <NavLink to="/diario" className={navClass}>
            {t("nav.diary")}
          </NavLink>
          <NavLink to="/metodo" className={wideClass}>
            {t("nav.methodShort")}
          </NavLink>
          <NavLink to="/glossario" className={xlClass}>
            {t("nav.glossary")}
          </NavLink>
          <NavLink to="/autori" className={xlClass}>
            {t("nav.authors")}
          </NavLink>
          <MoreMenu />
          <StreakBadge count={streak} className="ml-auto sm:hidden" />
        </nav>
        <div className="order-2 flex items-center sm:order-3">
          <StreakBadge count={streak} className="max-sm:hidden" />
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
