import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { Concept, ConceptId } from "../../schema/scenario.schema";
import type { CatalogEntry } from "../../engine/content";
import type { Completion } from "../../engine/storage";
import { lineColor, lineInk, stopNumber } from "../../engine/lines";
import { prefersReducedMotion } from "../../engine/motion";
import LineBullet from "./LineBullet";

type Props = {
  concepts: Concept[];
  scenarios: CatalogEntry[];
  completed: Record<string, Completion>;
  hereId: string | undefined;
  fresh: string | null;
  open: ConceptId[];
  onToggle: (id: ConceptId, open: boolean) => void;
};

export default function LineMap({
  concepts,
  scenarios,
  completed,
  hereId,
  fresh,
  open,
  onToggle,
}: Props) {
  const { t } = useTranslation();
  const hereLine = scenarios.find((s) => s.id === hereId)?.concept;

  return (
    <div className="border-t-2 border-ink">
      {concepts.map((c, i) => {
        const stops = scenarios.filter((s) => s.concept === c.id);
        const done = stops.filter((s) => s.id in completed).length;
        const isOpen = open.includes(c.id);
        return (
          <details
            key={c.id}
            id={`linea-${c.id}`}
            open={isOpen}
            onToggle={(e) => {
              if (e.currentTarget.open !== isOpen) onToggle(c.id, e.currentTarget.open);
            }}
            className="group scroll-mt-4 border-b border-line"
            style={{ ["--lc" as string]: lineColor(c.id) }}
          >
            <summary className="grid min-h-18 cursor-pointer list-none grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-3 py-2 sm:grid-cols-[auto_minmax(0,14rem)_minmax(0,1fr)_auto_auto] sm:gap-x-5 [&::-webkit-details-marker]:hidden">
              <LineBullet concept={c.id} />
              <span className="min-w-0">
                <span className="block font-display text-xl leading-tight font-extrabold">
                  {t(`lines.${c.id}.name`)}
                </span>
                {c.label !== t(`lines.${c.id}.name`) && (
                  <span className="block text-sm leading-snug text-ink-soft">{c.label}</span>
                )}
              </span>
              <span
                aria-hidden="true"
                className="hidden grid-flow-col gap-1 [grid-auto-columns:minmax(0,1fr)] sm:grid"
                style={{ ["--c" as string]: lineColor(c.id) }}
              >
                {stops.map((s, k) => (
                  <i
                    key={s.id}
                    className={
                      "relative h-2.5 overflow-hidden rounded-full bg-line " +
                      (s.id in completed ? "metro-seg" : "")
                    }
                    style={{ ["--d" as string]: `${0.4 + i * 0.08 + k * 0.06}s` }}
                  />
                ))}
              </span>
              <span className="font-display text-sm font-bold text-ink-soft tabular-nums">
                <span aria-hidden="true">
                  {done}/{stops.length}
                </span>
                <span className="sr-only">
                  {t("home.map.lineCount", { count: done, total: stops.length })}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="font-display text-2xl leading-none font-extrabold transition-transform duration-300 ease-out-expo group-open:rotate-90"
              >
                ›
              </span>
            </summary>
            <div className="pb-6 sm:pl-14">
              <Stops
                stops={stops}
                completed={completed}
                hereId={hereId}
                fresh={fresh}
                withTrain={isOpen && hereLine === c.id}
              />
            </div>
          </details>
        );
      })}
    </div>
  );
}

function Stops({
  stops,
  completed,
  hereId,
  fresh,
  withTrain,
}: {
  stops: CatalogEntry[];
  completed: Record<string, Completion>;
  hereId: string | undefined;
  fresh: string | null;
  withTrain: boolean;
}) {
  const { t } = useTranslation();
  const list = useRef<HTMLOListElement>(null);
  const [trainY, setTrainY] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!withTrain) return;
    const here = list.current?.querySelector<HTMLElement>('[data-state="here"]');
    if (!here) return;
    const y = here.offsetTop + 2;
    if (prefersReducedMotion()) {
      setTrainY(y);
      return;
    }
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setTrainY(y)));
    return () => cancelAnimationFrame(id);
  }, [withTrain, hereId]);

  return (
    <ol
      ref={list}
      className="metro-rail relative m-0 max-w-2xl list-none py-0 pr-0 pl-5"
      style={{ ["--i" as string]: 0 }}
    >
      {withTrain && (
        <span
          aria-hidden="true"
          className="metro-train"
          style={{ transform: `translate(-50%, ${trainY ?? -40}px)` }}
        />
      )}
      {stops.map((s, j) => {
        const state = s.id === hereId ? "here" : s.id in completed ? "done" : "todo";
        const hook = s.hook ?? "";
        return (
          <li
            key={s.id}
            data-state={state}
            data-fresh={s.id === fresh ? "" : undefined}
            className="metro-stop relative pt-1 pb-4.5 pl-6.5"
            style={{ ["--j" as string]: j }}
          >
            <span aria-hidden="true" className="metro-dot" />
            <Link
              to={`/s/${s.id}`}
              className="inline-block py-0.5 leading-snug font-bold decoration-2 underline-offset-4 hover:underline"
            >
              {s.title}
              {s.also?.length ? (
                <span className="sr-only">
                  {", " +
                    t("home.network.change", {
                      lines: s.also.map((c) => t(`lines.${c}.name`)).join(", "),
                    })}
                </span>
              ) : null}
            </Link>
            {s.also?.map((c) => (
              <span
                key={c}
                aria-hidden="true"
                className="ml-1.5 inline-grid size-[18px] place-items-center rounded-[4px] align-[2px] font-display text-xs font-extrabold"
                style={{ background: lineColor(c), color: lineInk(c) }}
              >
                {t(`lines.${c}.letter`)}
              </span>
            ))}
            <small
              className={
                "block text-sm " + (state === "here" ? "font-bold text-ink" : "text-ink-soft")
              }
            >
              {state === "here"
                ? t("home.stop.here")
                : state === "done"
                  ? t("home.stop.visited", { level: t(`level.${completed[s.id].level}`) })
                  : t("home.stop.todo", { n: stopNumber(s.id) })}
            </small>
            {hook && (
              <span aria-hidden="true" className="metro-peek">
                <b className="mb-1 block font-display text-xs tracking-wider text-[#ffd54a] uppercase">
                  {t("home.stop.peek")}
                </b>
                {hook.length > 150 ? `${hook.slice(0, 150)}…` : hook}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
