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
      className="flex size-9 items-center justify-center rounded-sm border border-line bg-surface text-ink-soft transition-colors hover:border-accent hover:text-accent"
    >
      <span aria-hidden="true" className="font-mono text-base leading-none">
        {theme === "dark" ? "☾" : "☀"}
      </span>
    </button>
  );
}
