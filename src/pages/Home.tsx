import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Level } from "../schema/scenario.schema";
import { getScenarios } from "../engine/content";
import { nextInSequence } from "../engine/progress";
import { DEFAULT_LANG } from "../i18n";
import { useAppState } from "../state/AppState";

export default function Home() {
  const { t } = useTranslation();
  const { state, level, levelChosen, setLevel, streak } = useAppState();
  const ids = getScenarios(DEFAULT_LANG).map((s) => s.id);
  const completedCount = ids.filter((id) => id in state.completed).length;
  const nextId = nextInSequence(state, ids) ?? ids[0];
  const allDone = completedCount === ids.length && ids.length > 0;

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <p className="font-mono text-xs uppercase tracking-widest text-clay">{t("home.kicker")}</p>
        <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight text-balance sm:text-5xl">
          {t("app.name")}
        </h1>
        <p className="max-w-prose font-serif text-lg leading-relaxed text-ink-soft sm:text-xl">
          {t("app.tagline")}
        </p>
      </div>

      <section aria-labelledby="level-heading" className="space-y-3">
        <h2 id="level-heading" className="font-mono text-xs uppercase tracking-widest text-clay">
          {t("home.levelHeading")}
        </h2>
        <div
          role="radiogroup"
          aria-labelledby="level-heading"
          className="grid gap-2 sm:grid-cols-2"
        >
          {Level.options.map((option) => {
            const active = levelChosen && level === option;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setLevel(option)}
                className={
                  "space-y-1 rounded-sm border px-4 py-4 text-left transition-colors " +
                  (active
                    ? "border-accent bg-accent-soft"
                    : "border-line bg-surface hover:border-accent")
                }
              >
                <span className="block font-mono text-xs uppercase tracking-wide text-accent">
                  {t(`level.${option}`)}
                </span>
                <span className="block text-sm leading-relaxed text-ink-soft">
                  {t(`home.levels.${option}`)}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="progress-heading" className="space-y-4">
        <h2 id="progress-heading" className="font-mono text-xs uppercase tracking-widest text-clay">
          {t("home.progressHeading")}
        </h2>
        <p className="text-sm text-ink-soft">
          {t("home.progress", { done: completedCount, total: ids.length })} ·{" "}
          {t("streak.days", { count: streak })}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to={`/s/${nextId}`}
            className="inline-flex items-center gap-2 rounded-sm bg-accent px-5 py-3 font-medium text-surface transition-colors hover:bg-accent-strong"
          >
            {allDone ? t("home.replay") : completedCount > 0 ? t("home.continue") : t("home.start")}
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            to="/concetti"
            className="inline-flex items-center gap-2 rounded-sm border border-accent px-5 py-3 font-medium text-accent transition-colors hover:bg-accent-soft"
          >
            {t("home.pickTheme")}
          </Link>
        </div>
      </section>
    </div>
  );
}
