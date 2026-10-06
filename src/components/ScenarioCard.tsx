import { useTranslation } from "react-i18next";
import type { Level, Scenario } from "../schema/scenario.schema";
import ChoiceButton from "./ChoiceButton";
import GlossaryText, { useGlossary } from "./GlossaryText";
import { legTag } from "./metro/legTag";

type Props = {
  scenario: Scenario;
  level: Level;
  choiceId: string | null;
  onSelect: (choiceId: string) => void;
};

export default function ScenarioCard({ scenario, level, choiceId, onSelect }: Props) {
  const { t } = useTranslation();
  const content = scenario.levels[level];
  const glossary = useGlossary(scenario.lang, scenario.glossary);

  return (
    <>
      {content.hook ? (
        <section className="leg" data-main="" aria-labelledby="hook-heading">
          <h2 id="hook-heading" className={legTag}>
            {t("scenario.hook")}
            <em className="font-bold text-ink-soft not-italic">{t("scenario.legs.start")}</em>
          </h2>
          <div className="leg-body">
            <p className="max-w-[62ch] text-ink-soft">{content.hook}</p>
          </div>
        </section>
      ) : null}

      <section className="leg" data-main="" aria-labelledby="field-heading">
        <h2 id="field-heading" className={legTag}>
          {t("scenario.legs.field")}
          <em className="font-bold text-ink-soft not-italic">{scenario.concept_label}</em>
        </h2>
        <div className="leg-body">
          <GlossaryText
            key={level}
            text={content.setup}
            entries={glossary}
            className="max-w-[62ch] text-lg leading-relaxed text-pretty sm:text-xl"
          />
        </div>
      </section>

      <section className="leg" data-main="" aria-labelledby="choices-heading">
        <h2 id="choices-heading" className={legTag}>
          {t("scenario.legs.choices")}
        </h2>
        <ul className="leg-body grid gap-3">
          {content.choices.map((choice, i) => (
            <li key={choice.id}>
              <ChoiceButton
                id={choice.id}
                number={i + 1}
                text={choice.text}
                onSelect={onSelect}
                state={choiceId === null ? "open" : choiceId === choice.id ? "chosen" : "other"}
              />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
