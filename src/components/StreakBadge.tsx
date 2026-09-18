import { useTranslation } from "react-i18next";

export default function StreakBadge({ count }: { count: number }) {
  const { t } = useTranslation();
  const label = t("streak.days", { count });
  return (
    <span
      title={t("streak.title", { count })}
      aria-label={label}
      className={
        "inline-flex h-9 items-center gap-1.5 rounded-sm border px-2.5 font-mono text-xs uppercase tracking-wide " +
        (count > 0 ? "border-clay text-clay" : "border-line text-ink-soft")
      }
    >
      <span aria-hidden="true">◆</span>
      <span aria-hidden="true">{count}</span>
    </span>
  );
}
