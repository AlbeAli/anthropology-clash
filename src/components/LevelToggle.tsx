import { useTranslation } from "react-i18next";
import { Level } from "../schema/scenario.schema";

type Props = {
  level: Level;
  onChange: (level: Level) => void;
};

export default function LevelToggle({ level, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <div
      role="group"
      aria-label={t("level.label")}
      className="flex items-center gap-1 rounded-sm border border-line bg-surface p-1"
    >
      {Level.options.map((option) => {
        const active = level === option;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option)}
            className={
              "rounded-sm px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wide transition-colors " +
              (active
                ? "bg-accent text-surface"
                : "text-ink-soft hover:bg-accent-soft hover:text-accent")
            }
          >
            {t(`level.${option}`)}
          </button>
        );
      })}
    </div>
  );
}
