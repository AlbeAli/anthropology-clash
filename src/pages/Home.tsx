import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { getScenarios } from "../engine/content";
import { DEFAULT_LANG } from "../i18n";

export default function Home() {
  const { t } = useTranslation();
  const first = getScenarios(DEFAULT_LANG)[0];

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <p className="font-mono text-xs uppercase tracking-widest text-clay">{t("home.kicker")}</p>
        <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight text-balance sm:text-5xl">
          {t("app.name")}
        </h1>
        <p className="max-w-prose font-serif text-lg leading-relaxed text-ink-soft sm:text-xl">
          {t("app.tagline")}
        </p>
      </div>
      {first && (
        <Link
          to={`/s/${first.id}`}
          className="inline-flex items-center gap-2 rounded-sm bg-accent px-5 py-3 font-medium text-surface transition-colors hover:bg-ink"
        >
          {t("home.start")}
          <span aria-hidden="true">→</span>
        </Link>
      )}
    </div>
  );
}
