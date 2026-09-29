import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { Concept, ConceptId } from "../../schema/scenario.schema";
import type { CatalogEntry } from "../../engine/content";
import type { Completion } from "../../engine/storage";
import { lineColor, stopNumber } from "../../engine/lines";
import { prefersReducedMotion } from "../../engine/motion";
import LineBullet from "./LineBullet";

type Props = {
  concepts: Concept[];
  scenarios: CatalogEntry[];
  completed: Record<string, Completion>;
  hereId: string | undefined;
  filter: ConceptId | null;
  fresh: string | null;
};

export default function LineMap({ concepts, scenarios, completed, hereId, filter, fresh }: Props) {
  const { t } = useTranslation();
  const hereLine = scenarios.find((s) => s.id === hereId)?.concept;
  const maxStops = Math.max(
    0,
    ...concepts.map((c) => scenarios.filter((s) => s.concept === c.id).length),
  );

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-8 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 lg:gap-y-0">
      {concepts.map((c, i) => {
        const stops = scenarios.filter((s) => s.concept === c.id);
        const done = stops.filter((s) => s.id in completed).length;
        const dimmed = filter !== null && filter !== c.id;
        return (
          <section
            key={c.id}
            aria-label={t("home.map.lineLabel", { line: t(`lines.${c.id}.name`) })}
            className={
              "map-line min-w-0 transition-[opacity,filter] duration-300 " +
              (dimmed ? "max-sm:hidden sm:opacity-15 sm:grayscale" : "")
            }
            style={{
              ["--lc" as string]: lineColor(c.id),
              ["--i" as string]: i,
              ["--rows" as string]: maxStops + 1,
            }}
          >
            <div className="mb-3.5 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2.5 gap-y-0.5">
              <span className="row-span-2">
                <LineBullet concept={c.id} />
              </span>
              <h3 className="font-display text-xl leading-tight font-extrabold">
                {t(`lines.${c.id}.name`)}
              </h3>
              <p className="text-sm leading-snug text-ink-soft">
                {t("home.map.lineCount", { count: done, total: stops.length })}
                <br />
                {c.label}
              </p>
            </div>
            <Stops
              stops={stops}
              completed={completed}
              hereId={hereId}
              fresh={fresh}
              withTrain={hereLine === c.id}
            />
          </section>
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
      className="map-stops metro-rail relative m-0 list-none py-0 pr-0 pl-5"
      style={{ ["--stops" as string]: stops.length }}
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
              className="inline-block leading-tight font-bold decoration-2 underline-offset-4 hover:underline"
            >
              {s.title}
            </Link>
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
