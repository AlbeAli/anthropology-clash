import { useTranslation } from "react-i18next";
import type { Theme } from "../engine/storage";

type Props = {
  theme: Theme;
  onChange: (theme: Theme) => void;
};

export default function ThemeToggle({ theme, onChange }: Props) {
  const { t } = useTranslation();
  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      aria-label={t(`theme.switchTo.${next}`)}
      title={t(`theme.switchTo.${next}`)}
      onClick={() => onChange(next)}
      className="inline-grid size-11 place-items-center rounded-sm text-bar-ink transition-colors hover:bg-white/15"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-5 transition-transform duration-500 ease-out-expo"
        style={{ transform: theme === "dark" ? "rotate(-40deg)" : "rotate(0deg)" }}
      >
        {theme === "dark" ? (
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="currentColor" />
        ) : (
          <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="4.2" fill="currentColor" stroke="none" />
            <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
          </g>
        )}
      </svg>
    </button>
  );
}
