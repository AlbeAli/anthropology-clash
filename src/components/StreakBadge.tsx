import { useTranslation } from "react-i18next";

type Props = { count: number; className?: string };

export default function StreakBadge({ count, className = "" }: Props) {
  const { t } = useTranslation();
  return (
    <span
      title={t("streak.title", { count })}
      className={
        "inline-flex min-h-11 items-center gap-2 px-2 font-display text-sm font-bold " + className
      }
    >
      <span
        aria-hidden="true"
        className={
          "inline-grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs tabular-nums " +
          (count > 0
            ? "border-2 border-(--l-relativismo) text-(--l-relativismo)"
            : "border-2 border-white/50")
        }
      >
        {count}
      </span>
      <span aria-hidden="true" className="hidden sm:inline">
        {t("streak.short")}
      </span>
      <span className="sr-only">{t("streak.days", { count })}</span>
    </span>
  );
}
