import { useTranslation } from "react-i18next";
import type { Level } from "../schema/scenario.schema";
import { LEVELS } from "../engine/levels";

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
      className="relative inline-grid grid-cols-2 overflow-hidden rounded-lg border-2 border-ink bg-bg"
    >
      <span
        aria-hidden="true"
        className={
          "absolute inset-y-0 left-0 w-1/2 bg-ink transition-transform duration-300 ease-out-expo " +
          (level === LEVELS[1] ? "translate-x-full" : "translate-x-0")
        }
      />
      {LEVELS.map((option) => {
        const active = level === option;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option)}
            className={
              "relative min-h-11 px-4 font-display text-[15px] font-bold transition-colors duration-300 " +
              (active ? "text-bg" : "text-ink")
            }
          >
            {t(`level.${option}`)}
          </button>
        );
      })}
    </div>
  );
}
