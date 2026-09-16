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
      className="flex gap-1 rounded border border-stone-300 p-1"
    >
      {Level.options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={level === option}
          onClick={() => onChange(option)}
          className={
            "rounded px-3 py-1 text-sm " +
            (level === option ? "bg-teal-800 text-white" : "text-stone-700 hover:bg-stone-100")
          }
        >
          {t(`level.${option}`)}
        </button>
      ))}
    </div>
  );
}
