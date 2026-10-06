import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { Lang, Level, Scenario } from "../schema/scenario.schema";
import { prefersReducedMotion } from "../engine/motion";
import { legTag } from "./metro/legTag";
import SourceText from "./SourceText";

type Props = {
  content: Scenario["levels"][Level];
  lang: Lang;
  level: Level;
  choiceId: string;
};

export default function FeedbackPanel({ content, lang, level, choiceId }: Props) {
  const { t } = useTranslation();
  const heading = useRef<HTMLHeadingElement>(null);
  const number = (id: string) => content.choices.findIndex((c) => c.id === id) + 1;
  const chosen = content.choices.find((c) => c.id === choiceId);
  const others = content.choices.filter((c) => c.id !== choiceId);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  }, [choiceId]);

  return (
    <>
      {chosen && (
        <section className="leg" data-main="" aria-labelledby="outcome-heading">
          <h2
            id="outcome-heading"
            ref={heading}
            tabIndex={-1}
            className={legTag + " scroll-mt-24 outline-none"}
          >
            {t("scenario.legs.yourExit")}
          </h2>
          <article className="leg-body rounded-xl border-[3px] border-ink p-5 sm:p-6">
            <Header n={number(chosen.id)} text={chosen.text} filled />
            <p className="text-lg leading-relaxed text-pretty">{content.feedback[chosen.id]}</p>
          </article>
        </section>
      )}

      {others.map((c) => (
        <section key={c.id} className="leg" aria-labelledby={`outcome-${c.id}`}>
          <h2 id={`outcome-${c.id}`} className={legTag}>
            {t("scenario.legs.otherExit", { n: number(c.id) })}
          </h2>
          <article className="leg-body rounded-xl border-[3px] border-line p-5 sm:p-6">
            <Header n={number(c.id)} text={c.text} />
            <p className="leading-relaxed text-pretty">{content.feedback[c.id]}</p>
          </article>
        </section>
      ))}

      {level === "studente" && content.deepen && (
        <section className="leg" aria-labelledby="deepen-heading">
          <h2 id="deepen-heading" className={legTag}>
            {t("scenario.deepen")}
          </h2>
          <ul className="leg-body grid gap-2.5">
            {content.deepen.map((d) => (
              <li key={d.ref} className="rounded-xl bg-surface px-4 py-3.5">
                <p className="font-bold">
                  {d.url ? (
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-2 underline-offset-4 hover:decoration-(--lc)"
                    >
                      {d.ref}
                      <span aria-hidden="true"> ↗</span>
                      <span className="sr-only"> ({t("scenario.newTab")})</span>
                    </a>
                  ) : (
                    d.ref
                  )}
                </p>
                <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">{d.why}</p>
                <p className="mt-2">
                  <span className="inline-block rounded border-2 border-ink px-2 py-0.5 font-display text-xs font-bold tracking-wide uppercase">
                    {t(`access.${d.access}`)}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="leg" aria-labelledby="source-heading">
        <h2 id="source-heading" className={legTag}>
          {t("scenario.source")}
        </h2>
        <p className="leg-body rounded-xl bg-surface px-5 py-4 text-[15px] leading-relaxed">
          <SourceText source={content.source} lang={lang} />
        </p>
      </section>
    </>
  );
}

function Header({ n, text, filled = false }: { n: number; text: string; filled?: boolean }) {
  return (
    <header className="mb-2.5 flex items-center gap-3 font-bold">
      <span
        aria-hidden="true"
        className={
          "inline-grid size-9 shrink-0 place-items-center rounded-md font-display text-[15px] font-extrabold " +
          (filled ? "bg-ink text-bg" : "border-[3px] border-ink")
        }
      >
        {n}
      </span>
      {text}
    </header>
  );
}
