import { Suspense, use, useMemo, type ReactNode } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { buildBibliography } from "../engine/bibliography";
import { getEntry, loadScenarios } from "../engine/content";
import { DEFAULT_LANG } from "../i18n";
import LineBullet from "../components/metro/LineBullet";
import { useAccount } from "../state/Account";

const SECTIONS = ["origin", "criteria", "limits", "ethics", "privacy", "bibliography"] as const;

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-32 space-y-3">
      <h2
        id={`${id}-heading`}
        className="border-t-[3px] border-ink pt-4 font-display text-2xl font-extrabold"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function Method() {
  const { t } = useTranslation();
  const { available } = useAccount();
  const paragraphs = (key: string) => t(key, { returnObjects: true }) as string[];

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div className="space-y-4">
        <h1 className="font-display text-4xl leading-tight font-extrabold tracking-tight text-balance sm:text-5xl">
          {t("method.title")}
        </h1>
        <p className="max-w-[58ch] text-lg leading-relaxed text-ink-soft">{t("method.lead")}</p>
        <nav aria-label={t("method.jump")} className="flex flex-wrap gap-2">
          {SECTIONS.map((id) => (
            <a
              key={id}
              href={`#${id}`}
              className="inline-flex min-h-11 items-center rounded-full border-2 border-ink px-4 font-display text-sm font-bold transition-colors hover:bg-surface"
            >
              {t(`method.${id}.title`)}
            </a>
          ))}
        </nav>
      </div>

      <Section id="origin" title={t("method.origin.title")}>
        {paragraphs("method.origin.body").map((p, i) => (
          <p key={i} className="max-w-[65ch] leading-relaxed">
            {p}
          </p>
        ))}
      </Section>

      <Section id="criteria" title={t("method.criteria.title")}>
        <ul className="max-w-[65ch] list-disc space-y-2 pl-5 leading-relaxed marker:text-ink-soft">
          {paragraphs("method.criteria.items").map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </Section>

      {(["limits", "ethics", "privacy"] as const).map((id) => (
        <Section key={id} id={id} title={t(`method.${id}.title`)}>
          {paragraphs(
            id === "privacy" && !available ? "method.privacy.bodyLocal" : `method.${id}.body`,
          ).map((p, i) => (
            <p key={i} className="max-w-[65ch] leading-relaxed">
              {p}
            </p>
          ))}
          {id === "privacy" && available && (
            <p>
              <Link to="/privacy" className="font-bold underline underline-offset-4">
                {t("method.privacy.link")}
              </Link>
            </p>
          )}
        </Section>
      ))}

      <Section id="bibliography" title={t("method.bibliography.title")}>
        <Suspense fallback={<div className="min-h-48" />}>
          <Bibliography />
        </Suspense>
      </Section>
    </div>
  );
}

function Bibliography() {
  const { t } = useTranslation();
  const scenarios = use(loadScenarios(DEFAULT_LANG));
  const bibliography = useMemo(() => buildBibliography(scenarios, DEFAULT_LANG), [scenarios]);

  return (
    <>
      <p className="max-w-[65ch] text-[15px] leading-relaxed text-ink-soft">
        {t("method.bibliography.note", { count: bibliography.length })}
      </p>
      <ol className="divide-y divide-line overflow-hidden rounded-xl border-2 border-line">
        {bibliography.map((entry) => (
          <li key={entry.ref} className="space-y-2.5 px-4 py-4 sm:px-5">
            <p className="font-bold">
              {entry.url ? (
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-2 underline-offset-4"
                >
                  {entry.ref}
                  <span aria-hidden="true"> ↗</span>
                  <span className="sr-only"> ({t("scenario.newTab")})</span>
                </a>
              ) : (
                entry.ref
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {entry.access && (
                <span className="rounded border-2 border-ink px-2 py-0.5 font-display text-xs font-bold tracking-wide uppercase">
                  {t(`access.${entry.access}`)}
                </span>
              )}
              {entry.scenarios.map((id) => {
                const s = getEntry(DEFAULT_LANG, id);
                return (
                  <Link
                    key={id}
                    to={`/s/${id}`}
                    className="inline-flex min-h-9 items-center gap-2 rounded-full bg-surface py-1 pr-3 pl-1 text-sm font-bold hover:underline"
                  >
                    {s && <LineBullet concept={s.concept} size="sm" />}
                    {s?.title ?? id}
                  </Link>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
