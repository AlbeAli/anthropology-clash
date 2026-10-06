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
  const sheet = useRef<HTMLElement>(null);

  useEffect(() => {
    const note = sheet.current;
    const term = opener.current;
    if (!note || !term || getComputedStyle(note).position !== "fixed") return;
    const covered = term.getBoundingClientRect().bottom + 16 - note.getBoundingClientRect().top;
    if (covered > 0) window.scrollBy(0, covered);
    function outside(e: PointerEvent) {
      const target = e.target as Element;
      if (note!.contains(target) || target.closest(`[aria-controls="${noteId}"]`)) return;
      setOpenId(null);
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [openId, noteId]);

  function close() {
    setOpenId(null);
    opener.current?.focus({ preventScroll: true });
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
            ref={sheet}
            aria-labelledby={`${noteId}-term`}
            className="fixed inset-x-0 bottom-0 z-30 max-h-[50dvh] overflow-y-auto rounded-t-xl border-t-4 border-t-accent bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgb(0_0_0/0.18)] sm:static sm:mt-4 sm:max-h-none sm:max-w-[62ch] sm:overflow-visible sm:rounded-lg sm:border sm:border-line sm:border-l-4 sm:border-l-accent sm:p-5 sm:shadow-none"
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
            <p className="mt-2 text-lg leading-relaxed sm:text-base">{open.text}</p>
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
            <div
              aria-hidden="true"
              className="pointer-events-none sticky -bottom-4 -mx-4 -mb-4 h-10 bg-linear-to-t from-surface sm:hidden"
            />
          </aside>
        )}
      </div>
    </div>
  );
}
