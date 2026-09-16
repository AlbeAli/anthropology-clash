import { useTranslation } from "react-i18next";
import type { Level, Scenario } from "../schema/scenario.schema";
import ChoiceButton from "./ChoiceButton";

type Props = {
  scenario: Scenario;
  level: Level;
  onSelect: (choiceId: string) => void;
};

export default function ScenarioCard({ scenario, level, onSelect }: Props) {
  const { t } = useTranslation();
  const content = scenario.levels[level];

  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-wide text-teal-800">
          {t("scenario.concept")}: {scenario.concept_label}
        </p>
        <h1 className="font-serif text-3xl font-semibold">{scenario.title}</h1>
      </header>
      <p className="text-lg leading-relaxed">{content.setup}</p>
      <section aria-label={t("scenario.choices")} className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-600">
          {t("scenario.choices")}
        </h2>
        {content.choices.map((choice) => (
          <ChoiceButton key={choice.id} id={choice.id} text={choice.text} onSelect={onSelect} />
        ))}
      </section>
      <footer className="border-t border-stone-300 pt-3 text-sm text-stone-600">
        <span className="font-semibold">{t("scenario.source")}:</span> {content.source}
      </footer>
    </article>
  );
}
