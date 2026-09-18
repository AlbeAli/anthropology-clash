import { useState } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import type { Level, Scenario } from "../schema/scenario.schema";
import { getScenario } from "../engine/content";
import { nextScenarioId } from "../engine/sequence";
import { DEFAULT_LANG } from "../i18n";
import { useAppState } from "../state/AppState";
import ScenarioCard from "../components/ScenarioCard";
import FeedbackPanel from "../components/FeedbackPanel";

export default function ScenarioPage() {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const { level } = useAppState();
  const scenario = getScenario(DEFAULT_LANG, id);

  if (!scenario) {
    return <p className="text-ink-soft">{t("scenario.notFound")}</p>;
  }

  return <ScenarioPlay key={`${scenario.id}-${level}`} scenario={scenario} level={level} />;
}

function ScenarioPlay({ scenario, level }: { scenario: Scenario; level: Level }) {
  const { t } = useTranslation();
  const { complete } = useAppState();
  const [choiceId, setChoiceId] = useState<string | null>(null);
  const nextId = nextScenarioId(DEFAULT_LANG, scenario.id);

  function select(choice: string) {
    setChoiceId(choice);
    complete({ scenarioId: scenario.id, concept: scenario.concept, choice });
  }

  return (
    <div className="space-y-10">
      <ScenarioCard scenario={scenario} level={level} choiceId={choiceId} onSelect={select} />
      {choiceId && (
        <>
          <FeedbackPanel content={scenario.levels[level]} level={level} choiceId={choiceId} />
          <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
            <Link
              to="/concetti"
              className="inline-flex items-center gap-2 rounded-sm border border-line px-4 py-3 text-ink-soft transition-colors hover:border-accent hover:text-accent"
            >
              <span aria-hidden="true">←</span>
              {t("scenario.backToConcepts")}
            </Link>
            {nextId ? (
              <Link
                to={`/s/${nextId}`}
                className="inline-flex items-center gap-2 rounded-sm bg-accent px-5 py-3 font-medium text-surface transition-colors hover:bg-accent-strong"
              >
                {t("scenario.next")}
                <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-sm border border-accent px-5 py-3 font-medium text-accent transition-colors hover:bg-accent-soft"
              >
                {t("scenario.restart")}
              </Link>
            )}
          </nav>
        </>
      )}
    </div>
  );
}
