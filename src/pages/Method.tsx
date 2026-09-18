import type { ReactNode } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { buildBibliography } from "../engine/bibliography";
import { getScenario } from "../engine/content";
import { DEFAULT_LANG } from "../i18n";

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-heading`} className="space-y-3">
      <h2 id={`${id}-heading`} className="font-mono text-xs uppercase tracking-widest text-clay">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function Method() {
  const { t } = useTranslation();
  const paragraphs = (key: string) => t(key, { returnObjects: true }) as string[];
  const bibliography = buildBibliography(DEFAULT_LANG);

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-clay">{t("nav.method")}</p>
        <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          {t("method.title")}
        </h1>
        <p className="max-w-prose font-serif text-lg leading-relaxed text-ink-soft">
          {t("method.lead")}
        </p>
      </div>

      <Section id="origin" title={t("method.origin.title")}>
        {paragraphs("method.origin.body").map((p, i) => (
          <p key={i} className="max-w-prose leading-relaxed">
            {p}
          </p>
        ))}
      </Section>

      <Section id="criteria" title={t("method.criteria.title")}>
        <ul className="max-w-prose list-disc space-y-2 pl-5 leading-relaxed">
          {paragraphs("method.criteria.items").map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </Section>

      <Section id="limits" title={t("method.limits.title")}>
        {paragraphs("method.limits.body").map((p, i) => (
          <p key={i} className="max-w-prose leading-relaxed">
            {p}
          </p>
        ))}
      </Section>

      <Section id="ethics" title={t("method.ethics.title")}>
        {paragraphs("method.ethics.body").map((p, i) => (
          <p key={i} className="max-w-prose leading-relaxed">
            {p}
          </p>
        ))}
      </Section>

      <Section id="privacy" title={t("method.privacy.title")}>
        {paragraphs("method.privacy.body").map((p, i) => (
          <p key={i} className="max-w-prose leading-relaxed">
            {p}
          </p>
        ))}
      </Section>

      <Section id="bibliography" title={t("method.bibliography.title")}>
        <p className="max-w-prose text-sm leading-relaxed text-ink-soft">
          {t("method.bibliography.note", { count: bibliography.length })}
        </p>
        <ol className="divide-y divide-line rounded-sm border border-line bg-surface">
          {bibliography.map((entry) => (
            <li key={entry.ref} className="space-y-2 px-5 py-4">
              <p className="font-medium">
                {entry.url ? (
                  <a
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent underline decoration-line underline-offset-4 hover:decoration-accent"
                  >
                    {entry.ref}
                    <span aria-hidden="true"> ↗</span>
                    <span className="sr-only"> ({t("scenario.newTab")})</span>
                  </a>
                ) : (
                  entry.ref
                )}
              </p>
              <p className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-ink-soft">
                {entry.access && (
                  <span className="rounded-sm border border-line bg-bg px-2 py-0.5">
                    {t(`access.${entry.access}`)}
                  </span>
                )}
                {entry.scenarios.map((id) => (
                  <Link key={id} to={`/s/${id}`} className="hover:text-accent">
                    {getScenario(DEFAULT_LANG, id)?.title ?? id}
                  </Link>
                ))}
              </p>
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
}
