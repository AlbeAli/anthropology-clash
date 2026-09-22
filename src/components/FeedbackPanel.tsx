import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { Level, Scenario } from "../schema/scenario.schema";

type Props = {
  content: Scenario["levels"][Level];
  level: Level;
  choiceId: string;
};

export default function FeedbackPanel({ content, level, choiceId }: Props) {
  const { t } = useTranslation();
  const heading = useRef<HTMLHeadingElement>(null);
  const chosen = content.choices.find((c) => c.id === choiceId);
  const others = content.choices.filter((c) => c.id !== choiceId);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [choiceId]);

  return (
    <div className="space-y-8">
      <section aria-labelledby="outcome-heading" className="space-y-3">
        <h2
          id="outcome-heading"
          ref={heading}
          tabIndex={-1}
          className="scroll-mt-6 font-mono text-xs uppercase tracking-widest text-clay"
        >
          {t("scenario.outcome")}
        </h2>
        <div className="space-y-3 rounded-sm border border-accent bg-surface px-5 py-5">
          <p className="flex items-start gap-3 text-sm text-ink-soft">
            <span
              aria-hidden="true"
              className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-accent font-mono text-[11px] font-medium uppercase text-surface"
            >
              {choiceId}
            </span>
            <span>{chosen?.text}</span>
          </p>
          <p className="font-serif text-lg leading-relaxed text-pretty">
            {content.feedback[choiceId]}
          </p>
        </div>
      </section>

      <section aria-labelledby="alternatives-heading" className="space-y-3">
        <h2
          id="alternatives-heading"
          className="font-mono text-xs uppercase tracking-widest text-clay"
        >
          {t("scenario.alternatives")}
        </h2>
        <ul className="space-y-3">
          {others.map((c) => (
            <li key={c.id} className="space-y-2 rounded-sm border border-line bg-surface px-5 py-4">
              <p className="flex items-start gap-3 text-sm text-ink-soft">
                <span
                  aria-hidden="true"
                  className="flex size-5 shrink-0 items-center justify-center rounded-sm border border-line font-mono text-[11px] font-medium uppercase"
                >
                  {c.id}
                </span>
                <span>{c.text}</span>
              </p>
              <p className="font-serif leading-relaxed text-pretty">{content.feedback[c.id]}</p>
            </li>
          ))}
        </ul>
      </section>

      <details
        open={level === "studente"}
        className="group rounded-sm border border-line bg-surface"
      >
        <summary className="cursor-pointer list-none px-5 py-3 font-mono text-xs uppercase tracking-widest text-ink-soft marker:hidden hover:text-accent">
          <span
            aria-hidden="true"
            className="mr-2 inline-block transition-transform group-open:rotate-90"
          >
            ›
          </span>
          {t("scenario.source")}
        </summary>
        <p className="border-t border-line px-5 py-4 text-sm leading-relaxed text-ink-soft">
          {content.source}
        </p>
      </details>

      {level === "studente" && content.deepen && (
        <section aria-labelledby="deepen-heading" className="space-y-3">
          <h2 id="deepen-heading" className="font-mono text-xs uppercase tracking-widest text-clay">
            {t("scenario.deepen")}
          </h2>
          <ol className="divide-y divide-line rounded-sm border border-line bg-surface">
            {content.deepen.map((d) => (
              <li key={d.ref} className="space-y-2 px-5 py-4">
                <p className="font-medium">
                  {d.url ? (
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent underline decoration-line underline-offset-4 hover:decoration-accent"
                    >
                      {d.ref}
                      <span aria-hidden="true"> ↗</span>
                      <span className="sr-only"> ({t("scenario.newTab")})</span>
                    </a>
                  ) : (
                    d.ref
                  )}
                </p>
                <p className="text-sm leading-relaxed text-ink-soft">{d.why}</p>
                <p>
                  <span className="inline-block rounded-sm border border-line bg-bg px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide text-ink-soft">
                    {t(`access.${d.access}`)}
                  </span>
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
