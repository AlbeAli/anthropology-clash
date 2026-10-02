import { Suspense, use, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import type { Level, Scenario } from "../schema/scenario.schema";
import { getEntry, loadScenario, prefetchScenario } from "../engine/content";
import { aulaSteps, stepIndex, type AulaStep } from "../engine/aula";
import { nextInTrip, tripFromSearch } from "../engine/itineraries";
import { lineColor, stopNumber } from "../engine/lines";
import { DEFAULT_LANG } from "../i18n";
import { useAppState } from "../state/AppState";
import LevelToggle from "../components/LevelToggle";
import LineBullet from "../components/metro/LineBullet";
import NotFound from "./NotFound";

const primary =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-ink px-5 font-display font-extrabold text-bg transition-transform duration-200 ease-out-expo hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0";
const outline =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-md border-[3px] border-ink px-5 font-display font-extrabold transition-transform duration-200 ease-out-expo hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0";
const kicker = "mb-5 font-display text-base font-extrabold tracking-wider text-ink-soft uppercase";

export default function Aula() {
  const { id = "" } = useParams();
  const entry = getEntry(DEFAULT_LANG, id);
  if (!entry) return <NotFound />;
  return (
    <Suspense fallback={<div className="min-h-96" />}>
      <AulaBody key={entry.id} id={entry.id} />
    </Suspense>
  );
}

function AulaBody({ id }: { id: string }) {
  const scenario = use(loadScenario(DEFAULT_LANG, id));
  return scenario ? <AulaShow scenario={scenario} /> : <NotFound />;
}

function AulaShow({ scenario }: { scenario: Scenario }) {
  const { t } = useTranslation();
  const { level, setLevel } = useAppState();
  const [params, setParams] = useSearchParams();
  const root = useRef<HTMLDivElement>(null);
  const slide = useRef<HTMLDivElement>(null);
  const moved = useRef(false);
  const [full, setFull] = useState(false);

  const steps = aulaSteps(scenario, level);
  const index = stepIndex(params.get("passo"), steps.length);
  const last = index === steps.length - 1;
  const found = tripFromSearch(DEFAULT_LANG, params);
  const trip = found?.stops.includes(scenario.id) ? found : undefined;
  const nextId = trip ? nextInTrip(trip, scenario.id) : undefined;
  const line = t(`lines.${scenario.concept}.name`);

  function go(target: number) {
    const i = Math.max(0, Math.min(steps.length - 1, target));
    moved.current = true;
    setParams(
      (prev) => {
        const q = new URLSearchParams(prev);
        if (i === 0) q.delete("passo");
        else q.set("passo", String(i + 1));
        return q;
      },
      { replace: true, preventScrollReset: true },
    );
  }

  const goRef = useRef(go);
  const indexRef = useRef(index);
  useLayoutEffect(() => {
    goRef.current = go;
    indexRef.current = index;
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const el = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) return;
      if ((e.key === " " || e.key === "Enter") && el.closest("button, a")) return;
      const i = indexRef.current;
      const map: Record<string, number> = {
        ArrowRight: i + 1,
        PageDown: i + 1,
        " ": i + 1,
        ArrowLeft: i - 1,
        PageUp: i - 1,
        Home: 0,
        End: Number.MAX_SAFE_INTEGER,
      };
      if (!(e.key in map)) return;
      e.preventDefault();
      goRef.current(map[e.key]);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (moved.current) slide.current?.focus({ preventScroll: true });
  }, [index]);

  useEffect(() => {
    const sync = () => setFull(document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  useEffect(() => {
    if (last && nextId) prefetchScenario(DEFAULT_LANG, nextId);
  }, [last, nextId]);

  function toggleFullscreen() {
    try {
      const request = document.fullscreenElement
        ? document.exitFullscreen()
        : root.current?.requestFullscreen();
      request?.catch(() => {});
    } catch {
      /* schermo intero non disponibile */
    }
  }

  return (
    <div ref={root} className="aula" style={{ ["--lc" as string]: lineColor(scenario.concept) }}>
      <div className="mx-auto flex min-h-[calc(100dvh-12rem)] max-w-5xl flex-col">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b-[3px] border-ink pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <LineBullet concept={scenario.concept} />
            <div className="min-w-0">
              <p className="font-display text-sm font-bold text-ink-soft">
                {t("aula.sign", { line, n: stopNumber(scenario.id) })}
              </p>
              <h1 className="font-display text-xl leading-tight font-extrabold">
                {scenario.title}
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <LevelToggle level={level} onChange={setLevel} />
            <Link to={`/s/${scenario.id}${trip?.search ?? ""}`} className={outline}>
              {t("aula.leave")}
            </Link>
          </div>
        </header>

        <div
          ref={slide}
          tabIndex={-1}
          aria-label={t("aula.position", { index: index + 1, total: steps.length })}
          role="group"
          className="flex-1 py-4 outline-none sm:py-8"
        >
          <Slide scenario={scenario} level={level} step={steps[index]} />
        </div>

        <nav
          aria-label={t("aula.controls")}
          className="mt-6 flex flex-wrap items-center gap-3 border-t-[3px] border-ink pt-4"
        >
          <button
            type="button"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            className={outline}
          >
            <span aria-hidden="true">←</span>
            {t("aula.prev")}
          </button>
          {last && nextId && trip ? (
            <Link to={`/aula/${nextId}${trip.search}`} className={primary}>
              {t("aula.nextStop")}
              <span aria-hidden="true">→</span>
            </Link>
          ) : last && trip ? (
            <Link to={trip.href} className={primary}>
              {t("itineraries.back")}
              <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <button type="button" onClick={() => go(index + 1)} disabled={last} className={primary}>
              {t("aula.next")}
              <span aria-hidden="true">→</span>
            </button>
          )}
          <p className="font-display text-sm font-bold text-ink-soft tabular-nums">
            {t("aula.position", { index: index + 1, total: steps.length })}
          </p>
          {document.fullscreenEnabled && (
            <button type="button" onClick={toggleFullscreen} className={`${outline} sm:ml-auto`}>
              {full ? t("aula.exitFullscreen") : t("aula.fullscreen")}
            </button>
          )}
        </nav>
        <p className="mt-3 text-sm text-ink-soft">{t("aula.hint")}</p>
      </div>
    </div>
  );
}

function Slide({ scenario, level, step }: { scenario: Scenario; level: Level; step: AulaStep }) {
  const { t } = useTranslation();
  const content = scenario.levels[level];
  const big = "max-w-[40ch] text-2xl leading-snug text-pretty sm:text-3xl lg:text-4xl";

  switch (step.kind) {
    case "title":
      return (
        <div>
          <p className={kicker}>{scenario.concept_label}</p>
          <p className="mb-8 font-display text-5xl leading-none font-extrabold tracking-tight text-balance sm:text-7xl">
            {scenario.title}
          </p>
          {content.hook && (
            <div className="border-l-8 border-(--lc) pl-5">
              <h2 className={kicker}>{t("scenario.hook")}</h2>
              <p className={big}>{content.hook}</p>
            </div>
          )}
        </div>
      );
    case "setup":
      return (
        <div>
          <h2 className={kicker}>{t("scenario.legs.field")}</h2>
          <p className={big}>{content.setup}</p>
        </div>
      );
    case "choices":
      return (
        <div>
          <h2 className={kicker}>{t("aula.choices")}</h2>
          <ol className="grid gap-5">
            {content.choices.map((c, i) => (
              <li key={c.id} className="flex items-start gap-4">
                <Badge n={i + 1} />
                <span className="text-2xl leading-snug font-bold sm:text-3xl lg:text-4xl">
                  {c.text}
                </span>
              </li>
            ))}
          </ol>
        </div>
      );
    case "exit": {
      const choice = content.choices.find((c) => c.id === step.choiceId);
      return (
        <div>
          <h2 className={kicker}>{t("aula.exit", { n: step.n })}</h2>
          <p className="mb-6 flex items-start gap-4 text-2xl leading-snug font-bold sm:text-3xl lg:text-4xl">
            <Badge n={step.n} />
            {choice?.text}
          </p>
          <p className="max-w-[45ch] text-xl leading-relaxed text-pretty sm:text-2xl lg:text-3xl lg:leading-snug">
            {content.feedback[step.choiceId]}
          </p>
        </div>
      );
    }
    case "source":
      return (
        <div>
          <h2 className={kicker}>{t("scenario.source")}</h2>
          <p className="max-w-[55ch] text-xl leading-relaxed sm:text-2xl">{content.source}</p>
          {level === "studente" && content.deepen && (
            <>
              <h3 className={`${kicker} mt-10`}>{t("scenario.deepen")}</h3>
              <ul className="grid gap-3">
                {content.deepen.map((d) => (
                  <li key={d.ref} className="text-lg leading-snug font-bold sm:text-xl">
                    {d.ref}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      );
    case "discuss":
      return (
        <div>
          <h2 className={kicker}>{t("aula.discuss")}</h2>
          <ol className="grid gap-5">
            {scenario.discuss?.map((q, i) => (
              <li key={q} className="flex items-start gap-4">
                <Badge n={i + 1} />
                <span className="max-w-[60ch] text-xl leading-snug text-pretty sm:text-2xl lg:text-3xl [@media(max-height:800px)]:lg:text-2xl">{q}</span>
              </li>
            ))}
          </ol>
        </div>
      );
  }
}

function Badge({ n }: { n: number }) {
  return (
    <span
      aria-hidden="true"
      className="mt-0.5 inline-grid size-11 shrink-0 place-items-center rounded-md bg-ink font-display text-xl font-extrabold text-bg sm:size-12"
    >
      {n}
    </span>
  );
}
