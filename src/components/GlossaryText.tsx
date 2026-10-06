import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { loadGlossary } from "../engine/content";
import { markTerms } from "../engine/glossary";
import type { GlossaryEntry, Lang } from "../schema/scenario.schema";

export function useGlossary(lang: Lang, ids: string[] | undefined): GlossaryEntry[] {
  const [all, setAll] = useState<GlossaryEntry[]>([]);
  const wanted = Boolean(ids?.length);

  useEffect(() => {
    if (!wanted) return;
    let live = true;
    loadGlossary(lang)
      .then((entries) => live && setAll(entries))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [lang, wanted]);

  return useMemo(() => (ids ? all.filter((e) => ids.includes(e.id)) : []), [all, ids]);
}

type Props = { text: string; entries: GlossaryEntry[]; className?: string };

export default function GlossaryText({ text, entries, className }: Props) {
  const { t } = useTranslation();
  const [openId, setOpenId] = useState<string | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const baseId = useId();
  const noteId = `${baseId}-note`;
  const hintId = `${baseId}-hint`;
  const segments = useMemo(() => markTerms(text, entries), [text, entries]);
  const open = entries.find((e) => e.id === openId);

  function close() {
    setOpenId(null);
    opener.current?.focus();
  }

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) close();
      }}
    >
      <p className={className}>
        {segments.map((s, i) =>
          typeof s === "string" ? (
            s
          ) : (
            <button
              key={i}
              type="button"
              aria-expanded={openId === s.id}
              aria-controls={noteId}
              aria-describedby={hintId}
              onClick={(e) => {
                opener.current = e.currentTarget;
                setOpenId(openId === s.id ? null : s.id);
              }}
              className="cursor-pointer underline decoration-accent decoration-dotted decoration-2 underline-offset-4 hover:text-accent aria-expanded:text-accent aria-expanded:decoration-solid"
            >
              {s.text}
            </button>
          ),
        )}
      </p>
      <span id={hintId} hidden>
        {t("glossary.hint")}
      </span>
      <div id={noteId}>
        {open && (
          <aside
            aria-labelledby={`${noteId}-term`}
            className="mt-4 max-w-[62ch] rounded-lg border border-line border-l-4 border-l-accent bg-surface p-4 sm:p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 id={`${noteId}-term`} className="font-display text-lg font-extrabold">
                {open.term}
              </h3>
              <button
                type="button"
                onClick={close}
                aria-label={t("glossary.close")}
                className="-mt-2 -mr-2 inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-xl text-ink-soft hover:text-accent"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <p className="mt-2 leading-relaxed">{open.text}</p>
            <p className="mt-3 text-sm text-ink-soft">
              <span className="font-bold">
                {t("glossary.source", { count: open.source.length })}:
              </span>{" "}
              {open.source.join("; ")}
            </p>
            <Link
              to={`/glossario#${open.id}`}
              className="mt-3 inline-flex min-h-11 items-center font-display text-sm font-extrabold text-accent underline underline-offset-4"
            >
              {t("glossary.all")} →
            </Link>
          </aside>
        )}
      </div>
    </div>
  );
}
