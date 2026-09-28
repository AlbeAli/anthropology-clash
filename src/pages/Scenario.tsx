import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import type { Level, Scenario } from "../schema/scenario.schema";
import { getScenario, getScenarios } from "../engine/content";
import { nextInSequence } from "../engine/progress";
import { lineColor, stopNumber } from "../engine/lines";
import { DEFAULT_LANG } from "../i18n";
import { useAppState } from "../state/AppState";
import { track } from "../engine/analytics";
import ScenarioCard from "../components/ScenarioCard";
import FeedbackPanel from "../components/FeedbackPanel";
import LevelToggle from "../components/LevelToggle";
import LineBullet from "../components/metro/LineBullet";
import LineStrip from "../components/metro/LineStrip";
import SplitFlap from "../components/metro/SplitFlap";
import { legTag } from "../components/metro/legTag";
import { useRouteLights } from "../components/metro/useRouteLights";
import NotFound from "./NotFound";

export default function ScenarioPage() {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const { level, setLevel, state } = useAppState();
  const scenario = getScenario(DEFAULT_LANG, id);

  if (!scenario) {
    return <NotFound />;
  }

  const line = t(`lines.${scenario.concept}.name`);

  return (
    <div className="mx-auto max-w-3xl" style={{ ["--lc" as string]: lineColor(scenario.concept) }}>
      <LineStrip key={scenario.id} scenario={scenario} completed={state.completed} />
      <header className="relative mb-6 flex items-center gap-4 overflow-hidden rounded-xl bg-[#1a1a1a] px-5 py-5 text-white sm:gap-5 sm:px-6">
        <LineBullet concept={scenario.concept} />
        <div className="min-w-0">
          <p className="font-display text-sm font-bold opacity-85">
            {t("scenario.sign", {
              line,
              n: stopNumber(scenario.id),
              concept: scenario.concept_label,
            })}
          </p>
          <h1 className="font-display text-3xl leading-tight font-extrabold tracking-tight text-balance sm:text-5xl">
            {scenario.title}
          </h1>
        </div>
        <span
          key={scenario.id}
          aria-hidden="true"
          className="sign-bar absolute inset-x-0 bottom-0 h-1.5 bg-(--lc)"
        />
      </header>
      <div className="mb-7">
        <LevelToggle level={level} onChange={setLevel} />
      </div>
      <ScenarioPlay key={`${scenario.id}-${level}`} scenario={scenario} level={level} />
    </div>
  );
}

function ScenarioPlay({ scenario, level }: { scenario: Scenario; level: Level }) {
  const { t } = useTranslation();
  const { state, complete } = useAppState();
  const [choiceId, setChoiceId] = useState<string | null>(null);
  const [wasVisited] = useState(() => scenario.id in state.completed);
  const route = useRef<HTMLDivElement>(null);
  useRouteLights(route, choiceId ?? "open");

  useEffect(() => {
    track("scenario_started", { scenario: scenario.id, level });
  }, [scenario.id, level]);

  function select(choice: string) {
    setChoiceId(choice);
    complete({ scenarioId: scenario.id, concept: scenario.concept, choice });
  }

  const ids = getScenarios(DEFAULT_LANG).map((s) => s.id);
  const allDone = ids.every((i) => i in state.completed);
  const next = getScenario(DEFAULT_LANG, nextInSequence(state, ids) ?? ids[0]);

  return (
    <>
      <p className="mb-6 text-[15px] text-ink-soft">
        {wasVisited && !choiceId ? t("scenario.hintVisited") : t("scenario.hintScroll")}
      </p>
      <p className="sr-only" aria-live="polite">
        {choiceId ? t("scenario.live") : ""}
      </p>
      <div ref={route} className="route">
        <span aria-hidden="true" className="route-rail" />
        <span aria-hidden="true" className="route-fill" />
        <ScenarioCard scenario={scenario} level={level} choiceId={choiceId} onSelect={select} />
        {choiceId && (
          <>
            <FeedbackPanel content={scenario.levels[level]} level={level} choiceId={choiceId} />
            {next && (
              <section className="leg" data-main="" aria-labelledby="arrival-heading">
                <h2 id="arrival-heading" className={legTag}>
                  {t("scenario.legs.arrival")}
                </h2>
                <div className="leg-body">
                  <span className="stamp mb-3.5 inline-flex items-center gap-2 rounded-md border-[3px] border-(--lc) bg-bg px-3 py-1.5 font-display text-sm font-extrabold tracking-wider uppercase">
                    <i aria-hidden="true" className="size-3 rounded-full bg-(--lc)" />
                    {t("scenario.stamp")}
                  </span>
                  <div className="grid items-center gap-4 rounded-xl bg-[#1a1a1a] p-5 text-white sm:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="min-w-0">
                      <p className="mb-1.5 font-display text-sm font-bold opacity-80">
                        {allDone
                          ? t("scenario.allDone")
                          : t("scenario.nextStop", {
                              line: t(`lines.${next.concept}.name`),
                              n: stopNumber(next.id),
                            })}
                      </p>
                      <SplitFlap text={next.title} className="text-lg leading-snug sm:text-2xl" />
                    </div>
                    <Link
                      to={`/s/${next.id}`}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-white px-5 font-display font-extrabold text-[#1a1a1a] transition-transform duration-200 ease-out-expo hover:-translate-y-0.5"
                    >
                      {t("scenario.go")}
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    <Link
                      to="/"
                      className="inline-flex min-h-12 items-center rounded-md border-[3px] border-ink px-5 font-display font-extrabold transition-transform duration-200 ease-out-expo hover:-translate-y-0.5"
                    >
                      {t("scenario.backToMap")}
                    </Link>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
