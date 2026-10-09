import { Suspense, use } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import type { Scenario } from "../schema/scenario.schema";
import { getEntry, loadScenario } from "../engine/content";
import { stopNumber } from "../engine/lines";
import { DEFAULT_LANG } from "../i18n";
import { useAppState } from "../state/AppState";
import LevelToggle from "../components/LevelToggle";
import ContextNotes from "../components/ContextNotes";
import { useGlossary } from "../components/GlossaryText";
import NotFound from "./NotFound";

export default function Sheet() {
  const { id = "" } = useParams();
  const entry = getEntry(DEFAULT_LANG, id);
  if (!entry) return <NotFound />;
  return (
    <Suspense fallback={<div className="min-h-96" />}>
      <SheetBody key={entry.id} id={entry.id} />
    </Suspense>
  );
}

function SheetBody({ id }: { id: string }) {
  const scenario = use(loadScenario(DEFAULT_LANG, id));
  return scenario ? <SheetPage scenario={scenario} /> : <NotFound />;
}

function SheetPage({ scenario }: { scenario: Scenario }) {
  const { t } = useTranslation();
  const { level, setLevel } = useAppState();
  const content = scenario.levels[level];
  const glossary = useGlossary(scenario.lang, scenario.glossary);
  const h2 = "mb-2 font-display text-sm font-extrabold tracking-wider text-ink-soft uppercase";

  return (
    <article className="sheet mx-auto max-w-3xl">
      <div className="no-print mb-6 flex flex-wrap items-center gap-3">
        <LevelToggle level={level} onChange={setLevel} />
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-12 items-center rounded-md bg-ink px-5 font-display font-extrabold text-bg"
        >
          {t("sheet.print")}
        </button>
        <Link
          to={`/s/${scenario.id}`}
          className="font-display font-bold underline decoration-2 underline-offset-4"
        >
          {t("sheet.back")}
        </Link>
      </div>

      <header className="mb-6 border-b-[3px] border-ink pb-4">
        <p className="font-display text-sm font-bold text-ink-soft">
          {t("sheet.sign", {
            line: t(`lines.${scenario.concept}.name`),
            n: stopNumber(scenario.id),
            concept: scenario.concept_label,
            level: t(`level.${level}`),
          })}
        </p>
        <h1 className="font-display text-3xl leading-tight font-extrabold sm:text-4xl">
          {scenario.title}
        </h1>
      </header>

      {content.hook && (
        <section className="sheet-block mb-5">
          <h2 className={h2}>{t("scenario.hook")}</h2>
          <p className="leading-relaxed">{content.hook}</p>
        </section>
      )}
      <section className="sheet-block mb-5">
        <h2 className={h2}>{t("scenario.legs.field")}</h2>
        <p className="leading-relaxed">{content.setup}</p>
      </section>
      <section className="sheet-block mb-5">
        <h2 className={h2}>{t("scenario.legs.choices")}</h2>
        <ol className="grid gap-1.5">
          {content.choices.map((c, i) => (
            <li key={c.id} className="font-bold">
              {i + 1}. {c.text}
            </li>
          ))}
        </ol>
      </section>
      <section className="mb-5">
        <h2 className={h2}>{t("sheet.outcomes")}</h2>
        <ol className="grid gap-3">
          {content.choices.map((c, i) => (
            <li key={c.id} className="sheet-block">
              <p className="font-bold">
                {i + 1}. {c.text}
              </p>
              <p className="leading-relaxed">{content.feedback[c.id]}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="sheet-block mb-5">
        <h2 className={h2}>{t("scenario.source")}</h2>
        <p className="text-[15px] leading-relaxed">{content.source}</p>
      </section>
      {glossary.length > 0 && (
        <section className="mb-5">
          <h2 className={h2}>{t("glossary.notes")}</h2>
          <ContextNotes entries={glossary} className="text-[15px]" />
        </section>
      )}
      {scenario.discuss && (
        <section className="sheet-block mb-5">
          <h2 className={h2}>{t("aula.discuss")}</h2>
          <ol className="grid gap-2">
            {scenario.discuss.map((q, i) => (
              <li key={q} className="leading-relaxed">
                {i + 1}. {q}
              </li>
            ))}
          </ol>
        </section>
      )}
    </article>
  );
}
