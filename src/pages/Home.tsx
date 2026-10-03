import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { ConceptId } from "../schema/scenario.schema";
import { getCatalog, getConcepts, prefetchScenario } from "../engine/content";
import { dailyStop } from "../engine/daily";
import { nextInSequence } from "../engine/progress";
import { lineColor, stopNumber } from "../engine/lines";
import { DEFAULT_LANG } from "../i18n";
import { useAppState } from "../state/AppState";
import DailyStop from "../components/DailyStop";
import LevelToggle from "../components/LevelToggle";
import LineBullet from "../components/metro/LineBullet";
import LineMap from "../components/metro/LineMap";
import SplitFlap from "../components/metro/SplitFlap";
import CountUp from "../components/metro/CountUp";
import NetworkMap from "../components/metro/NetworkMap";
import { prefersReducedMotion } from "../engine/motion";

export default function Home() {
  const { t } = useTranslation();
  const { state, level, setLevel, recent, clearRecent } = useAppState();
  const scenarios = getCatalog(DEFAULT_LANG);
  const concepts = getConcepts(DEFAULT_LANG);
  const ids = scenarios.map((s) => s.id);
  const visited = ids.filter((id) => id in state.completed).length;
  const allDone = ids.length > 0 && visited === ids.length;
  const next = scenarios.find((s) => s.id === (nextInSequence(state, ids) ?? ids[0]));
  const daily = dailyStop(scenarios);
  const [filter, setFilter] = useState<ConceptId | null>(null);
  const [fresh] = useState(recent);

  useEffect(() => {
    if (recent) clearRecent();
  }, [recent, clearRecent]);

  useEffect(() => {
    if (!next) return;
    import("./Scenario").catch(() => {});
    prefetchScenario(DEFAULT_LANG, next.id);
  }, [next]);

  const toggle = (id: ConceptId) => setFilter((f) => (f === id ? null : id));

  return (
    <div className="mx-auto max-w-6xl">
      <section aria-labelledby="home-title" className="mb-12 grid gap-6">
        {next && (
          <Link
            to={`/s/${next.id}`}
            className="group relative grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 overflow-hidden rounded-xl bg-panel px-4 pt-3.5 pb-5 text-white ring-1 ring-(--panel-ring) transition-transform duration-300 ease-out-expo hover:-translate-y-0.5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-x-5 sm:px-5"
          >
            <LineBullet concept={next.concept} />
            <span className="min-w-0">
              <small className="mb-1 block font-display text-sm font-bold opacity-80">
                {allDone
                  ? t("home.board.again", { line: t(`lines.${next.concept}.name`) })
                  : t("home.board.label", {
                      line: t(`lines.${next.concept}.name`),
                      n: stopNumber(next.id),
                    })}
              </small>
              <SplitFlap text={next.title} className="text-lg leading-snug sm:text-2xl" />
            </span>
            <span className="col-span-2 inline-flex min-h-12 items-center gap-2.5 justify-self-start rounded-md bg-white px-5 font-display font-extrabold text-[#1a1a1a] sm:col-span-1">
              {t("home.board.go")}
              <b
                aria-hidden="true"
                className="transition-transform duration-300 ease-out-expo group-hover:translate-x-1"
              >
                →
              </b>
            </span>
            <span
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-1"
              style={{ background: lineColor(next.concept) }}
            />
          </Link>
        )}

        <div>
          <p className="mb-3 font-display text-sm font-bold tracking-wide text-ink-soft">
            {t("home.kicker")}
          </p>
          <h1
            id="home-title"
            className="mb-3 font-display text-4xl leading-[1.02] font-extrabold tracking-tight text-balance sm:text-6xl"
          >
            {t("home.title", { lines: concepts.length, stops: scenarios.length })}
          </h1>
          <p className="max-w-[52ch] text-lg text-ink-soft sm:text-xl">{t("home.lede")}</p>
        </div>

        <NetworkMap
          concepts={concepts}
          scenarios={scenarios}
          completed={state.completed}
          hereId={next?.id}
          filter={filter}
          onFilter={setFilter}
        />

        {daily && <DailyStop stop={daily} visited={daily.id in state.completed} />}

        <a
          href="#linee"
          onClick={(e) => {
            e.preventDefault();
            document
              .getElementById("linee")
              ?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
          }}
          className="inline-flex min-h-12 items-center gap-2.5 justify-self-center rounded-md border-2 border-ink px-5 font-display font-extrabold"
        >
          {t("home.network.continue")}
          <b aria-hidden="true">↓</b>
        </a>
      </section>

      <div id="linee" className="mb-10 scroll-mt-6">
        <section className="grid content-start gap-4 rounded-xl bg-surface p-5 sm:p-6 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-8">
          <p className="font-display text-5xl leading-none font-extrabold tabular-nums">
            <CountUp to={visited} />
            <small className="ml-2 text-base font-bold text-ink-soft">
              {t("home.visited", { count: visited, total: scenarios.length })}
            </small>
          </p>
          <div role="group" aria-label={t("home.isolate")} className="grid gap-1">
            {concepts.map((c, i) => {
              const stops = scenarios.filter((s) => s.concept === c.id);
              const done = stops.filter((s) => s.id in state.completed).length;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={filter === c.id}
                  onClick={() => toggle(c.id)}
                  className="grid min-h-11 grid-cols-[6.5rem_minmax(0,1fr)_auto] items-center gap-2.5 text-left font-display text-sm font-bold aria-pressed:underline aria-pressed:underline-offset-4"
                >
                  <span>{t(`lines.${c.id}.name`)}</span>
                  <span
                    className="grid grid-cols-4 gap-1"
                    style={{ ["--c" as string]: lineColor(c.id) }}
                  >
                    {stops.map((s, k) => (
                      <i
                        key={s.id}
                        className={
                          "relative h-2.5 overflow-hidden rounded-full bg-line " +
                          (s.id in state.completed ? "metro-seg" : "")
                        }
                        style={{ ["--d" as string]: `${0.4 + i * 0.08 + k * 0.06}s` }}
                      />
                    ))}
                  </span>
                  <span className="text-ink-soft tabular-nums">
                    {done}/{stops.length}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="grid gap-2 border-t border-line pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
            <p className="font-display text-sm font-bold">{t("home.levelHeading")}</p>
            <div>
              <LevelToggle level={level} onChange={setLevel} />
            </div>
            <p className="text-sm leading-relaxed text-ink-soft">{t(`home.levels.${level}`)}</p>
          </div>
        </section>
      </div>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold">{t("home.map.title")}</h2>
          <p className="mt-1 text-base text-ink-soft">{t("home.map.hint")}</p>
        </div>
        {filter && (
          <button
            type="button"
            onClick={() => setFilter(null)}
            className="min-h-11 rounded-full border-2 border-ink px-4 font-display text-sm font-bold"
          >
            {t("home.map.showAll")}
          </button>
        )}
      </div>

      <LineMap
        concepts={concepts}
        scenarios={scenarios}
        completed={state.completed}
        hereId={next?.id}
        filter={filter}
        fresh={fresh}
      />

      <p className="mt-6 flex flex-wrap gap-5 text-base text-ink-soft">
        <Legend kind="done">{t("home.map.legendVisited")}</Legend>
        <Legend kind="here" color={next ? lineColor(next.concept) : undefined}>
          {t("home.map.legendHere")}
        </Legend>
        <Legend kind="todo">{t("home.map.legendTodo")}</Legend>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="h-3.5 w-6 rounded-full border-[3px] border-ink" />
          {t("home.map.legendChange")}
        </span>
      </p>
    </div>
  );
}

function Legend({
  kind,
  color,
  children,
}: {
  kind: "done" | "here" | "todo";
  color?: string;
  children: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className="size-3.5 rounded-full border-[3px] border-ink"
        style={{
          background: kind === "done" ? "var(--ink)" : kind === "here" ? color : "transparent",
        }}
      />
      {children}
    </span>
  );
}
