import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { Scenario } from "../../schema/scenario.schema";
import type { Completion } from "../../engine/storage";
import { getScenarios } from "../../engine/content";
import { prefersReducedMotion } from "../../engine/motion";
import { DEFAULT_LANG } from "../../i18n";

type Props = { scenario: Scenario; completed: Record<string, Completion> };

export default function LineStrip({ scenario, completed }: Props) {
  const { t } = useTranslation();
  const stops = getScenarios(DEFAULT_LANG).filter((s) => s.concept === scenario.concept);
  const idx = stops.findIndex((s) => s.id === scenario.id);
  const pos = (k: number) => (stops.length === 1 ? 50 : (k / (stops.length - 1)) * 100);
  const [left, setLeft] = useState(() => pos(prefersReducedMotion() ? idx : Math.max(0, idx - 1)));

  useEffect(() => {
    const target = stops.length === 1 ? 50 : (idx / (stops.length - 1)) * 100;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setLeft(target)));
    return () => cancelAnimationFrame(id);
  }, [idx, stops.length]);

  return (
    <div className="mb-5 rounded-xl bg-surface px-4 pt-3.5 pb-2 sm:px-5">
      <div className="mb-2.5 flex flex-wrap justify-between gap-3 font-display text-sm font-bold text-ink-soft">
        <span>{t("scenario.strip.line", { line: t(`lines.${scenario.concept}.name`) })}</span>
        <span>{t("scenario.strip.position", { index: idx + 1, total: stops.length })}</span>
      </div>
      <div aria-hidden="true" className="relative mx-3.5 h-8.5">
        <span className="absolute inset-x-0 top-[13px] h-2 rounded bg-(--lc)" />
        {stops.map((s, k) => (
          <span
            key={s.id}
            className={
              "absolute top-1.5 size-5.5 -translate-x-1/2 rounded-full border-4 border-ink " +
              (s.id in completed ? "bg-ink" : "bg-bg")
            }
            style={{ left: `${pos(k)}%` }}
          />
        ))}
        <span
          className="strip-train absolute top-0.5 h-7.5 w-11 -translate-x-1/2 rounded-lg bg-ink"
          style={{ left: `${left}%` }}
        >
          <span className="absolute top-[11px] left-2 size-2 rounded-full bg-[#ffd54a]" />
          <span className="absolute top-[11px] right-2 size-2 rounded-full bg-[#ffd54a]" />
        </span>
      </div>
      <nav
        aria-label={t("scenario.strip.nav")}
        className="mt-1.5 grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${stops.length}, minmax(0, 1fr))` }}
      >
        {stops.map((s, k) => (
          <Link
            key={s.id}
            to={`/s/${s.id}`}
            aria-current={k === idx ? "page" : undefined}
            className={
              "min-h-8 py-1.5 font-display text-xs leading-tight font-bold hover:text-ink hover:underline sm:text-[13px] " +
              (k === idx ? "text-ink" : "text-ink-soft") +
              (k === 0 ? " text-left" : k === stops.length - 1 ? " text-right" : " text-center")
            }
          >
            {s.title}
          </Link>
        ))}
      </nav>
    </div>
  );
}
