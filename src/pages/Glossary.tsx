import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { getCatalog, loadGlossary } from "../engine/content";
import { DEFAULT_LANG } from "../i18n";
import type { GlossaryEntry, GlossaryKind } from "../schema/scenario.schema";

const KINDS: readonly GlossaryKind[] = ["popolo", "luogo", "pratica"];

const plain = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function Glossary() {
  const { t, i18n } = useTranslation();
  const { hash } = useLocation();
  const [entries, setEntries] = useState<GlossaryEntry[] | null>(null);
  const [query, setQuery] = useState("");
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

  const needle = plain(query.trim());
  const sorted = [...(entries ?? [])]
    .filter(
      (e) => !needle || plain([e.term, ...(e.forms ?? []), e.text].join(" ")).includes(needle),
    )
    .sort((a, b) => a.term.localeCompare(b.term, i18n.language));
  const kinds = KINDS.filter((kind) => sorted.some((e) => e.kind === kind));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-3 font-display text-4xl leading-tight font-extrabold tracking-tight text-balance sm:text-5xl">
        {t("glossary.title")}
      </h1>
      <p className="mb-9 max-w-2xl text-justify text-lg hyphens-auto text-ink-soft">
        {t("glossary.lead")}
      </p>

      <div className="mb-8 grid gap-4">
        <div>
          <label htmlFor="glossary-search" className="mb-1 block text-sm font-bold">
            {t("glossary.search")}
          </label>
          <input
            id="glossary-search"
            type="search"
            value={query}
            onChange={(ev) => setQuery(ev.target.value)}
            placeholder={t("glossary.searchHint")}
            className="w-full rounded-md border-2 border-ink bg-surface px-3 py-2 text-base"
          />
          <p role="status" className="mt-1 min-h-5 text-sm text-ink-soft">
            {needle && t("glossary.results", { count: sorted.length })}
          </p>
        </div>
        {kinds.length > 1 && (
          <nav aria-label={t("glossary.index")}>
            <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm font-bold">
              {kinds.map((kind) => (
                <li key={kind}>
                  <Link
                    to={{ hash: `kind-${kind}` }}
                    className="underline decoration-2 underline-offset-4 hover:text-accent"
                  >
                    {t(`glossary.kinds.${kind}`)} ({sorted.filter((e) => e.kind === kind).length})
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      {kinds.map((kind) => {
        const group = sorted.filter((e) => e.kind === kind);
        if (group.length === 0) return null;
        return (
          <section key={kind} aria-labelledby={`kind-${kind}`} className="mb-10">
            <h2
              id={`kind-${kind}`}
              className="mb-4 scroll-mt-32 border-b-[3px] border-ink pb-2 font-display text-2xl font-extrabold"
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
