import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { getCatalog, loadGlossary } from "../engine/content";
import { DEFAULT_LANG } from "../i18n";
import type { GlossaryEntry, GlossaryKind } from "../schema/scenario.schema";

const KINDS: readonly GlossaryKind[] = ["popolo", "luogo", "pratica"];

export default function Glossary() {
  const { t, i18n } = useTranslation();
  const { hash } = useLocation();
  const [entries, setEntries] = useState<GlossaryEntry[] | null>(null);
  const scenarios = getCatalog(DEFAULT_LANG);

  useEffect(() => {
    let live = true;
    loadGlossary(DEFAULT_LANG)
      .then((all) => live && setEntries(all))
      .catch(() => live && setEntries([]));
    return () => {
      live = false;
    };
  }, []);

  const current = decodeURIComponent(hash.slice(1));

  useEffect(() => {
    if (!entries || !current) return;
    document.getElementById(current)?.scrollIntoView();
  }, [entries, current]);

  const sorted = [...(entries ?? [])].sort((a, b) => a.term.localeCompare(b.term, i18n.language));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-3 font-display text-4xl leading-tight font-extrabold tracking-tight text-balance sm:text-5xl">
        {t("glossary.title")}
      </h1>
      <p className="mb-9 max-w-2xl text-justify text-lg hyphens-auto text-ink-soft">
        {t("glossary.lead")}
      </p>

      {KINDS.map((kind) => {
        const group = sorted.filter((e) => e.kind === kind);
        if (group.length === 0) return null;
        return (
          <section key={kind} aria-labelledby={`kind-${kind}`} className="mb-10">
            <h2
              id={`kind-${kind}`}
              className="mb-4 border-b-[3px] border-ink pb-2 font-display text-2xl font-extrabold"
            >
              {t(`glossary.kinds.${kind}`)}
            </h2>
            <ul className="grid gap-6">
              {group.map((e) => {
                const usedIn = scenarios.filter((s) => s.glossary?.includes(e.id));
                return (
                  <li
                    key={e.id}
                    id={e.id}
                    data-current={e.id === current || undefined}
                    className="scroll-mt-32 rounded-lg data-current:-mx-4 data-current:bg-surface data-current:px-4 data-current:py-3 data-current:shadow-[inset_4px_0_0_var(--color-accent)]"
                  >
                    <h3 className="font-display text-xl font-extrabold">{e.term}</h3>
                    <p className="mt-1 max-w-2xl text-justify leading-relaxed hyphens-auto">
                      {e.text}
                    </p>
                    <p className="mt-2 text-sm text-ink-soft">
                      <span className="font-bold">
                        {t("glossary.source", { count: e.source.length })}:
                      </span>{" "}
                      {e.source.join("; ")}
                    </p>
                    {usedIn.length > 0 && (
                      <p className="mt-2 text-sm">
                        <span className="font-bold">{t("glossary.usedIn")}:</span>{" "}
                        {usedIn.map((s, i) => (
                          <span key={s.id}>
                            {i > 0 && ", "}
                            <Link
                              to={`/s/${s.id}`}
                              className="font-bold underline decoration-2 underline-offset-4 hover:text-accent"
                            >
                              {s.title}
                            </Link>
                          </span>
                        ))}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
