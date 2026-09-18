import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { getConcepts, getScenarios } from "../engine/content";
import { DEFAULT_LANG } from "../i18n";
import { useAppState } from "../state/AppState";

export default function ConceptLibrary() {
  const { t } = useTranslation();
  const { state } = useAppState();
  const concepts = getConcepts(DEFAULT_LANG);
  const scenarios = getScenarios(DEFAULT_LANG);

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-clay">{t("nav.concepts")}</p>
        <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          {t("concepts.title")}
        </h1>
        <p className="max-w-prose text-ink-soft">{t("concepts.intro")}</p>
      </div>

      <ul className="space-y-6">
        {concepts.map((concept) => {
          const linked = scenarios.filter((s) => s.concept === concept.id);
          return (
            <li key={concept.id} className="space-y-4 rounded-sm border border-line bg-surface p-5">
              <div className="space-y-2">
                <h2 className="font-serif text-2xl font-semibold">{concept.label}</h2>
                <p className="text-sm leading-relaxed text-ink-soft">{concept.definition}</p>
              </div>
              {linked.length === 0 ? (
                <p className="font-mono text-xs uppercase tracking-wide text-ink-soft">
                  {t("concepts.noScenarios")}
                </p>
              ) : (
                <ol className="divide-y divide-line border-t border-line">
                  {linked.map((s) => {
                    const done = state.completed[s.id];
                    return (
                      <li
                        key={s.id}
                        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3"
                      >
                        <Link
                          to={`/s/${s.id}`}
                          className="font-medium text-ink underline decoration-line underline-offset-4 hover:text-accent hover:decoration-accent"
                        >
                          {s.title}
                        </Link>
                        <span
                          className={
                            "font-mono text-[11px] uppercase tracking-wide " +
                            (done ? "text-accent" : "text-ink-soft")
                          }
                        >
                          {done
                            ? t("concepts.done", { level: t(`level.${done.level}`) })
                            : t("concepts.todo")}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
