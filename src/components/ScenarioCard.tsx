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
    <article className="space-y-8">
      <header className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-clay">
          <span className="text-ink-soft">{t("scenario.concept")}</span> · {scenario.concept_label}
        </p>
        <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl">
          {scenario.title}
        </h1>
      </header>

      <p className="font-serif text-lg leading-relaxed text-pretty sm:text-xl">{content.setup}</p>

      <section aria-labelledby="choices-heading" className="space-y-3">
        <h2 id="choices-heading" className="font-mono text-xs uppercase tracking-widest text-clay">
          {t("scenario.choices")}
        </h2>
        <ul className="space-y-2">
          {content.choices.map((choice) => (
            <li key={choice.id}>
              <ChoiceButton id={choice.id} text={choice.text} onSelect={onSelect} />
            </li>
          ))}
        </ul>
      </section>

      <footer className="border-t border-line pt-4 text-sm leading-relaxed text-ink-soft">
        <span className="font-mono text-xs uppercase tracking-widest">{t("scenario.source")}</span>
        <p className="mt-1">{content.source}</p>
      </footer>
    </article>
  );
}
