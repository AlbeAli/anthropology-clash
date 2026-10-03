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
  const [fresh] = useState(recent);
  const [open, setOpen] = useState<ConceptId[]>(() => {
    const lines = [next?.concept, scenarios.find((s) => s.id === recent)?.concept];
    return [...new Set(lines.filter((c): c is ConceptId => !!c))];
  });

  useEffect(() => {
    if (recent) clearRecent();
  }, [recent, clearRecent]);

  useEffect(() => {
    if (!next) return;
    import("./Scenario").catch(() => {});
    prefetchScenario(DEFAULT_LANG, next.id);
  }, [next]);

  const toggle = (id: ConceptId, isOpen: boolean) =>
    setOpen((o) => (isOpen ? [...o, id] : o.filter((c) => c !== id)));

  const openFromMap = (id: ConceptId) => {
    setOpen([id]);
    requestAnimationFrame(() =>
      document
        .getElementById(`linea-${id}`)
        ?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" }),
    );
  };

  return (
    <div className="mx-auto max-w-6xl">
      <section
        aria-labelledby="home-title"
        className="mb-12 grid gap-6 wide-short:grid-cols-[17rem_minmax(0,1fr)] wide-short:gap-x-10"
      >
        <div className="overflow-hidden rounded-xl bg-panel text-white ring-1 ring-(--panel-ring) wide-short:col-span-2">
          {next && (
            <Link
              to={`/s/${next.id}`}
              className="group relative grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 px-4 pt-3.5 pb-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-x-5 sm:px-5"
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
          {daily && <DailyStop stop={daily} visited={daily.id in state.completed} />}
        </div>

        <div className="grid gap-6 self-start lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-end lg:gap-10 wide-short:grid-cols-1">
          <div>
            <p className="mb-3 font-display text-sm font-bold tracking-wide text-ink-soft">
              {t("home.kicker")}
            </p>
            <h1
              id="home-title"
              className="mb-3 font-display text-4xl leading-[1.02] font-extrabold tracking-tight text-balance sm:text-6xl wide-short:text-5xl"
            >
              {t("home.title", { lines: concepts.length, stops: scenarios.length })}
            </h1>
            <p className="max-w-[52ch] text-lg text-ink-soft sm:text-xl">{t("home.lede")}</p>
          </div>

          <div className="grid gap-4">
            <p className="font-display text-4xl leading-none font-extrabold tabular-nums">
              <CountUp to={visited} />
              <small className="ml-2 text-base font-bold text-ink-soft">
                {t("home.visited", { count: visited, total: scenarios.length })}
              </small>
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="font-display text-sm font-bold">{t("home.levelHeading")}</span>
              <LevelToggle level={level} onChange={setLevel} />
              <p className="max-w-[44ch] text-sm leading-relaxed text-ink-soft">
                {t(`home.levels.${level}`)}
              </p>
            </div>
          </div>
        </div>

        <NetworkMap
          concepts={concepts}
          scenarios={scenarios}
          completed={state.completed}
          hereId={next?.id}
          onLine={openFromMap}
        />
      </section>

      <section aria-labelledby="lines-title">
        <h2 id="lines-title" className="font-display text-2xl font-extrabold">
          {t("home.lines.title")}
        </h2>
        <p className="mt-1 mb-5 text-base text-ink-soft">
          {t("home.lines.hint")}
          <span className="md:hidden"> {t("home.lines.hintMini")}</span>
        </p>

        <LineMap
          concepts={concepts}
          scenarios={scenarios}
          completed={state.completed}
          hereId={next?.id}
          fresh={fresh}
          open={open}
          onToggle={toggle}
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
      </section>
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
