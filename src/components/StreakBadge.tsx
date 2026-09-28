import { useTranslation } from "react-i18next";

export default function StreakBadge({ count }: { count: number }) {
  const { t } = useTranslation();
  return (
    <span
      title={t("streak.title", { count })}
      className="inline-flex min-h-11 items-center gap-2 px-2 font-display text-sm font-bold"
    >
      <span
        aria-hidden="true"
        className={
          "inline-grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs tabular-nums " +
          (count > 0 ? "bg-(--l-relativismo) text-[#1a1a1a]" : "border-2 border-white/50")
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
